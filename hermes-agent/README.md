# Hermes Agent

基于 `nousresearch/hermes-agent:latest` 的增强 Docker 镜像构建配置。

## GHCR 镜像

镜像地址：`ghcr.io/newyorkthink/hermes-agent:latest`

拉取镜像：

```bash
docker pull ghcr.io/newyorkthink/hermes-agent:latest
```

## 文件

- `Dockerfile`：Hermes Agent 增强镜像构建文件。
- `docker/`：远程桌面、VNC/noVNC、Openbox、s6 服务和 AppImage 缩略图支持脚本。
- `docker-compose.yml`：容器运行配置。
- `.dockerignore`：Docker 构建上下文排除规则。

构建 workflow 位于仓库根目录 `.github/workflows/hermes-agent.yml`。
