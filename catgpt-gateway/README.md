# CatGPT Gateway

基于上游 CatGPT Gateway 指定 commit 构建并发布到 GHCR。当前在构建阶段自动应用兼容补丁：修复上游遗留的 `_increment_thread_count()` 悬空调用、增强 Codex CLI `/v1/responses` 的本地工具调用提示与注入顺序，以及修复持久会话后续轮次丢失工具提示词的问题。原有提示词补丁保留；新增协议补丁遇到上游结构变化时会停止构建，避免发布未经检查的镜像。

上游项目：[GautamVhavle/CatGPT-Gateway](https://github.com/GautamVhavle/CatGPT-Gateway)

## GHCR 镜像

镜像地址：[`ghcr.io/newyorkthink/catgpt-gateway:latest`](https://github.com/newyorkthink/docker_images/pkgs/container/catgpt-gateway)

拉取镜像：

```bash
docker pull ghcr.io/newyorkthink/catgpt-gateway:latest
```

## Docker Compose

先在 `catgpt-gateway` 目录创建本地环境变量文件：

```bash
cp .env.example .env
```

编辑 `.env`，把 `API_TOKEN` 和 `VNC_PASSWORD` 改成自己的随机密码。两者都只是 CatGPT Gateway 本身的鉴权密码，不是 OpenAI API Key。

启动：

```bash
docker compose pull
docker compose up -d
```

首次登录打开：

```text
http://服务器IP:6080/vnc.html
```

在 noVNC 内的 Chromium 打开 `https://chatgpt.com` 并正常登录。浏览器数据保存在 `catgpt_browser_data` volume，容器重启后仍会保留。

OpenAI 兼容 API：

```text
http://服务器IP:8000/v1
```

## 兼容性补丁

### Responses / Messages HTTP 500

当前上游多标签页重构已删除 `_increment_thread_count()` 的定义，但 `/v1/responses` 和 `/v1/messages` 仍保留调用，成功生成响应后会触发 `NameError` 并返回 HTTP 500。

构建工作流会检查 `src/api/openai_routes.py`：仅当该函数没有定义但仍存在调用时，移除这些悬空调用。

### Codex CLI 本地工具调用

上游已经实现 `/v1/responses`、`function_call`、`function_call_output` 和 Codex CLI 测试脚本，但工具调用本质仍通过网页模型的 Prompt Engineering 触发，不是 OpenAI 原生 API function calling。

为避免网页模型把“读取目录、读取文件、执行 shell、修改文件”等请求误判成自身没有权限，构建时会：

- 明确告诉网页模型：这些函数是由 API 客户端在用户机器上执行的真实工具；
- 对依赖本地状态的请求要求优先调用对应工具，禁止猜测结果或只让用户手动执行命令；
- 在 `/v1/responses` 中把工具调用指令放到 Codex 自身系统指令之后、用户请求之前，避免工具规则被较长的 Codex 指令淹没；
- 在持久会话的后续轮次继续保留工具调用提示词，避免首次普通聊天后下一轮“读目录/读文件”只剩用户文本，从而被网页模型误判成普通 Chat。

独立协议补丁 `codex-tools.patch` 还会：

- 保留 `custom` 工具的输入格式与 `namespace` 中的工具定义，避免请求解析或转换时丢失；
- 将自定义工具调用还原为 `custom_tool_call`，保留原始输入、工具名、命名空间及结果关联 ID；
- 统一 SSE 各事件与最终响应中的 item ID，增量开始时使用空参数，避免参数重复；
- 保留工具调用和结果历史，允许连续调用；收到本轮工具结果后不再强制重复执行初始命令；
- 支持 `exec_command`、`shell_command`、`shell`，并尊重 `tool_choice="none"`；
- 明确要求调用工具却没有获得有效调用时返回错误，不把普通文字当作本地操作成功；
- 记录工具名称及不支持的工具类型，不新增文件内容、命令参数或鉴权信息日志。

`check-codex-tools.py` 在临时环境离线检查实际补丁后的请求模型、历史转换和 SSE 事件，不启动浏览器、不执行模型生成的命令。尚不支持的服务端工具类型会记入日志；请求没有任何支持的客户端工具时会明确报错。自定义工具的 grammar 作为提示保留，不提供原生受约束生成保证。

补丁完成后会执行 Python 语法检查、静态条件检查和上述离线协议检查。由于上游工具调用仍依赖网页模型遵循提示词，实际 Codex 文件/终端工具能力仍需要运行时验证，不能等同于原生 function calling。

## 自动构建

独立工作流：`.github/workflows/catgpt-gateway.yml`

- CatGPT Gateway 与 Hermes Agent、SpoofDPI 的工作流完全独立。
- 每 6 小时检查一次上游 `main` 提交；提交未变化时跳过构建。
- 上游有新提交时，按该具体 commit SHA 拉取源码、执行兼容性检查后构建并更新 `latest`。
- 手动触发或修改 CatGPT Gateway 自身目录/工作流时会强制重新构建。
- 删除该镜像时，只需要删除 `catgpt-gateway/` 和 `.github/workflows/catgpt-gateway.yml`，不会影响其他镜像。

