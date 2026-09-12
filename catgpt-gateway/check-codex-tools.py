"""Offline checks against patched upstream functions; no browser or shell calls.

Run with Python and Pydantic 2, passing the upstream source directory.
"""
from pathlib import Path
import ast
import asyncio
from contextlib import asynccontextmanager
import json
import logging
import re
import sys
import time
from types import ModuleType, SimpleNamespace
import unittest
import uuid

source = Path(sys.argv.pop(1)) / 'src/api'
schema_text = (source / 'openai_schemas.py').read_text()
route_text = (source / 'openai_routes.py').read_text()
compile(route_text, str(source / 'openai_routes.py'), 'exec')
schema_module = ModuleType('checked_upstream_schemas')
sys.modules[schema_module.__name__] = schema_module
env = schema_module.__dict__
exec(compile(schema_text, str(source / 'openai_schemas.py'), 'exec'), env)


class HTTPException(Exception):
    def __init__(self, status_code, detail):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class StreamingResponse:
    def __init__(self, body, **kwargs):
        self.body_iterator = body


env.update(json=json, re=re, time=time, uuid=uuid, asyncio=asyncio,
           asynccontextmanager=asynccontextmanager, HTTPException=HTTPException,
           StreamingResponse=StreamingResponse, log=logging.getLogger('protocol-check'),
           Config=SimpleNamespace(PROVIDER='chatgpt', uses_browser=lambda: False))
names = {'_extract_content_text', '_build_prompt', '_build_tool_system_prompt',
         '_extract_json_object', '_parse_tool_calls', '_responses_input_to_messages',
         '_responses_tool_catalog', '_responses_tools_to_chat_tools', '_responses_call_item',
         '_build_response_object', '_stream_response_events', '_extract_persistent_prompt',
         '_estimate_tokens', '_extract_session_id', 'create_response'}
nodes = []
for node in ast.parse(route_text).body:
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in names:
        node.decorator_list = []
        nodes.append(node)
assert {n.name for n in nodes} == names
module = ast.Module(body=[ast.ImportFrom(module='__future__', names=[ast.alias(name='annotations')], level=0)] + nodes, type_ignores=[])
exec(compile(ast.fix_missing_locations(module), '<patched upstream functions>', 'exec'), env)

SHELL = {'type': 'function', 'name': 'exec_command', 'description': 'Read files using the client shell',
         'parameters': {'type': 'object', 'properties': {'cmd': {'type': 'string'}}, 'required': ['cmd']}}
CUSTOM = {'type': 'custom', 'name': 'apply_patch', 'format': {'type': 'grammar', 'syntax': 'lark', 'definition': 'start: "patch"'}}


def call(name='exec_command', arguments=None):
    return json.dumps({'tool_calls': [{'name': name, 'arguments': arguments or {'cmd': 'list-fixture'}}]})


class ProtocolChecks(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.prompts = []
        self.replies = []
        self.first = True

        async def send(prompt, **kwargs):
            self.prompts.append(prompt)
            return SimpleNamespace(message=self.replies.pop(0))

        @asynccontextmanager
        async def clean():
            yield None

        @asynccontextmanager
        async def session(_):
            first = self.first
            self.first = False
            yield None, first

        env.update(_get_client=lambda: SimpleNamespace(send_message=send),
                   _resolve_model_id=lambda model: model,
                   _get_page_pool=lambda: SimpleNamespace(acquire_clean_page=clean),
                   _get_session_manager=lambda: SimpleNamespace(acquire_session_page=session))

    async def request(self, text='读取文件', tools=None, reply=None, stream=False, persistent=False, choice='auto'):
        self.replies.append(reply if reply is not None else call())
        request = env['ResponsesRequest'](input=text, tools=tools if tools is not None else [SHELL],
                                          stream=stream, tool_choice=choice, instructions='Client system context')
        result = await env['create_response'](request, SimpleNamespace(headers={'x-session-id': 'fixture'} if persistent else {}))
        if stream:
            events = []
            async for block in result.body_iterator:
                events.append(json.loads(block.split('data: ', 1)[1]))
            self.assertEqual([e['sequence_number'] for e in events], list(range(len(events))))
            output = events[-1]['response']['output']
            done = [e['item'] for e in events if e['type'] == 'response.output_item.done']
            self.assertEqual(done, output)
            for added in (e for e in events if e['type'] == 'response.output_item.added'):
                item = output[added['output_index']]
                self.assertEqual(added['item']['id'], item['id'])
                if item['type'] != 'message':
                    key = 'input' if item['type'] == 'custom_tool_call' else 'arguments'
                    self.assertEqual(added['item'][key], '')
                    delta = [e['delta'] for e in events if e.get('item_id') == item['id'] and e['type'].endswith('.delta')]
                    self.assertEqual(''.join(delta), item[key])
            return events[-1]['response'], events
        return result, []

    async def test_function_stream_and_nonstream(self):
        for stream in (False, True):
            result, _ = await self.request(stream=stream)
            self.assertEqual(result['output'][0]['type'], 'function_call')
            self.assertEqual(json.loads(result['output'][0]['arguments']), {'cmd': 'list-fixture'})
            self.assertIn('exec_command', self.prompts[-1])
            self.assertIn('Client system context', self.prompts[-1])

    async def test_custom_grammar_and_roundtrip(self):
        raw = '*** Begin Patch\n"quoted" \\ path\n*** End Patch'
        result, events = await self.request(tools=[CUSTOM], reply=call('apply_patch', {'input': raw}), stream=True)
        item = result['output'][0]
        self.assertEqual(item['type'], 'custom_tool_call')
        self.assertEqual(item['input'], raw)
        self.assertNotIn('arguments', item)
        self.assertIn('response.custom_tool_call_input.done', [e['type'] for e in events])
        self.assertEqual(result['tools'][0]['format'], CUSTOM['format'])
        self.assertIn('lark', self.prompts[-1])
        messages = env['_responses_input_to_messages']([item, {'type': 'custom_tool_call_output', 'call_id': item['call_id'], 'output': 'fixture result'}])
        self.assertEqual(messages[0].tool_calls[0].id, messages[1].tool_call_id)
        self.assertEqual(messages[1].content, 'fixture result')

    async def test_namespace_identity(self):
        tools = [{'type': 'namespace', 'name': 'functions', 'tools': [SHELL, CUSTOM]}]
        result, _ = await self.request(tools=tools, reply=call('functions.exec_command'), stream=True)
        self.assertEqual(result['output'][0]['namespace'], 'functions')
        self.assertEqual(result['output'][0]['name'], 'exec_command')
        self.assertEqual(result['tools'], tools)
        result, _ = await self.request(tools=tools, reply=call('functions.apply_patch', {'input': 'patch'}), stream=True, choice={'type': 'custom', 'namespace': 'functions', 'name': 'apply_patch'})
        self.assertEqual(result['output'][0]['namespace'], 'functions')
        self.assertEqual(result['output'][0]['input'], 'patch')

    async def test_persistent_chat_then_two_tool_calls_then_answer(self):
        await self.request(text='你好', reply='你好', persistent=True)
        first, _ = await self.request(persistent=True)
        item = first['output'][0]
        history = [{'role': 'user', 'content': '读取文件'}, item,
                   {'type': 'function_call_output', 'call_id': item['call_id'], 'output': [{'type': 'input_text', 'text': 'fixture.txt'}]}]
        second, _ = await self.request(text=history, persistent=True)
        self.assertIn('fixture.txt', self.prompts[-1])
        self.assertIn('Assistant called tools:', self.prompts[-1])
        self.assertNotIn('You MUST call the function', self.prompts[-1])
        self.assertNotIn('Do NOT call tools again', self.prompts[-1])
        history += [second['output'][0], {'type': 'function_call_output', 'call_id': second['output'][0]['call_id'], 'output': 'fixture contents'}]
        result, _ = await self.request(text=history, reply='fixture contents', persistent=True, stream=True)
        self.assertEqual(result['output_text'], 'fixture contents')
        self.assertIn('tool-calling mode', self.prompts[-1])

    async def test_plain_chat_and_none(self):
        for tools, choice in [([], 'auto'), ([SHELL], 'none')]:
            result, _ = await self.request(tools=tools, choice=choice, reply='ordinary reply', stream=True)
            self.assertEqual(result['output_text'], 'ordinary reply')

    async def test_required_call_is_not_silent_success(self):
        for choice in ['auto', 'required', {'type': 'function', 'name': 'exec_command'}]:
            with self.assertRaises(HTTPException) as error:
                await self.request(choice=choice, reply='I cannot access local files')
            self.assertEqual(error.exception.status_code, 422)

    async def test_shell_names(self):
        for name in ('shell', 'shell_command'):
            result, _ = await self.request(tools=[{**SHELL, 'name': name}], reply=call(name))
            self.assertEqual(result['output'][0]['name'], name)
            self.assertIn(f'You MUST call the function `{name}`', self.prompts[-1])

    async def test_unsupported_and_duplicate_tools(self):
        for tools in [[{'type': 'web_search'}], [SHELL, SHELL]]:
            with self.assertRaises(HTTPException) as error:
                env['_responses_tools_to_chat_tools'](tools)
            self.assertEqual(error.exception.status_code, 400)

    async def test_malformed_custom_payload(self):
        for payload in ({'input': 12}, {'patch': 'wrong field'}):
            with self.assertRaises(HTTPException) as error:
                await self.request(tools=[CUSTOM], reply=call('apply_patch', payload))
            self.assertEqual(error.exception.status_code, 502)

    async def test_output_text_history(self):
        messages = env['_responses_input_to_messages']([{'type': 'message', 'role': 'assistant', 'content': [{'type': 'output_text', 'text': 'previous response'}]}])
        self.assertEqual(messages[0].content, 'previous response')

    async def test_multiple_streamed_calls(self):
        response = json.dumps({'tool_calls': [
            {'name': 'exec_command', 'arguments': {'cmd': 'fixture-read'}},
            {'name': 'apply_patch', 'arguments': {'input': 'patch'}},
        ]})
        result, _ = await self.request(text='perform fixture steps', tools=[SHELL, CUSTOM], reply=response, stream=True)
        self.assertEqual([x['type'] for x in result['output']], ['function_call', 'custom_tool_call'])
        self.assertEqual(len({x['call_id'] for x in result['output']}), 2)

    async def test_flat_forced_choice_and_custom_nonstream(self):
        result, _ = await self.request(choice={'type': 'function', 'name': 'exec_command'})
        self.assertEqual(result['output'][0]['name'], 'exec_command')
        result, _ = await self.request(tools=[CUSTOM], choice={'type': 'custom', 'name': 'apply_patch'}, reply=call('apply_patch', {'input': 'patch'}))
        self.assertEqual(result['output'][0]['input'], 'patch')


if __name__ == '__main__':
    unittest.main()
