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
    # 使用宿主机网络，使 dae 可以通过 127.0.0.1:1080 连接 SpoofDPI
    network_mode: host
    # 提供底层网络操作权限
    privileged: true
    # 避免容器内无法识别当前用户
    environment:
      USER: root
    command:
      # 以 SOCKS5 模式运行
      - --app-mode
      - socks5
      # 仅监听本机，供 dae 使用
      - --listen-addr
      - 127.0.0.1:1080
      # 使用 DoH 解析域名，减少 DNS 污染
      - --dns-mode
      - https
      # 同时解析 IPv4 和 IPv6 记录
      - --dns-qtype
      - all
      # 缓存 DNS 解析结果，减少重复 DoH 查询延迟
      - --dns-cache
      # DNS 超时提高到 10 秒
      - --dns-timeout
      - "10000"
      # 关闭 UDP 假包，避免影响 HY2 速度
      - --udp-fake-count
      - "0"
      # 显示连接和 TLS 分片处理日志
      - --log-level
      # 日常使用选 info；排查连接问题时临时改为 debug
      - info
      # - debug
      # 禁用交互式终端界面
      - --no-tui
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

SpoofDPI 的 SOCKS5 和 TUN 模式属于实验功能。
