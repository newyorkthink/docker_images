# PaddleOCR

基于 PaddleX 官方预构建 NVIDIA GPU 镜像，补充 PaddleX Basic Serving 组件后发布到 GHCR，用于运行通用 OCR Pipeline。

上游官方资料：

- PaddleX：[PaddlePaddle/PaddleX](https://github.com/PaddlePaddle/PaddleX)
- Docker 安装说明：[docs/installation/installation.en.md](https://github.com/PaddlePaddle/PaddleX/blob/release/3.7/docs/installation/installation.en.md)
- Serving 说明：[docs/pipeline_deploy/serving.en.md](https://github.com/PaddlePaddle/PaddleX/blob/release/3.7/docs/pipeline_deploy/serving.en.md)

## 官方基线

PaddleX `release/3.7` 的普通 GPU Docker 安装说明直接使用官方预构建镜像：

```text
ccr-2vdh3abv-pub.cnc.bj.baidubce.com/paddlex/paddlex:paddlex3.3.11-paddlepaddle3.2.0-gpu-cuda12.6-cudnn9.5
```

当前上游仓库没有提供与这条普通 PaddleX GPU 预构建镜像对应、供普通 Basic Serving 直接构建的 Dockerfile；上游仓库中的其他 Dockerfile/容器方案主要用于 HPS、生成式模型等独立部署场景。因此本目录不重写官方镜像构建流程，而是直接以官方预构建镜像为基础。

官方 Basic Serving 文档要求先安装 Serving 组件：

```bash
paddlex --install serving
```

之后再通过：

```bash
paddlex --serve --pipeline OCR --device gpu:0
```

启动通用 OCR 服务。

## 与官方镜像的差异

本目录的 `Dockerfile` 只在官方 GPU 镜像基础上增加：

```dockerfile
RUN paddlex --install serving
```

用于在镜像构建阶段一次性安装官方 Basic Serving 组件，避免运行容器时重复安装。除此之外，不修改官方 PaddleX、PaddlePaddle、CUDA、cuDNN 或其他运行环境。

## GHCR 镜像

镜像地址：

```text
ghcr.io/newyorkthink/paddleocr:latest
```

## 自动构建

独立工作流：`.github/workflows/paddleocr.yml`

工作流在本目录或工作流文件发生变更时构建并推送镜像，也支持 `workflow_dispatch` 手动触发。
