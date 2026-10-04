# Docker Images

用于维护和自动构建个人使用的 Docker 镜像。AI 修改本仓库前先阅读 [AGENTS.md](./AGENTS.md)。

## 镜像

| 目录 | 镜像 | 构建工作流 |
|---|---|---|
| [`catgpt-gateway/`](./catgpt-gateway) | `ghcr.io/newyorkthink/catgpt-gateway:latest` | `.github/workflows/catgpt-gateway.yml` |
| [`hermes-agent/`](./hermes-agent) | `ghcr.io/newyorkthink/hermes-agent:latest` | `.github/workflows/hermes-agent.yml` |
| [`paddleocr/`](./paddleocr) | `ghcr.io/newyorkthink/paddleocr:latest` | `.github/workflows/paddleocr.yml` |
| [`spoofdpi/`](./spoofdpi) | `ghcr.io/newyorkthink/spoofdpi:latest` | `.github/workflows/spoofdpi.yml` |
| [`whisper-cpp/`](./whisper-cpp) | `ghcr.io/newyorkthink/whisper-cpp:latest` / `:cpu` / `:vulkan` | `.github/workflows/whisper-cpp.yml` |

各镜像的上游来源、用途、构建差异和使用方式写在对应目录的 `README.md` 中。
