# Docker Images

用于维护和自动构建个人使用的 Docker 镜像。AI 修改本仓库前先阅读 [AGENTS.md](./AGENTS.md)。

## 镜像

| 目录 | 镜像 | 构建工作流 |
|---|---|---|
| [`hermes-agent/`](./hermes-agent) | `ghcr.io/newyorkthink/hermes-agent:latest` | `.github/workflows/hermes-agent.yml` |
| [`paddleocr/`](./paddleocr) | `ghcr.io/newyorkthink/paddleocr:latest` | `.github/workflows/paddleocr.yml` |
| [`spoofdpi/`](./spoofdpi) | `ghcr.io/newyorkthink/spoofdpi:latest` | `.github/workflows/spoofdpi.yml` |
| [`umi-ocr/`](./umi-ocr) | `ghcr.io/newyorkthink/umi-ocr:latest` | `.github/workflows/umi-ocr.yml` |
| [`whisper-cpp/`](./whisper-cpp) | `ghcr.io/newyorkthink/whisper-cpp:latest` / `:cpu` / `:vulkan` | `.github/workflows/whisper-cpp.yml` |

各镜像的上游来源、用途、构建差异和使用方式写在对应目录的 `README.md` 中。

## 手动构建

在 GitHub Actions 打开 [Build Docker Images](https://github.com/newyorkthink/docker_images/actions/workflows/build-images.yml)，点击 **Run workflow**，分支选 `main`。下拉框选 `all` 会并行触发上表的五个镜像工作流。单选时只触发对应镜像的工作流。各镜像仍按自己的工作流构建和推送 GHCR 标签。

在 **Build Docker Images** 查看分发结果，在各镜像的 Actions 运行记录查看构建和推送结果。新增、归档或恢复镜像时，同步更新手动入口的目标名单。

## 维护

- [维护脚本](./scripts/README.md)提供仓库同步、提交说明、撤回和归档入口。
- [文档索引](./docs/README.md)提供维护规则和实机验证记录模板。
- [归档索引](./archive/README.md)记录已停用的镜像和恢复步骤。
- [Actions 清理](./.github/workflows/cleanup-actions-runs.yml)每天删除创建超过七天且已结束的运行记录、日志和关联产物。
