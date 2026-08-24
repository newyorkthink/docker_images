# SpoofDPI

使用 SpoofDPI 上游源码构建的极简 Docker 镜像。

上游项目：[xvzc/spoofdpi](https://github.com/xvzc/spoofdpi)

## GHCR 镜像

镜像地址：[`ghcr.io/newyorkthink/spoofdpi:latest`](https://github.com/newyorkthink/docker_images/pkgs/container/spoofdpi)

拉取镜像：

```bash
docker pull ghcr.io/newyorkthink/spoofdpi:latest
```

## 作为 SOCKS5 服务运行

```yaml
services:
  spoofdpi:
    image: ghcr.io/newyorkthink/spoofdpi:latest
    container_name: spoofdpi
    restart: always
    network_mode: host
    command:
      - --app-mode
      - socks5
      - --listen-addr
      - 127.0.0.1:1080
      - --no-tui
```

SpoofDPI 的 SOCKS5 和 TUN 模式属于实验功能。
