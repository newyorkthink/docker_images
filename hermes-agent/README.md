# Hermes Agent Custom Image

基于 `nousresearch/hermes-agent:latest` 的公开增强镜像，只增加通用工具、轻量桌面和远程访问组件；不覆盖 Hermes 上游的 ENTRYPOINT/CMD，不替换 s6-overlay，也不重装上游自带的 Node/npm 或 Playwright 运行架构。

## 主要内容

以下为本派生 Dockerfile 显式安装的软件和工具；基础镜像先用 `apt-get` 引导安装 `aptitude`，后续系统软件统一由 `aptitude` 安装并保留 Debian 推荐依赖，自动拉取的依赖不逐项展开。

- 办公与文档：`libreoffice`、`libreoffice-gtk3`、`libreoffice-l10n-zh-cn`、`pandoc`、`poppler-utils`、`ghostscript`
- 图像与媒体：`ffmpeg`、`imagemagick`、`sox`、`tesseract-ocr`、`tesseract-ocr-eng`、`tesseract-ocr-chi-sim`、`exiftool`
- 浏览器：`google-chrome-stable`、`firefox-esr`
- 桌面：`openbox`、`tint2`、`xfdesktop4`、`thunar`、`xfce4-helpers`、`xfce4-terminal`、`xfce4-appfinder`、`konqueror`、`lxtask`、`mousepad`、`lxterminal`、`xterm`
- AppImage 桌面支持：`tumbler`、`shared-mime-info`、`libfuse2t64`、`python3-gi`、`python3-pil`、`python3-pyelftools`、`gir1.2-xapp-1.0`、`squashfs-tools`，并内置 Linux Mint `xapp-thumbnailers 1.2.10` 的 AppImage 缩略图实现
- RDP / VNC：`xrdp`、`xorgxrdp`、`xvfb`、`x11vnc`、`novnc`、`websockify`
- RDP 音频：`pulseaudio` + 官方 [`neutrinolabs/pulseaudio-module-xrdp v0.8`](https://github.com/neutrinolabs/pulseaudio-module-xrdp/tree/v0.8)；模块在独立阶段按最终镜像的 PulseAudio 版本编译
- Hermes 语音运行时：`faster-whisper==1.2.1`、`openwakeword==0.6.0`、`onnxruntime==1.27.0`、`sounddevice==0.5.5`、`numpy==2.4.3` + 上游锁文件中的 ONNX 传递依赖 + `libportaudio2`；Python 版本按 Hermes v0.20.2 固定，共享 ONNX 模型在构建期写入镜像并以 `hermes` 用户实际加载
- X11 与桌面控制：`xserver-xorg-core`、`xserver-xorg`、`xinit`、`xauth`、`x11-utils`、`x11-xserver-utils`、`dbus-x11`、`at-spi2-core`、`xdotool`、`wmctrl`、`scrot`、`xclip`
- 中文输入法：`fcitx5`、`fcitx5-chinese-addons`、`fcitx5-frontend-gtk3`、`fcitx5-frontend-qt5`、`fcitx5-frontend-qt6`、`im-config`
- 字体与图标：`fonts-noto`、`fonts-noto-cjk`、`fonts-noto-color-emoji`、`fonts-liberation`、`fonts-dejavu`、`fonts-wqy-zenhei`、`fonts-wqy-microhei`、`xfonts-base`、`xfonts-75dpi`、`fontconfig`、`adwaita-icon-theme`、`adwaita-icon-theme-legacy`、`breeze-icon-theme`、`lxde-icon-theme`
- 常用命令与文件工具：`aptitude`、`newsboat`、`vim`、`tmux`、`strace`、`lsof`、`rsync`、`tree`、`ncdu`、`zstd`、`psmisc`、`moreutils`、`inotify-tools`、`patch`、`less`、`pv`、`time`、`fzf`、`duf`、`dos2unix`、`bsdextrautils`、`gettext-base`、`bc`、`zip`、`unzip`、`p7zip-full`、`jq`、`aria2`、`file`
- 网络与系统工具：`curl`、`wget`、`git`、`procps`、`net-tools`、`iputils-ping`、`iproute2`、`iptables`、`dnsutils`、`socat`、`netcat-openbsd`、`whois`
- 加密与证书工具：`openssl`、`gnupg`
- 开发与底层依赖：`build-essential`、`pkg-config`、`libssl-dev`、`libffi-dev`、`libxml2-dev`、`libxslt1-dev`、`libjpeg-dev`、`libpng-dev`、`libwebp-dev`、`libmagic-dev`、`sqlite3`、`libsqlite3-dev`
- 桌面运行基础：`sudo`、`desktop-file-utils`、`xdg-utils`、`xdg-user-dirs`、`libglib2.0-bin`、`menu`、`lxappearance`、`libgtk2.0-0t64`、`libayatana-appindicator3-1`、`libxcb-cursor0`、`qt5ct`、`qt6ct`
- 基础环境：`locales`、`ca-certificates`、`tzdata`

仓库中不保存任何固定远程桌面密码、Token、私钥、IP 或其他私有配置。

## 镜像与自动构建

GHCR：

```text
ghcr.io/newyorkthink/hermes-agent:latest
```

拉取：

```bash
docker pull ghcr.io/newyorkthink/hermes-agent:latest
```

该 GHCR Package 由当前 `newyorkthink/docker_images` 仓库的 `.github/workflows/hermes-agent.yml` 构建并发布。

GitHub Actions 只发布 `latest`，不上传 Docker Hub，不创建日期标签、提交 SHA 标签、Artifact 或 GitHub Release。

上游基础镜像：

```text
nousresearch/hermes-agent:latest
```

构建规则：

- 每 6 小时检查一次上游镜像 digest；未变化时跳过完整构建，发生变化时重新构建并覆盖 `latest`。
- `main` 分支的 `hermes-agent/Dockerfile`、`hermes-agent/docker/**`、`hermes-agent/.dockerignore`、`.github/workflows/hermes-agent.yml` 发生变化时自动构建。
- README 文档不在 push 构建路径中；单独修改 `hermes-agent/README.md` 不会触发镜像构建。
- 支持 `workflow_dispatch` 手动触发。
- 构建时把实际使用的上游 digest 写入镜像元数据。
- workflow 使用并发队列，不主动取消正在运行的构建。

## 桌面环境

RDP 与 VNC 使用同一套轻量桌面结构：

```text
Openbox             窗口管理器
tint2               面板 / 任务栏
xfdesktop           桌面背景、桌面文件和特殊桌面图标
Application Finder  应用程序搜索与启动入口
Konqueror           主文件管理入口
Thunar              xfdesktop 的文件管理首选应用和桌面特殊图标打开程序
LXTask              轻量图形任务管理器
```

PCManFM 已移除，不再安装或启动。

Openbox 默认 `Super+E` 仍执行 `kfmclient openProfile filemanagement`，因此快捷键继续打开 Konqueror。Thunar 不替换该入口，只负责 xfdesktop 的“主文件夹 / 文件系统 / 回收站 / 设备”等桌面图标，以及 Xfce 首选文件管理器调用。

桌面右键由 xfdesktop 处理；“Open Terminal Here” 使用 Xfce `TerminalEmulator` 首选应用。首次生成用户配置时默认使用：

```text
FileManager=thunar
TerminalEmulator=xfce4-terminal
```

若 `/opt/data/.config/xfce4/helpers.rc` 已经存在其他终端选择，则不会覆盖；仅会把本镜像此前写入的 `debian-x-terminal-emulator` 默认值迁移为 `xfce4-terminal`。

### 应用程序启动器

镜像安装 `xfce4-appfinder`，用于读取系统和用户的 `.desktop` 文件，按分类显示、搜索并启动已安装的 GUI 程序。

首次进入 RDP 或 VNC 桌面会话时，会按 `xdg-user-dir DESKTOP` 返回的实际桌面目录创建一个“应用程序”启动器，来源为：

```text
/usr/share/applications/xfce4-appfinder.desktop
```

启动器使用可执行权限，并通过 `gio` 尝试写入 Xfce/Thunar 使用的 trusted 元数据。初始化标记保存为：

```text
/opt/data/.config/hermes/appfinder-launcher-v1
```

只初始化一次：已有同名桌面文件不会覆盖；初始化完成后，如果用户主动删除桌面上的启动器，也不会在每次登录时重新生成。

Application Finder 只会列出具有可见 `.desktop` 入口的程序；纯命令行工具、`NoDisplay=true` 或没有 `.desktop` 文件的程序不会因为安装了 Application Finder 就自动出现在列表中。

### 主题和图标

远程桌面会话默认使用：

```text
GTK_THEME=Adwaita:dark
```

Openbox 的系统默认窗口主题使用自带的 `Onyx` 深色主题；已有用户 Openbox 配置不会被覆盖。

深色界面与图标主题分开处理：默认图标主题仍为 `Adwaita`，并保留 `Adwaita Legacy`、`Breeze`、`LXDE` 图标资源。Openbox 自定义菜单优先使用全彩 `AdwaitaLegacy` PNG 图标，不把界面切成深色时顺带改成黑色 symbolic 图标。

若用户已在 `~/.config/gtk-3.0/settings.ini` 指定 `gtk-icon-theme-name`，启动脚本不会覆盖；只有未设置时才初始化：

```ini
[Settings]
gtk-icon-theme-name=Adwaita
```

### 持久化

桌面会话统一使用：

```text
HOME=/opt/data
LANG=zh_CN.UTF-8
LANGUAGE=zh_CN:zh
LC_ALL=zh_CN.UTF-8
```

浏览器、Fcitx5、Openbox、xfdesktop、tint2、Konqueror、Thunar 等用户配置都写入 `/opt/data`。运行容器时应把宿主机持久化目录挂载到 `/opt/data`。

xfdesktop 显示实际桌面目录中存在的文件、目录和启动器，并显示启用的特殊桌面图标；不会自动把所有已安装 GUI 程序复制到桌面。实际桌面目录由 `xdg-user-dir DESKTOP` 决定，中文环境下不应在脚本中写死为 `~/Desktop`。

### Hermes API Server 与 `API_SERVER_KEY`

`API_SERVER_KEY` 是 Hermes Agent 上游官方定义的 API Server Bearer Token，不是本派生镜像自定义变量。本仓库不会在 Dockerfile、镜像或 GitHub 仓库中写入任何固定 `API_SERVER_KEY`。

生成 API Server Key：

```bash
# 在 Linux 终端生成 API Server Bearer Token
openssl rand -hex 32
```

把输出写入持久化目录 `./data/.env`，对应容器内 `/opt/data/.env`：

```dotenv
# Hermes API Server Bearer Token
API_SERVER_KEY=这里填写上一步生成的值
```

本部署把 API Server 密钥统一交给 Hermes 的持久化配置管理，唯一来源为 `/opt/data/.env`。Compose 只负责 API Server 的启用状态、监听地址和端口，不传入 `API_SERVER_KEY`：

```yaml
# Hermes OpenAI-compatible API 服务
- API_SERVER_ENABLED=${API_SERVER_ENABLED:-true}
- API_SERVER_HOST=${API_SERVER_HOST:-127.0.0.1}
- API_SERVER_PORT=${API_SERVER_PORT:-8642}
```

不要在 Compose 项目目录的外层 `.env` 中再添加 `API_SERVER_KEY`，也不要在 `docker-compose.yml` 中添加：

```yaml
- API_SERVER_KEY=${API_SERVER_KEY}
```

这样只维护 `/opt/data/.env` 中的一份 Key，避免外层 Compose `.env` 与 Hermes 持久化 `.env` 同时存在同名密钥造成优先级、轮换和排障混乱。`API_SERVER_ENABLED`、`API_SERVER_HOST` 和 `API_SERVER_PORT` 仍可通过 Compose 项目目录的外层 `.env` 覆盖；这里的单一来源约定只针对 `API_SERVER_KEY`。

### API 访问与调用

默认入口：

```text
OpenAI-compatible API Base URL: http://127.0.0.1:8642/v1
API health:                     http://127.0.0.1:8642/health
noVNC:                          http://127.0.0.1:6080/
RDP:                            127.0.0.1:3389
VNC:                            127.0.0.1:5900
```

这些端口分别对应 `API_SERVER_PORT`、`NOVNC_PORT`、`RDP_PORT` 和 `VNC_PORT`；实际端口以 Compose 项目外层 `.env` 为准，不把个人当前端口写入仓库。

OpenAI-compatible 客户端填写：

```text
Base URL: http://127.0.0.1:8642/v1
API Key: ./data/.env 中的 API_SERVER_KEY
Model: 先通过 GET /v1/models 获取返回的模型 ID
```

API Server 使用 Bearer Token。最小测试：

```bash
# 在 Linux 终端查询 API Server 暴露的模型 ID
curl http://127.0.0.1:8642/v1/models \
  -H 'Authorization: Bearer <API_SERVER_KEY>'
```

将 `<API_SERVER_KEY>` 替换为 `./data/.env` 中的实际 Key；如果 `API_SERVER_PORT` 已修改，同时替换 URL 中的 `8642`。

```bash
# 在 Linux 终端调用 OpenAI Chat Completions 接口
curl http://127.0.0.1:8642/v1/chat/completions \
  -H 'Authorization: Bearer <API_SERVER_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"model":"<MODEL_ID>","messages":[{"role":"user","content":"你好"}],"stream":false}'
```

将 `<MODEL_ID>` 替换为上一条 `/v1/models` 返回的模型 ID。Hermes 上游还提供 `/v1/responses`、`/v1/capabilities` 和 `/health`；普通 OpenAI-compatible 客户端只需要 Base URL、API Key 和模型 ID。

## RDP

RDP 使用上游已有的 `hermes` 用户。密码只从运行时环境变量读取：

```text
RDP_PASSWORD
```

默认：

```text
RDP_BIND=0.0.0.0
RDP_PORT=3389
```

未设置 `RDP_PASSWORD` 时不会在镜像中预置密码。

RDP 使用 xorgxrdp 创建独立 Xorg 会话。xrdp 守护进程以 `xrdp` 用户运行，镜像将 `SessionSockdirGroup` 设为 `xrdp`，避免用户会话 socket 权限问题。

登录桌面后，剪贴板由 xrdp `chansrv/cliprdr` 提供并允许双向复制粘贴；xrdp 登录窗口本身出现于用户会话建立之前，因此密码框不能依赖 RDP 剪贴板。

### RDP 音频

当前镜像使用 PulseAudio 和官方 [`neutrinolabs/pulseaudio-module-xrdp v0.8`](https://github.com/neutrinolabs/pulseaudio-module-xrdp/tree/v0.8)。Dockerfile 在独立构建阶段按基础镜像的 PulseAudio 版本编译模块，再把 `module-xrdp-sink.so`、`module-xrdp-source.so` 和加载脚本复制到最终镜像；构建时还会确认编译阶段与最终镜像的 PulseAudio 包版本完全一致。

每个 xorgxrdp 会话由 `/etc/xrdp/startwm.sh` 显式启动会话级 PulseAudio，然后调用：

```text
/usr/libexec/pulseaudio-module-xrdp/load_pa_modules.sh
```

加载脚本为当前 RDP 会话提供 `xrdp-sink` / `xrdp-source`。启动或模块加载失败只影响 RDP 音频，不阻断桌面登录；VNC/noVNC 当前不提供音频重定向。

客户端必须在建立连接前启用本地音频。FreeRDP 命令行使用：

```text
/sound:sys:pulse
```

Remmina 的设置按连接条目分别保存；Windows 虚拟机条目有声音，不代表 Hermes 条目继承了同样参数。编辑 Hermes 的 RDP 条目，在“高级”中同时设置：

```text
声音 / Audio output mode = 本地 / Local
重定向本地音频输出 / Redirect local audio output = sys:pulse
```

第二项不能省略：它让 Remmina 明确使用 Pulse 后端并注册 `rdpsnd`，与可用的 `/sound:sys:pulse` 命令行行为一致。保存后必须彻底断开再重新连接，因为 RDP 音频虚拟通道只在建连时协商。

若同一地址的 xfreerdp 使用 `/sound:sys:pulse` 已有声音，则服务端、浏览器到 `xrdp-sink` 以及 xrdp 输出链路已经成立；不要继续重建 Hermes 音频栈，应先修正该 Remmina 连接条目的 `audio-output`。

这里的 `sys:pulse` 是 **Remmina/FreeRDP 客户端本机**选择的音频后端；服务端仍是本镜像已经固定并验证的 PulseAudio xrdp 模块，二者不要混为一项。

### Hermes Desktop 语音与 Wake word

三条音频链路彼此独立：

| 功能 | 实际链路 | 当前要求 |
| --- | --- | --- |
| RDP 会话播放（浏览器视频 / 会话内 TTS） | RDP 会话程序 → PulseAudio `xrdp-sink` → `rdpsnd` → 客户端扬声器 | Remmina“声音 = 本地”且“重定向本地音频输出 = `sys:pulse`” |
| Hermes Desktop 按键录音 | Desktop 客户端麦克风 → `/api/audio/transcribe` → 后端 STT | 镜像已安装 `faster-whisper==1.2.1`；不依赖 Wake word 的 PortAudio 输入流 |
| Wake word（`hey hermes`） | Python 后端 `sounddevice` → PortAudio 输入设备 | 镜像已安装上游固定的默认 openWakeWord 依赖和 `libportaudio2`；后端进程仍必须实际看得到可用麦克风输入 |

当前镜像安装的是 `onnxruntime==1.27.0`，不是 `onnxruntime-gpu`，因此 Wake word ONNX 推理没有 `CUDAExecutionProvider`，实际使用 CPU。Compose 把 NVIDIA GPU 透传给容器只表示 GPU 可供支持 CUDA 的程序使用，不会自动把 openWakeWord 切换到 NVIDIA；宿主机监控中少量 NVIDIA 占用也不能据此归因于 Wake word。

后台提示：

```text
Wake-word input device could not be resolved: PortAudio library not found
```

不是 Hermes “plugin not found”，也不是 RDP 扬声器故障；它表示后端的 `sounddevice` 找不到系统 `libportaudio.so.2`。最新 Dockerfile 已安装 `libportaudio2`，并在构建阶段检查该包已安装。

系统库修复后，旧镜像还可能显示：

```text
Feature 'wake.openwakeword' unavailable: pip install failed
No solution found ... numpy==2.4.3 ... numpy==2.5.1
```

这也不是插件丢失。旧 Dockerfile 只安装 `faster-whisper==1.2.1`，构建时把环境解析成了 `numpy==2.5.1` 和 `onnxruntime==1.28.0`；Hermes v0.20.2 的默认 Wake word 懒安装固定要求 `numpy==2.4.3` 和 `onnxruntime==1.27.0`，因此解析器同时看到两套精确版本后拒绝安装。

当前 Dockerfile 从基础镜像自己的 `uv.lock` 生成约束文件，先锁齐按键录音和 openWakeWord ONNX 运行依赖，再以 `--no-deps` 安装 `openwakeword==0.6.0`。这是因为该旧版包在 Linux 元数据中还声明了 `tflite-runtime`，但它没有 CPython 3.13 wheel；Hermes 在 Linux 默认走 ONNX，并不使用这项 TFLite 运行库。构建阶段会检查整个已安装环境没有偏离上游锁文件，再导入全部 ONNX 运行模块并核对关键版本。

依赖安装成功后还可能出现：

```text
[ONNXRuntimeError] : 3 : NO_SUCHFILE
.../openwakeword/resources/models/melspectrogram.onnx ... File doesn't exist
```

这是 `openwakeword==0.6.0` wheel 未携带共享特征模型，而首次运行默认把模型下载到安装包自己的 `resources/models`；Docker 后端以 `hermes` 用户运行，不能向 root 所有的 `.venv/site-packages` 写入文件。当前 Dockerfile 在构建期调用 openWakeWord 官方下载器，只预取共享模型，再用 `/command/s6-setuidgid hermes` 实际加载仓库自带的 `hey_hermes.onnx`。模型缺失会直接让镜像构建失败，不再留到运行时；不需要也不应把 Python 安装目录改成所有用户可写。要使用这三层修复，需要拉取新镜像并重新创建容器。

`libportaudio2` 只修复“系统库缺失”这一层。按 [Hermes 上游 Wake word 文档](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/wake-word.md)，Wake word 监听器运行在 Python 后端；Desktop 远程连接 Docker 后端时，客户端按键录音可用，并不证明容器后端也拥有输入设备。若系统库修复后改为提示没有可用输入设备，应继续检查后端可见的麦克风，而不是修改已经有效的 RDP 播放参数。

需要验证 RDP 麦克风重定向时，Remmina 的“重定向本地麦克风”可设为 `sys:pulse`，对应 FreeRDP 的 `/microphone:sys:pulse`；该设置建立的是 `audin` 输入通道，与上面的 `rdpsnd` 播放通道不同。最终仍以 Hermes `/wake status` 能否识别输入设备为准。

### RDP 共享目录

xrdp 目录重定向通过 `chansrv + FUSE` 工作。需要客户端“共享目录”功能时，容器需要：

```yaml
cap_add:
  - SYS_ADMIN

devices:
  - /dev/fuse:/dev/fuse
```

Remmina 等客户端设置共享目录后，RDP 会话中从下面路径访问：

```text
/opt/data/thinclient_drives/
```

其下的共享名称由客户端生成。Konqueror 和 Thunar 都可以直接访问该路径。

### 外部 AppImage

`/opt/data/thinclient_drives/` 是 xrdp 的 FUSE 重定向盘，适合传输文件，但不应把它当成本地可执行目录。外部 AppImage 先复制到 `/opt/data` 或其子目录；文件具有可执行权限后，当前桌面可直接双击启动，不要求额外使用 `--appimage-extract-and-run`。

`--appimage-extract-and-run` 只作为 FUSE 无法挂载时的兼容后备，不是当前环境的正常启动方式。镜像额外安装 `libfuse2t64`，只用于兼容仍依赖 `libfuse.so.2` 的旧 Type 2 AppImage；不额外安装旧 `fuse` 包，也不改变现有 RDP 共享目录已经需要的 `SYS_ADMIN` 与 `/dev/fuse` 运行时配置。

Thunar / xfdesktop 的 AppImage 图标由 `tumbler` 处理。仓库内置 [Linux Mint xapp-thumbnailers 1.2.10](https://github.com/linuxmint/xapp-thumbnailers/tree/0f037c3fdd17a2713e7fb555dcdb5a4b89cbe2d4) 中 AppImage 缩略图所需的最小文件，并保留上游 GPL-3+ 版权说明。该实现读取 AppImage 的 ELF/SquashFS 结构并提取 `.DirIcon` 生成缩略图，不执行 AppImage 内的应用程序代码。它与 KDE/Dolphin 使用的 KIO/libappimage 缩略图链路是两套实现，不需要为了 Thunar 再引入 KDE 缩略图插件。

当前镜像已实际验证：外部 AppImage 复制到 `/opt/data` 的桌面目录后，xfdesktop/Thunar 能显示其内置图标，并可从本地路径直接双击启动。

## VNC / noVNC

VNC 密码：

```text
VNC_PASSWORD
```

noVNC 没有独立登录密码，网页端连接到 x11vnc 后仍使用同一个 `VNC_PASSWORD` 进行认证。未设置 `VNC_PASSWORD` 时，x11vnc 与 noVNC 都不会提供可连接的桌面会话，也不会回退到无密码模式。

默认：

```text
VNC_BIND=0.0.0.0
VNC_PORT=5900
NOVNC_BIND=0.0.0.0
NOVNC_PORT=6080
VNC_DISPLAY=:99
VNC_GEOMETRY=1920x1080
```

VNC 桌面运行在独立 Xvfb 会话，与 xrdp 创建的 Xorg RDP 会话不是同一个桌面。Xvfb 启动前会检查显示号并只在确认不可用时清理残留锁文件；x11vnc 使用配置的 `VNC_PORT` 作为 IPv4 RFB 端口，并同时设置 `-rfbportv6 -1`、`-no6` 和 `-noipv6`，显式关闭 IPv6 RFB 端口、编译时默认的 IPv6 listener 以及其他 IPv6 socket。这样在 `network_mode: host` 下，即使把 `VNC_PORT` 改为 `5999`，也不会再额外占用宿主机 `[::]:5900` 与 RealVNC 等其他 VNC 服务冲突。

noVNC 由 websockify 提供静态网页和 WebSocket 转发。当前启动脚本仅在 `/usr/share/novnc/index.html` 不存在时创建指向 `vnc.html` 的符号链接，因此直接访问 noVNC 根地址即可进入客户端，不再显示静态目录列表；如果上游以后自带 `index.html`，则保留上游文件。

当前已知限制：直接 VNC 和 noVNC 都使用 x11vnc 的剪贴板链路，可能出现偶发复制/粘贴无效；noVNC 浏览器链路还可能出现中文剪贴板乱码。该问题作为现有 x11vnc/VNC/noVNC 剪贴板兼容性限制保留，不修改中文 locale，也不为此切换 VNC 后端；RDP、VNC 和 noVNC 的现有远程桌面架构保持不变。

可以关闭相应远程服务：

```text
RDP_ENABLE=0
VNC_ENABLE=0
```

监听地址设为 `127.0.0.1` 时只接受本机连接。在 `network_mode: host` 下无需额外 `ports:` 映射。

## 运行示例

```bash
docker run -d \
  --name hermes-agent \
  -e RDP_PASSWORD='自行设置强密码' \
  -e VNC_PASSWORD='自行设置强密码' \
  -v "$(pwd)/data:/opt/data" \
  -p 3389:3389 \
  -p 5900:5900 \
  -p 6080:6080 \
  ghcr.io/newyorkthink/hermes-agent:latest
```

需要 RDP 共享目录时额外增加：

```text
--cap-add=SYS_ADMIN --device=/dev/fuse:/dev/fuse
```

公网环境不要直接暴露远程桌面端口，优先通过防火墙、VPN 或可信内网限制访问范围。

## 常见问题

### noVNC 访问根地址出现 `Directory listing for /`

这是旧镜像直接把 `/usr/share/novnc` 作为 websockify 静态目录时的表现。当前启动脚本在上游没有 `index.html` 时创建 `index.html -> vnc.html`，因此访问 noVNC 根地址会直接进入客户端；不需要手动补 `/vnc.html`。

### noVNC 是否有单独密码

没有。noVNC 只是网页客户端和 WebSocket 转发层，认证继续使用 `VNC_PASSWORD`。

### `VNC_PORT` 已改为 `5999`，为什么之前仍会占用 `5900`

之前的启动参数已经把 IPv4 RFB 端口设为 `VNC_PORT`，并使用 `-no6` / `-noipv6`，但当前 x11vnc / LibVNCServer 组合仍曾实际创建额外的 IPv6 RFB listener `[::]:5900`。由于 Docker 使用 `network_mode: host`，这个 listener 会直接占用宿主机 `5900`，从而使宿主机 RealVNC Server 报端口冲突。

当前启动脚本在原有参数之外增加 `-rfbportv6 -1`，明确禁用 IPv6 RFB 端口。`VNC_PORT=5999` 时，x11vnc 只保留配置的 IPv4 `5999`，不再额外占用宿主机 `5900`；不需要修改 RealVNC 的端口。

### VNC / noVNC 复制粘贴为什么有时无效，中文为什么可能乱码

直接 VNC 和 noVNC 最终都经过 x11vnc 的剪贴板同步链路，因此可能出现偶发复制/粘贴不更新；noVNC 浏览器链路中的中文文本还可能出现乱码。这不是缺少中文 locale。

已评估 TigerVNC `x0vncserver` 作为替代后端，但当前 RDP、VNC 和 noVNC 的显示、端口和桌面链路已经可用，现阶段只把剪贴板问题记录为已知限制，不为这一项问题替换 x11vnc，避免同时改动 VNC 密码参数、监听方式、s6 服务和 noVNC 转发链路。

### RDP 播放视频为什么没有声音

当前镜像已通过官方 `pulseaudio-module-xrdp` 提供 `xrdp-sink` / `xrdp-source`。若 xfreerdp 使用 `/sound:sys:pulse` 有声音而 Remmina 没有，问题在 Remmina 的独立连接条目：除“声音 = 本地”外，还要把“重定向本地音频输出”设为 `sys:pulse`，然后完全断开并重连。Windows RDP 条目的设置不会自动复制到 Hermes 条目。

### 后台为什么显示 `PortAudio library not found`

这是 Wake word 的后端麦克风输入错误，不是插件错误，也不影响已经正常的 RDP 播放和 TTS。最新 Dockerfile 已加入 `libportaudio2`；新镜像重新创建容器后会先消除系统库缺失。若随后提示没有输入设备，说明还需要让 Docker 后端实际看到麦克风；不要因此改动 Remmina 已验证有效的输出设置。

### 后台为什么显示 `numpy==2.4.3` 与 `numpy==2.5.1` 冲突

这是旧镜像的 Python 依赖版本冲突，不是 `wake.openwakeword` 插件文件缺失。旧 Dockerfile 单独安装 `faster-whisper` 时得到 `numpy==2.5.1` / `onnxruntime==1.28.0`，而 Hermes v0.20.2 固定要求 `numpy==2.4.3` / `onnxruntime==1.27.0`。当前 Dockerfile 从基础镜像的 `uv.lock` 生成全环境约束后安装整组 ONNX 依赖，并用 `--no-deps` 安装 `openwakeword`，避开 Linux CPython 3.13 不可用且当前 ONNX 路径不需要的 `tflite-runtime`；更新镜像并重新创建容器后，不应再手工执行提示中的临时 `uv pip install`。

### 后台为什么显示 `melspectrogram.onnx` 不存在

这不是插件、RDP 音频或麦克风设备错误，而是 `openwakeword==0.6.0` 安装包未自带共享 ONNX 特征模型。运行时下载会写入 root 所有的 `.venv/site-packages`，但 Docker 后端实际以 `hermes` 用户运行，因此模型仍不存在。当前 Dockerfile 已在构建期下载共享模型，并以 `hermes` 用户实际加载一次 `hey_hermes.onnx`；构建通过后不需要运行时下载，也不要放宽整个 Python 环境的写权限。

### Docker 已透传 NVIDIA，为什么 Wake word 仍有 CPU 占用

GPU 透传与具体程序选择的推理后端是两件事。当前 openWakeWord 使用 CPU 版 ONNX Runtime，没有 CUDA 执行后端；持续监听时出现一定 CPU 占用属于音频采集和分帧推理，不需要修改已经稳定的 NVIDIA、RDP 或 AppImage 配置。

### 桌面只有主文件夹、文件系统、回收站等图标，没有已安装程序图标

这是 xfdesktop 的正常行为：它显示实际桌面目录中的文件/启动器和启用的特殊图标，不会把 `/usr/share/applications` 全部复制到桌面。

当前镜像提供 `xfce4-appfinder`，并在首次桌面会话创建一个“应用程序”启动器。打开它后可以按分类浏览或搜索具有 `.desktop` 入口的 GUI 程序。

### AppImage 双击能运行，但 Thunar / 桌面显示通用图标

这是文件管理器缺少 AppImage 专用缩略图生成器，不代表 AppImage 本身没有图标。当前镜像安装 Tumbler，并内置 Linux Mint `xapp-thumbnailers 1.2.10` 的 AppImage 缩略图实现，从 AppImage 内部 `.DirIcon` 生成 Thunar/xfdesktop 可用的缩略图；不执行 AppImage 内容。该功能与 AppImage 是否能直接启动是两条独立链路。

### `xfce4-appfinder: not found`

说明当前运行的还是未包含 Application Finder 的旧镜像。新镜像构建完成并重新拉取、重新创建容器后，`xfce4-appfinder` 命令和 `/usr/share/applications/xfce4-appfinder.desktop` 应同时存在。

### xfdesktop 左上角“主文件夹 / 文件系统 / 共享设备”点了没反应

这些是 xfdesktop 的特殊桌面图标，需要可用的文件管理器首选应用。当前镜像安装 Thunar 和 `xfce4-helpers`，并在用户没有自定义值时初始化 `FileManager=thunar`。

### 桌面右键“Open Terminal Here”提示找不到 `TerminalEmulator`

当前镜像直接安装 `xfce4-terminal`，并把 Xfce `TerminalEmulator` 默认值设为：

```text
TerminalEmulator=xfce4-terminal
```

如果持久化配置中仍是本镜像此前写入的 `debian-x-terminal-emulator`，启动 RDP / VNC 会话时会自动迁移；其他用户自定义终端不会被覆盖。

### LibreOffice 界面只有英文

当前镜像安装 `libreoffice-l10n-zh-cn`，提供 LibreOffice 简体中文界面资源。桌面会话本身使用 `zh_CN.UTF-8`；已有 LibreOffice 用户配置仍保留，不强制覆盖用户手动选择的界面语言。

### `Super+E` 使用哪个文件管理器

仍然是 Konqueror。Thunar 只作为 xfdesktop/Xfce 桌面集成所需的首选文件管理器，不替换 Openbox 的 `Super+E` 行为。

### 为什么桌面右键不是 Openbox 菜单

xfdesktop 正在管理桌面背景和桌面图标，因此桌面右键由 xfdesktop 处理。Openbox 仍然是窗口管理器，tint2 仍然是面板。

### 深色主题为什么没有把图标也变黑

GTK 深色主题、Openbox 窗口主题和图标主题是分开的。当前配置只把 GTK 与 Openbox 外观设为深色，图标仍使用独立的 Adwaita / AdwaitaLegacy / Breeze / LXDE 资源；Openbox 菜单的固定分类图标使用全彩 AdwaitaLegacy PNG。

### RDP 共享目录存在但文件管理器没有快捷入口

挂载正常不代表会自动加入文件管理器侧栏。共享根目录始终从下面路径访问：

```text
/opt/data/thinclient_drives/
```

### `docker exec` 读取 `/opt/data/thinclient_drives` 提示权限不足

RDP 共享目录是 `hermes` 用户会话中的 FUSE 挂载。应以 RDP 会话内部能否正常进入共享目录并看到宿主机文件作为主要验证方式。

### 从 `/opt/data/thinclient_drives` 直接执行 AppImage 提示 `Permission denied`

共享目录是 xrdp 的 FUSE 重定向盘，不作为本地程序执行目录使用。把 AppImage 复制到 `/opt/data` 或其子目录并确保文件已有执行权限；当前 FUSE 配置正常时即可直接双击，不需要把 `--appimage-extract-and-run` 当成固定启动参数。该参数仅用于直接 FUSE 挂载不可用时的后备兼容。

### Fcitx5 能选择拼音，但 GTK 程序不能输入中文

RDP 与 VNC 启动脚本显式设置：

```text
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
```

并启动 `fcitx5`。构建阶段还会检查 GTK3 输入模块、拼音模块、拼音配置和 Fcitx5 图标资源。

### 容器日志出现多条 `WARNING` / `ERROR`，是否需要继续修复

应结合发生时机判断，不能只按日志级别判断服务失败。当前实际日志中的常见项目如下：

| 日志特征 | 当前判定 |
| --- | --- |
| `GVFS-UDisks2`、`Failed to get system bus`、`pam_systemd ... No such file` | 容器没有完整 systemd / UDisks；只影响可移动设备自动发现，不阻断桌面、文件管理器或 RDP |
| `libEGL ... /dev/dri/card0: Permission denied`、`rdpPreInit: /dev/dri/renderD128 open failed` | Xvfb / xorgxrdp 没有直接使用宿主机 DRM 渲染节点，当前远程桌面回退到软件渲染；画面正常时不要为消除提示扩大设备权限 |
| ONNX Runtime `Failed to detect devices under /sys/class/drm/card*` | CPU 版 ONNX Runtime 枚举到不可访问的 DRM 条目；Wake word 已使用 CPU 后端，不表示模型加载失败 |
| `tint2: pixmap background detection failed`、`Unable to acquire bus name 'org.xfce.Thunar'`、`SESSION_MANAGER ... not defined` | 轻量 Openbox 会话的面板探测、并发 D-Bus 激活或无传统会话管理器提示；桌面、面板和文件管理器可用时不处理 |
| Firefox `glxtest: libpci missing` | Firefox 在远程软件渲染会话中的可选 GPU 探测提示；浏览器正常打开和播放时不为此改变稳定桌面链路 |
| `rdpClientConRecv ... returned 0`、`trans_check_wait_objs failed for ECP transport` | RDP 客户端断开、重连或容器停止时产生的通道结束日志；随后能重连，或容器以 `code 0` 退出时不是持续故障 |
| `Shutdown context: signal=SIGTERM`、`s6rc-oneshot-runner ... essential` | `docker compose` 重新创建或停止容器时的正常受监督关闭日志；`exited with code 0` 表示正常结束 |
| `No env user allowlists configured` | 仅在启用 Telegram 等外部消息平台时需要配置允许用户；本机 Dashboard、RDP、VNC 和 API 使用不受影响 |
| `Interrupted during API call` | 当前请求被用户中断、客户端断开或容器停止；只有在没有任何断开操作仍持续出现时才需要单独排查 |

以上提示不能通过把 Fontconfig、libnotify 或更多桌面守护进程塞进 Docker/AppImage 统一消除。判断稳定性的依据是容器持续运行、Dashboard 可连接、RDP/VNC 可重连、实际功能正常，以及停止或重建时最终 `exited with code 0`。

## 踩坑记录

以下问题均为本镜像实际遇到并处理过的情况。后续调整远程桌面、桌面组件、持久化配置或构建逻辑时，应保留对应修复，不要只根据表面现象回退已经稳定的链路。

- **自定义 VNC 端口仍抢占宿主机 `5900`**：`VNC_PORT=5999` 时，x11vnc 的 IPv4 已正确监听 `127.0.0.1:5999`，但当前 x11vnc / LibVNCServer 组合曾额外建立 `[::]:5900`，在 `network_mode: host` 下直接与宿主机 RealVNC 冲突。仅有 `-no6` / `-noipv6` 仍不足以阻止该实际行为，最终在原有参数之外增加 `-rfbportv6 -1`。修复后已实际检查：Hermes x11vnc 只监听 `127.0.0.1:5999`，宿主机 RealVNC 独占 IPv4/IPv6 `5900`。
- **noVNC 根地址显示目录列表**：websockify 直接暴露 `/usr/share/novnc` 时，访问根地址可能得到 `Directory listing for /`。当前仅在上游不存在 `index.html` 时创建 `index.html -> vnc.html`，既保证根地址直接进入客户端，也不覆盖以后上游可能提供的入口文件。
- **noVNC 密码来源容易误判**：noVNC 没有第二套独立密码；最终认证仍由 x11vnc 完成，统一使用 `VNC_PASSWORD`。不要再额外维护 noVNC 密码变量。
- **VNC / noVNC 剪贴板偶发失效或中文乱码**：两者最终都经过 x11vnc 剪贴板同步链路，noVNC 还多一层浏览器/WebSocket。该问题不是缺少 `zh_CN.UTF-8`。已评估 TigerVNC `x0vncserver`，但现有 RDP/VNC/noVNC 主链路可用，因此把该项保留为已知限制，不为单一剪贴板问题替换整个 VNC 后端。
- **RDP 有画面但没有声音**：服务端使用官方 `pulseaudio-module-xrdp`，并由 `/etc/xrdp/startwm.sh` 显式启动会话级 PulseAudio 和加载 xrdp 模块。若同一服务端的 xfreerdp `/sound:sys:pulse` 已有声音，不应再替换服务端音频架构；Remmina 的 Hermes 条目必须同时设置“声音 = 本地”和 `audio-output=sys:pulse`，并在保存后重连。
- **Wake word 显示 `PortAudio library not found`**：这是后端 `sounddevice` 缺少 `libportaudio.so.2`，不是 Hermes 插件缺失，也与 `rdpsnd` 播放链路无关。Dockerfile 已加入 `libportaudio2`；系统库修复后仍可能需要单独解决 Docker 后端看不到麦克风输入的问题。
- **Wake word 懒安装显示 `numpy==2.4.3` / `numpy==2.5.1` 无解**：旧 Dockerfile 只固定 `faster-whisper`，其余传递依赖被解析到比 Hermes v0.20.2 功能约束更高的版本。当前从基础镜像的 `uv.lock` 生成全环境约束，精确安装 voice/wake ONNX 依赖，再以 `--no-deps` 安装 `openwakeword`，避免它额外解析 CPython 3.13 不可用的 Linux `tflite-runtime`，最后检查环境漂移并导入关键模块；不要在运行中的容器内临时覆盖这些包。
- **xrdp 会话 socket 权限问题**：容器没有 systemd 代替 Debian 服务做初始化时，必须显式执行 `/usr/share/xrdp/socksetup`；同时 `SessionSockdirGroup` 使用 `xrdp`，否则可能出现 `Error connecting to user session` 一类连接失败。
- **RDP 共享目录不是普通宿主机挂载**：目录重定向依赖 `chansrv + FUSE`，容器需要 `SYS_ADMIN` 和 `/dev/fuse`。`/opt/data/thinclient_drives/` 是用户会话内的 FUSE 挂载，因此 `docker exec` 直接访问遇到权限问题不能单独作为共享失败依据，应以 RDP 会话内能否正常访问为准。
- **外部 AppImage 在共享盘不能直接执行、复制后却能双击运行**：`thinclient_drives` 是 xrdp FUSE 重定向盘，不作为程序执行目录。AppImage 复制到 `/opt/data` 后，只要已有执行权限即可沿用正常 FUSE 启动；`--appimage-extract-and-run` 仅保留为 FUSE 失败时的后备。镜像补 `libfuse2t64` 兼容仍依赖 FUSE 2 用户态库的旧 AppImage，不额外安装旧 `fuse` 包，也不新增现有共享目录之外的容器权限。
- **AppImage 可运行但 Thunar/xfdesktop 只有通用图标**：Dolphin/KIO 的 AppImage 缩略图插件不会自动给 Thunar 使用。当前改用 Xfce 原生 Tumbler 外部缩略图链路，并内置 Linux Mint `xapp-thumbnailers 1.2.10` 的 AppImage 实现，从 `.DirIcon` 生成缩略图；只读取 ELF/SquashFS，不执行 AppImage 内容。
- **AppImage 缩略图构建检查不能使用裸 `python3`**：Hermes 基础镜像把 `/opt/hermes/.venv/bin` 放在 PATH 前面，裸 `python3` 会进入 Hermes venv；而 `python3-gi`、`python3-pil`、`python3-pyelftools`、`gir1.2-xapp-1.0` 由 Debian 安装给系统 Python。构建检查必须显式使用 `/usr/bin/python3`，与 `xapp-appimage-thumbnailer` 的 shebang 保持一致；不要为解决 `No module named 'gi'` 把系统 GI 重新装进 Hermes venv。
- **桌面图标与“所有应用图标”不是一回事**：xfdesktop 只显示桌面目录文件和特殊图标，不会自动把 `/usr/share/applications` 全部复制到桌面。应用入口使用 `xfce4-appfinder`，并只做一次性“应用程序”桌面启动器初始化，避免用户删除后又被反复写回。
- **xfdesktop 特殊图标点了没反应**：桌面“主文件夹 / 文件系统 / 回收站 / 设备”等入口需要 Xfce FileManager helper。当前保留 Konqueror 作为 `Super+E` 主文件管理入口，同时安装 Thunar 并只把 `FileManager=thunar` 用于 xfdesktop/Xfce helper，不能再把两者职责混为一处。
- **桌面右键终端报 `TerminalEmulator` 不存在**：仅有 Openbox 或通用 xterm 不够，xfdesktop 会调用 Xfce helper。当前显式安装 `xfce4-terminal`，并在缺失时初始化 `TerminalEmulator=xfce4-terminal`；只迁移本镜像曾经写入的旧默认值，不覆盖用户自己的终端选择。
- **深色主题导致图标难辨认**：GTK 主题、Openbox 窗口主题和图标主题必须分开。界面使用深色时仍单独保留彩色 Adwaita / AdwaitaLegacy / Breeze / LXDE 图标资源，避免把应用和菜单图标一起切成黑色 symbolic 图标。
- **多个桌面/文件管理组件职责冲突**：PCManFM 已从桌面链路移除；Openbox 负责窗口管理，tint2 负责面板，xfdesktop 负责桌面层，Konqueror 负责主文件管理入口，Thunar 只承担 xfdesktop/Xfce helper 所需职责。不要再同时引入新的桌面管理器去争用根窗口。
- **`API_SERVER_KEY` 双份配置会增加排障复杂度**：当前只以 `/opt/data/.env` 作为 Key 的唯一来源，不在 Compose 项目 `.env` 和 `docker-compose.yml` 中重复传入同名变量。监听地址、端口、启用状态仍可由 Compose 项目 `.env` 管理，但 Key 不再维护两份。
- **持久化目录中的用户配置不能每次启动强制覆盖**：`HOME=/opt/data` 是稳定基线。启动脚本只初始化缺失项、迁移本镜像明确写入过的旧默认值；用户已经修改的 Openbox、GTK、Xfce 等配置保持不动。
- **README 文档提交不应浪费 Actions**：workflow 的 push 路径不包含 `hermes-agent/README.md`，因此单独补充文档不会重新构建镜像；真正影响镜像的 `hermes-agent/Dockerfile`、`hermes-agent/docker/**` 等修改才触发构建。镜像继续只维护 `latest`，不创建日期标签、SHA 标签、Artifact 或 Release。

## 设计取舍与已处理问题

- 当前不是完整 Xfce 桌面。窗口管理器固定为 Openbox，面板固定为 tint2，只借用 `xfdesktop`、Thunar helper、`xfce4-terminal` 和 `xfce4-appfinder` 完成桌面集成；不引入 `xfce4-panel`，避免和 tint2 重复。
- 不使用 `nwg-drawer`。当前远程桌面是 X11/Openbox，而 `nwg-drawer` 面向 wlroots/Wayland；应用程序启动统一使用 `xfce4-appfinder`。
- PCManFM 已从桌面链路移除。Konqueror 保持主文件管理入口，Thunar 只承担 xfdesktop/Xfce helper 所需职责，避免多个文件管理器同时争用桌面管理角色。
- xfdesktop 接管根窗口后，桌面右键由 xfdesktop 处理，不应再把 Openbox 根菜单当作主要应用入口；Openbox 自定义应用菜单仍保留，Application Finder 作为更直接的图形启动入口。
- `HOME=/opt/data` 是 RDP/VNC 的统一持久化基线。启动脚本只初始化缺失值和迁移本镜像明确写入过的旧默认值，不覆盖已有用户选择。
- GTK 深色主题、Openbox 窗口主题和图标主题分离处理，避免深色界面把应用和菜单图标一起替换成难辨认的黑色 symbolic 图标。
- 外部 AppImage 在 `/opt/data` 中保留正常直接启动路径；不把 `--appimage-extract-and-run` 强制写进启动方式。`libfuse2t64` 只补旧 AppImage 的 FUSE 2 用户态库兼容，Tumbler + xapp-appimage-thumbnailer 只负责图标缩略图，两条链路互不替代。
- RDP 与 VNC 使用同一套桌面组件，但不是同一个显示会话：RDP 是 xorgxrdp 创建的 Xorg 会话，VNC 是独立 Xvfb `:99` 会话。
- x11vnc 在当前 LibVNCServer 组合下，即使 IPv4 已按 `VNC_PORT` 监听并同时设置 `-no6` / `-noipv6`，仍曾实际出现额外的 `[::]:5900` IPv6 RFB listener；在 `network_mode: host` 下会直接抢占宿主机 `5900`。当前额外设置 `-rfbportv6 -1`，明确关闭 IPv6 RFB 端口，使自定义 `VNC_PORT` 与宿主机 RealVNC 等其他 VNC 服务保持端口隔离。
- noVNC 没有独立密码，统一使用 `VNC_PASSWORD`；根地址通过 `index.html -> vnc.html` 直接进入客户端，不再暴露静态目录列表。
- 直接 VNC 和 noVNC 的剪贴板都依赖 x11vnc，偶发复制/粘贴失效以及 noVNC 中文乱码作为已知兼容性限制保留。当前 RDP、VNC、noVNC 均可正常作为远程桌面使用，因此不为该单一问题替换 x11vnc 或切换到 TigerVNC/x0vncserver，避免破坏现有稳定架构。
- RDP 音频使用官方 `pulseaudio-module-xrdp v0.8`；模块在独立构建阶段按最终镜像的 PulseAudio 版本编译，每个 xorgxrdp 会话显式启动会话级 PulseAudio 并加载 xrdp 模块，不依赖完整桌面环境的 XDG Autostart。
- RDP 播放、Desktop 按键录音和 Wake word 后端监听是三条独立链路；默认 voice/wake ONNX 依赖按 Hermes v0.20.2 锁文件安装，`openwakeword` 跳过当前 Linux/CPython 3.13 不可用且 ONNX 路径不需要的 `tflite-runtime`；`libportaudio2` 只解决系统运行库，这些都不能代替实际麦克风输入，也不能替代 Remmina 的 `audio-output=sys:pulse`。
- `xdg-user-dirs` 负责桌面目录本地化，脚本通过 `xdg-user-dir DESKTOP` 获取实际路径，不写死英文 `~/Desktop`。
- 桌面启动器只做一次性初始化。这样既能给首次使用者一个可点击的应用入口，又不会在用户后续主动删除或自定义桌面后反复写回。

## 构建期验证

Dockerfile 在构建阶段检查以下关键链路，任一关键文件或命令缺失都会直接使构建失败：

- xrdp / Xorg / Xvfb / x11vnc / noVNC
- PulseAudio / `pactl` / `module-xrdp-sink.so` / `module-xrdp-source.so` / xrdp 音频加载脚本
- `libportaudio2`（Wake word 的 PortAudio 系统运行库）
- `faster-whisper==1.2.1`、`openwakeword==0.6.0`、`onnxruntime==1.27.0`、`sounddevice==0.5.5`、`numpy==2.4.3` 及锁定 ONNX 传递依赖的安装、导入与实际版本
- Openbox / tint2 / xfdesktop
- `xfce4-appfinder`、`xdg-user-dirs`、`gio`
- Thunar、Xfce FileManager helper、`xfce4-terminal`
- Tumbler D-Bus 缩略图服务、`xapp-appimage-thumbnailer`、`unsquashfs`、`application/vnd.appimage` 缩略图注册，以及 `/usr/bin/python3` 对 GI/PIL/pyelftools/XApp 的导入
- `libfuse2t64`（旧 Type 2 AppImage 的 FUSE 2 用户态库兼容）
- LibreOffice 简体中文语言包
- Konqueror / `kfmclient`
- LXTask
- Firefox / Chrome
- Fcitx5 GTK3 / 拼音组件和关键图标
- Openbox 深色主题和菜单图标资源

上游 Hermes 的 ENTRYPOINT/CMD 保持不变。
