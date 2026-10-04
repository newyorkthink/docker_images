# whisper.cpp

基于上游 [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) 当前源码构建并发布到 GHCR。

上游官方 Dockerfile：[.devops/main.Dockerfile](https://github.com/ggml-org/whisper.cpp/blob/master/.devops/main.Dockerfile)

## 与官方 Dockerfile 的差异

本目录的 `Dockerfile` 保持上游官方 `.devops/main.Dockerfile` 的构建阶段、运行阶段、依赖、目录布局、`COPY`、`PATH` 和 `ENTRYPOINT` 不变，只在官方的：

```dockerfile
RUN --mount=type=secret,id=HF_TOKEN,required=false,env=HF_TOKEN make base.en
```

基础上增加：

```text
CMAKE_ARGS="-DGGML_NATIVE=OFF"
```

实际命令为：

```dockerfile
RUN --mount=type=secret,id=HF_TOKEN,required=false,env=HF_TOKEN make CMAKE_ARGS="-DGGML_NATIVE=OFF" base.en
```

原因是 `GGML_NATIVE` 会针对构建机器的 CPU 指令集进行本机优化。GitHub Actions 构建出的二进制在不同 CPU 上运行时可能出现 `Illegal instruction`。关闭 `GGML_NATIVE` 后仍按当前官方构建流程生成镜像，但避免依赖构建机专有指令。

除此之外，不对官方 Dockerfile 做额外精简或重写。

## GHCR 镜像

镜像地址：

```text
ghcr.io/newyorkthink/whisper-cpp:latest
```

拉取镜像：

```bash
docker pull ghcr.io/newyorkthink/whisper-cpp:latest
```

## 自动构建

独立工作流：`.github/workflows/whisper-cpp.yml`

工作流会先获取当前上游 `ggml-org/whisper.cpp` 源码，再以该源码目录作为 Docker build context，使用本目录的 Dockerfile 构建并推送：

```text
ghcr.io/newyorkthink/whisper-cpp:latest
```

支持本仓库相关文件 push、每日定时构建和 `workflow_dispatch` 手动触发。
