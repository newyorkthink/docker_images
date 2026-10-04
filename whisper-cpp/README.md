# whisper.cpp

基于上游 [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp) 当前源码构建并发布到 GHCR。

上游官方 Dockerfile：

- CPU：[.devops/main.Dockerfile](https://github.com/ggml-org/whisper.cpp/blob/master/.devops/main.Dockerfile)
- Vulkan：[.devops/main-vulkan.Dockerfile](https://github.com/ggml-org/whisper.cpp/blob/master/.devops/main-vulkan.Dockerfile)

## CPU 镜像

本目录的 `main.Dockerfile` 保持上游官方 `.devops/main.Dockerfile` 的构建阶段、运行阶段、依赖、目录布局、`COPY`、`PATH` 和 `ENTRYPOINT` 不变，只在官方的：

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

除此之外，不对官方 CPU Dockerfile 做额外精简或重写。

CPU 标签：

```text
ghcr.io/newyorkthink/whisper-cpp:latest
ghcr.io/newyorkthink/whisper-cpp:cpu
```

## Vulkan 镜像

本目录的 `main-vulkan.Dockerfile` 保持上游官方 `.devops/main-vulkan.Dockerfile` 的构建阶段、运行阶段、构建参数、目录布局和 `COPY` 不变，只在 runtime 阶段的官方依赖列表中额外增加：

```text
libegl1
vulkan-tools
```

其中 `libegl1` 用于补齐 NVIDIA Vulkan 运行环境所需的 EGL loader 依赖，已验证可解决容器内 Vulkan 无法识别 NVIDIA GPU 的问题；`vulkan-tools` 提供 `vulkaninfo`，便于后续直接检查 Vulkan 设备和驱动状态。

除此之外，不对官方 Vulkan Dockerfile 做额外精简或重写。

Vulkan 标签：

```text
ghcr.io/newyorkthink/whisper-cpp:vulkan
```

## 自动构建

独立工作流：`.github/workflows/whisper-cpp.yml`

工作流会先获取一次当前上游 `ggml-org/whisper.cpp` 源码，再以同一份上游源码分别使用：

```text
whisper-cpp/main.Dockerfile
whisper-cpp/main-vulkan.Dockerfile
```

构建并推送 CPU 与 Vulkan 镜像。

支持本仓库相关文件 push、每日定时构建和 `workflow_dispatch` 手动触发。
