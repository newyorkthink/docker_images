# Umi-OCR

基于 Umi-OCR 官方 Linux Dockerfile 构建 CPU OCR 镜像，默认以无头模式提供 HTTP 接口，用于识别本地图片、视频代表帧和文档中的文字。

上游官方资料：

- Umi-OCR：[hiroi-sora/Umi-OCR](https://github.com/hiroi-sora/Umi-OCR)
- Linux 运行环境：[hiroi-sora/Umi-OCR_runtime_linux](https://github.com/hiroi-sora/Umi-OCR_runtime_linux)
- 官方 Dockerfile：[Dockerfile](https://github.com/hiroi-sora/Umi-OCR_runtime_linux/blob/main/Dockerfile)
- Docker 部署说明：[README-docker.md](https://github.com/hiroi-sora/Umi-OCR_runtime_linux/blob/main/README-docker.md)
- HTTP 接口说明：[docs/http/README.md](https://github.com/hiroi-sora/Umi-OCR/blob/main/docs/http/README.md)

## 官方基线

本目录以当前官方 Dockerfile 为基线；上游使用 `debian:11-slim`，本镜像按下述兼容性修复改用 `debian:12-slim`。其余部分保留官方列出的 Qt、Xvfb 和运行依赖安装命令、发行包下载与解压命令，并使用官方 `umi-ocr.sh` 启动程序。

发行包内附带 PaddleOCR-json CPU 引擎。当前镜像仅构建 `linux/amd64`，运行主机的 CPU 必须支持 AVX；此镜像不提供 GPU OCR。

## 与官方 Dockerfile 的差异

将基础镜像从 `debian:11-slim` 调整为 `debian:12-slim`。实际构建中，Debian 11 的安全更新索引指向已无法下载的依赖包，多项下载返回 `404`，导致依赖安装失败。Umi-OCR 上游列明已测试 Debian 12；依赖包列表和安装命令保持不变。

同时增加以下默认环境变量：

```dockerfile
# 默认使用官方无头模式，提供 HTTP 接口服务
ENV HEADLESS=true
```

官方启动脚本在此变量为 `true` 时通过 Xvfb 启用无头模式。将它设为镜像默认值，是为了让容器在没有宿主机桌面连接的情况下直接提供 HTTP 服务，避免默认进入需要 `DISPLAY` 的 GUI 模式。

官方依赖安装命令、发行包下载与解压命令、HTTP 预配置和启动入口均原样保留。构建工作流按本仓库现有方式添加 GHCR 来源标签。

## GHCR 镜像

镜像地址：

```text
ghcr.io/newyorkthink/umi-ocr:latest
```

工作流构建并发布成功后，才可使用该镜像地址拉取镜像。

## 构建与使用

执行位置：Linux 终端。构建命令在本仓库根目录执行。

```bash
# 在本仓库根目录构建 Umi-OCR 镜像
docker build -t ghcr.io/newyorkthink/umi-ocr:latest ./umi-ocr
```

运行时将以下占位符替换为本机实际值：

```bash
# 绑定本次实际使用的宿主机端口
UMI_OCR_PORT='<宿主机端口>'
# 绑定本次容器名称
UMI_OCR_CONTAINER='<容器名称>'
# 启动默认无头的 HTTP 识别服务，并仅绑定宿主机回环接口
docker run -d \
  --name "$UMI_OCR_CONTAINER" \
  -p "127.0.0.1:$UMI_OCR_PORT:1224" \
  ghcr.io/newyorkthink/umi-ocr:latest
```

容器内部 HTTP 服务使用官方默认端口 `1224`。通过图片 OCR 接口 `/api/ocr` 提交 Base64 图片数据并读取识别结果；该调用方式无需挂载宿主机素材目录。其他请求参数和文档识别流程按上游 HTTP 接口说明处理。

无头模式使用容器内部的虚拟显示器，无需挂载宿主机 X11 socket。服务在识别完成后继续运行，不会自动退出；按需使用时，应在本次任务完成并保存结果后停止本次容器。本仓库不提供 Compose 文件，本机部署配置由使用者自行维护。

## 自动构建

独立工作流：`.github/workflows/umi-ocr.yml`

工作流在本目录或工作流文件发生变更时构建并推送镜像，也支持 `workflow_dispatch` 手动触发。只构建 `linux/amd64`，发布标签为 `latest`，构建缓存使用独立的 `umi-ocr` 范围。
