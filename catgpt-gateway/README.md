# CatGPT Gateway

基于上游 CatGPT Gateway 指定 commit 构建并发布到 GHCR。当前仅针对上游多标签页重构后遗留的 `_increment_thread_count()` 悬空调用，在构建阶段自动应用最小兼容补丁；上游恢复定义或移除调用后会自动跳过该补丁。

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

当前上游多标签页重构已删除 `_increment_thread_count()` 的定义，但 `/v1/responses` 和 `/v1/messages` 仍保留调用，成功生成响应后会触发 `NameError` 并返回 HTTP 500。

构建工作流会先检查 `src/api/openai_routes.py`：仅当该函数没有定义但仍存在调用时，移除这些悬空调用并执行 Python 语法检查；如果上游已经修复，则保持上游源码不变。

## 自动构建

独立工作流：`.github/workflows/catgpt-gateway.yml`

- CatGPT Gateway 与 Hermes Agent、SpoofDPI 的工作流完全独立。
- 每 6 小时检查一次上游 `main` 提交；提交未变化时跳过构建。
- 上游有新提交时，按该具体 commit SHA 拉取源码、执行兼容性检查后构建并更新 `latest`。
- 手动触发或修改 CatGPT Gateway 自身目录/工作流时会强制重新构建。
- 删除该镜像时，只需要删除 `catgpt-gateway/` 和 `.github/workflows/catgpt-gateway.yml`，不会影响其他镜像。
