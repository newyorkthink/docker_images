FROM nousresearch/hermes-agent:latest AS pulseaudio-xrdp-builder

# 在独立构建阶段编译官方 PulseAudio xrdp 音频模块；固定使用稳定版 v0.8，避免把构建依赖带入最终镜像。
ARG PULSEAUDIO_XRDP_VERSION=v0.8
USER root
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        sudo git ca-certificates lsb-release build-essential autoconf automake libtool pkg-config doxygen \
        libpulse-dev libltdl-dev pulseaudio && \
    git clone --depth 1 --branch "${PULSEAUDIO_XRDP_VERSION}" \
        https://github.com/neutrinolabs/pulseaudio-module-xrdp.git /tmp/pulseaudio-module-xrdp && \
    cd /tmp/pulseaudio-module-xrdp && \
    ./scripts/install_pulseaudio_sources_apt.sh -d /tmp/pulseaudio.src && \
    ./bootstrap && \
    ./configure PULSE_DIR=/tmp/pulseaudio.src && \
    make -j"$(nproc)" && \
    make DESTDIR=/tmp/pulseaudio-xrdp-root install && \
    mkdir -p /tmp/pulseaudio-xrdp-root/usr/local/share/hermes && \
    dpkg-query -W -f='${Version}\n' pulseaudio > /tmp/pulseaudio-xrdp-root/usr/local/share/hermes/pulseaudio-xrdp-build-version && \
    test -n "$(find /tmp/pulseaudio-xrdp-root -type f -name 'module-xrdp-sink.so' -print -quit)" && \
    test -n "$(find /tmp/pulseaudio-xrdp-root -type f -name 'module-xrdp-source.so' -print -quit)" && \
    test -x /tmp/pulseaudio-xrdp-root/usr/libexec/pulseaudio-module-xrdp/load_pa_modules.sh

FROM nousresearch/hermes-agent:latest

# 记录本次构建使用的上游镜像 digest，供定时任务判断上游是否已经更新。
ARG UPSTREAM_DIGEST=unknown
LABEL org.opencontainers.image.base.name="docker.io/nousresearch/hermes-agent:latest" \
      org.opencontainers.image.base.digest="${UPSTREAM_DIGEST}"

# 派生镜像只增加通用工具和远程桌面组件，不覆盖 Hermes 自带的 Node、npm、Playwright 与 s6-overlay。
USER root

# 先用基础镜像自带的 apt-get 引导安装 aptitude；后续系统软件统一由 aptitude 安装并保留 Debian 推荐依赖。
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends aptitude && \
    aptitude update && \
    DEBIAN_FRONTEND=noninteractive aptitude install -y \
        libreoffice libreoffice-gtk3 libreoffice-l10n-zh-cn pandoc poppler-utils ghostscript \
        xvfb x11vnc novnc websockify xrdp xorgxrdp \
        xserver-xorg-core xserver-xorg xinit xauth x11-utils x11-xserver-utils \
        openbox tint2 xfdesktop4 thunar xfce4-helpers xfce4-terminal xfce4-appfinder konqueror lxtask mousepad lxterminal xterm firefox-esr \
        ffmpeg imagemagick sox \
        tesseract-ocr tesseract-ocr-eng tesseract-ocr-chi-sim \
        fonts-noto fonts-noto-cjk fonts-noto-color-emoji fonts-liberation fonts-dejavu \
        fonts-wqy-zenhei fonts-wqy-microhei xfonts-base xfonts-75dpi fontconfig \
        newsboat strace vim tmux lsof rsync tree ncdu zstd \
        psmisc moreutils inotify-tools netcat-openbsd patch less pv time fzf duf \
        dos2unix bsdextrautils gettext-base bc \
        curl wget git zip unzip p7zip-full jq aria2 \
        locales ca-certificates tzdata procps net-tools iputils-ping iproute2 iptables dnsutils socat whois \
        openssl gnupg \
        build-essential pkg-config libssl-dev libffi-dev libxml2-dev libxslt1-dev \
        libjpeg-dev libpng-dev libwebp-dev libmagic-dev file exiftool \
        sqlite3 libsqlite3-dev \
        sudo dbus-x11 at-spi2-core xdotool wmctrl scrot \
        fcitx5 fcitx5-chinese-addons fcitx5-frontend-gtk3 fcitx5-frontend-qt5 fcitx5-frontend-qt6 im-config \
        pulseaudio libportaudio2 desktop-file-utils xdg-utils xdg-user-dirs libglib2.0-bin menu lxappearance \
        libgtk2.0-0t64 libayatana-appindicator3-1 adwaita-icon-theme adwaita-icon-theme-legacy breeze-icon-theme lxde-icon-theme \
        tumbler shared-mime-info libfuse2t64 python3-gi python3-pil python3-pyelftools gir1.2-xapp-1.0 squashfs-tools \
        xclip libxcb-cursor0 qt5ct qt6ct && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/* /tmp/* /var/tmp/* /root/.cache/* && \
    (ln -sf /usr/share/applications/firefox-esr.desktop /usr/share/applications/firefox.desktop 2>/dev/null || true)

# Thunar/xfdesktop 使用 Tumbler 生成缩略图；AppImage 缩略图沿用 Linux Mint xapp-thumbnailers 1.2.10
# （上游提交 0f037c3fdd17a2713e7fb555dcdb5a4b89cbe2d4）的 AppImage 实现，只解析 ELF/SquashFS 并提取 .DirIcon，不执行 AppImage 内容。
RUN install -d /usr/local/bin /usr/share/thumbnailers /usr/lib/python3/dist-packages/XappThumbnailers /usr/share/doc/xapp-appimage-thumbnailer
COPY --chmod=0755 docker/appimage/xapp-appimage-thumbnailer /usr/local/bin/xapp-appimage-thumbnailer
COPY --chmod=0644 docker/appimage/xapp-appimage-thumbnailer.thumbnailer /usr/share/thumbnailers/xapp-appimage-thumbnailer.thumbnailer
COPY --chmod=0644 docker/appimage/XappThumbnailers/__init__.py /usr/lib/python3/dist-packages/XappThumbnailers/__init__.py
COPY --chmod=0644 docker/appimage/xapp-thumbnailers-copyright /usr/share/doc/xapp-appimage-thumbnailer/copyright
RUN /usr/bin/python3 -c 'import PIL, gi; from elftools.elf.elffile import ELFFile; gi.require_version("XApp", "1.0"); from gi.repository import XApp; import XappThumbnailers' && \
    command -v unsquashfs >/dev/null && \
    grep -qx 'MimeType=application/vnd.appimage;' /usr/share/thumbnailers/xapp-appimage-thumbnailer.thumbnailer

# Hermes Desktop 按键录音使用 faster-whisper；默认 Wake word 使用 pyopen-wakeword 和镜像内的 hey_hermes.tflite。
# Edge TTS 是上游默认朗读，发布镜像同样没装。这些包按官方方式用 pm.build_env 另建环境，
# 不把 uv 放进 PATH，也不改已经封好的 /opt/hermes/.venv。
RUN /usr/local/bin/python3 -m pm.build_env \
        --python /usr/local/bin/python3 \
        --out /opt/hermes/voice-deps \
        --sealed \
        --requirement "faster-whisper==1.2.1" \
        --requirement "onnxruntime==1.29.0" \
        --requirement "sounddevice==0.5.5" \
        --requirement "numpy==2.4.3" \
        --requirement "requests==2.33.0" \
        --requirement "scikit-learn==1.9.0" \
        --requirement "scipy==1.18.0" \
        --requirement "tqdm==4.70.0" \
        --requirement "pyopen-wakeword==1.1.0" \
        --requirement "edge-tts==7.2.7" && \
    voice_site="$(/opt/hermes/voice-deps/bin/python -c 'import site; print(site.getsitepackages()[0])')" && \
    venv_site="$(/opt/hermes/.venv/bin/python -c 'import site; print(site.getsitepackages()[0])')" && \
    printf '%s\n' "$voice_site" > "$venv_site/hermes-voice-deps.pth" && \
    chmod -R a+rX /opt/hermes/voice-deps && \
    /command/s6-setuidgid hermes /opt/hermes/.venv/bin/python -c 'from pathlib import Path; from pyopen_wakeword import OpenWakeWord, OpenWakeWordFeatures; model_path=Path("/opt/hermes/tools/wakewords/hey_hermes.tflite"); assert model_path.is_file() and model_path.stat().st_size, model_path; features=OpenWakeWordFeatures.from_builtin(); model=OpenWakeWord.from_model(str(model_path)); assert model.id == "hey_hermes", model.id; features.close(); model.close(); print("pyopen-wakeword model load OK")' && \
    /opt/hermes/.venv/bin/python -c 'from importlib.metadata import version; from faster_whisper import WhisperModel; from pyopen_wakeword import OpenWakeWord; import numpy, onnxruntime, requests, scipy, sklearn, sounddevice, tqdm; import edge_tts; expected={"faster-whisper":"1.2.1","pyopen-wakeword":"1.1.0","edge-tts":"7.2.7","onnxruntime":"1.29.0","sounddevice":"0.5.5","numpy":"2.4.3","requests":"2.33.0","scikit-learn":"1.9.0","scipy":"1.18.0","tqdm":"4.70.0"}; installed={name:version(name) for name in expected}; assert installed == expected, (installed, expected); print("Hermes voice, wake-word and Edge TTS dependencies OK")'

# 复制与最终镜像 PulseAudio 版本匹配的 xrdp 音频模块；RDP 音频通过虚拟通道转发，不需要映射宿主机声卡设备。
COPY --from=pulseaudio-xrdp-builder /tmp/pulseaudio-xrdp-root/ /
RUN test "$(dpkg-query -W -f='${Version}' pulseaudio)" = "$(cat /usr/local/share/hermes/pulseaudio-xrdp-build-version)" && \
    test -n "$(find /usr/lib -type f -name 'module-xrdp-sink.so' -print -quit)" && \
    test -n "$(find /usr/lib -type f -name 'module-xrdp-source.so' -print -quit)" && \
    test -x /usr/libexec/pulseaudio-module-xrdp/load_pa_modules.sh && \
    test -f /etc/xdg/autostart/pulseaudio-xrdp.desktop

# 配置中文 UTF-8 环境；不创建额外的固定密码用户，RDP 直接使用上游 hermes 用户。
RUN sed -i '/zh_CN.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen && \
    fc-cache -f && \
    (adduser xrdp ssl-cert >/dev/null 2>&1 || true)

# xrdp 在容器内以 xrdp 用户运行；sesman 必须把会话 socket 目录交给同组，否则会出现“Error connecting to user session”。
RUN sed -ri 's/^[[:space:]]*#[[:space:]]*SessionSockdirGroup=root[[:space:]]*$/SessionSockdirGroup=xrdp/' /etc/xrdp/sesman.ini && \
    grep -q '^SessionSockdirGroup=xrdp$' /etc/xrdp/sesman.ini && \
    grep -q '^RestrictOutboundClipboard=none$' /etc/xrdp/sesman.ini && \
    grep -q '^RestrictInboundClipboard=none$' /etc/xrdp/sesman.ini && \
    grep -q '^cliprdr=true$' /etc/xrdp/xrdp.ini

ENV GTK_IM_MODULE=fcitx \
    QT_IM_MODULE=fcitx \
    XMODIFIERS=@im=fcitx \
    LANG=zh_CN.UTF-8 \
    LANGUAGE=zh_CN:zh \
    LC_ALL=zh_CN.UTF-8

# 安装 Google Chrome；先解包本地 deb，再由 aptitude 统一补齐并配置依赖。
RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -O /tmp/chrome.deb && \
    (dpkg -i /tmp/chrome.deb || true) && \
    aptitude update && \
    DEBIAN_FRONTEND=noninteractive aptitude install -f -y && \
    rm -f /tmp/chrome.deb && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/*

# 默认使用 Openbox 自带的 Onyx 深色主题；只修改系统默认值，不覆盖 /opt/data 中已有的用户 Openbox 配置。
RUN sed -i '0,/<name>Clearlooks<\/name>/s//<name>Onyx<\/name>/' /etc/xdg/openbox/rc.xml && \
    grep -q '<name>Onyx</name>' /etc/xdg/openbox/rc.xml && \
    test -f /usr/share/themes/Onyx/openbox-3/themerc

# 使用带彩色图标的 Openbox 菜单；保留 Debian 原始菜单作为已有用户配置迁移基线。
RUN install -D -m 0644 /etc/xdg/openbox/menu.xml /usr/local/share/hermes/openbox-menu.debian.xml
COPY --chmod=0755 docker/openbox/hermes-openbox-app-menu /usr/local/bin/hermes-openbox-app-menu
COPY docker/openbox/menu.xml /etc/xdg/openbox/menu.xml
RUN update-menus && \
    test -f /var/lib/openbox/debian-menu.xml && \
    /usr/local/bin/hermes-openbox-app-menu --patch-debian-menu && \
    /usr/local/bin/hermes-openbox-app-menu > /tmp/hermes-openbox-app-menu.xml && \
    python3 -c 'import os, xml.etree.ElementTree as ET; paths=["/etc/xdg/openbox/menu.xml","/var/lib/openbox/debian-menu.xml","/tmp/hermes-openbox-app-menu.xml"]; roots=[ET.parse(p).getroot() for p in paths]; nodes=[n for root in roots for n in root.iter() if n.tag.rsplit("}",1)[-1] in {"menu","item"} and n.get("id") != "root-menu"]; assert nodes and all(n.get("icon") and os.path.isfile(n.get("icon")) for n in nodes)' && \
    rm -f /tmp/hermes-openbox-app-menu.xml

# xrdp 使用标准 Xorg 会话；窗口管理器使用 Openbox，面板使用 tint2，桌面层使用 xfdesktop，文件管理器入口仍使用 Konqueror。
COPY --chmod=0755 docker/xrdp-startwm.sh /etc/xrdp/startwm.sh

# 在 Hermes 自带的 s6-overlay 中增加远程桌面初始化与监督服务。
COPY --chmod=0755 docker/cont-init.d/03-remote-desktop /etc/cont-init.d/03-remote-desktop
COPY docker/s6-rc.d/ /etc/s6-overlay/s6-rc.d/
RUN find /etc/s6-overlay/s6-rc.d -mindepth 2 -maxdepth 2 -name run -exec chmod 0755 {} +

# 仅声明 RDP、VNC、noVNC 的默认端口元数据；实际监听地址和端口由运行时变量及 Docker 网络模式决定。
EXPOSE 3389 5900 6080

# 构建期检查远程桌面、RDP 音频、桌面组件、应用程序启动器、Xfce 首选应用、文件管理器、AppImage 缩略图/FUSE 兼容、任务管理器、Fcitx5 中文输入链路和关键图标资源是否完整。
RUN command -v xrdp >/dev/null && \
    command -v xrdp-sesman >/dev/null && \
    command -v pulseaudio >/dev/null && \
    command -v pactl >/dev/null && \
    dpkg-query -W -f='${Status}\n' libportaudio2 2>/dev/null | grep -q '^install ok installed$' && \
    test -x /usr/libexec/pulseaudio-module-xrdp/load_pa_modules.sh && \
    test -n "$(find /usr/lib -type f -name 'module-xrdp-sink.so' -print -quit)" && \
    test -n "$(find /usr/lib -type f -name 'module-xrdp-source.so' -print -quit)" && \
    command -v Xvfb >/dev/null && \
    command -v x11vnc >/dev/null && \
    command -v websockify >/dev/null && \
    command -v openbox >/dev/null && \
    command -v tint2 >/dev/null && \
    command -v xfdesktop >/dev/null && \
    command -v thunar >/dev/null && \
    dpkg-query -W -f='${Status}\n' tumbler 2>/dev/null | grep -q '^install ok installed$' && \
    dpkg-query -W -f='${Status}\n' libfuse2t64 2>/dev/null | grep -q '^install ok installed$' && \
    test -x /usr/lib/x86_64-linux-gnu/tumbler-1/tumblerd && \
    test -f /usr/share/dbus-1/services/org.xfce.Tumbler.Thumbnailer1.service && \
    command -v xapp-appimage-thumbnailer >/dev/null && \
    command -v unsquashfs >/dev/null && \
    test -f /usr/share/thumbnailers/xapp-appimage-thumbnailer.thumbnailer && \
    grep -qx 'MimeType=application/vnd.appimage;' /usr/share/thumbnailers/xapp-appimage-thumbnailer.thumbnailer && \
    command -v xfce4-terminal >/dev/null && \
    command -v xfce4-appfinder >/dev/null && \
    command -v xdg-user-dir >/dev/null && \
    command -v xdg-user-dirs-update >/dev/null && \
    command -v gio >/dev/null && \
    command -v lxtask >/dev/null && \
    command -v python3 >/dev/null && \
    test -x /usr/local/bin/hermes-openbox-app-menu && \
    test -f /usr/share/applications/xfce4-appfinder.desktop && \
    test -f /usr/share/xfce4/helpers/thunar.desktop && \
    test -f /usr/share/xfce4/helpers/xfce4-terminal.desktop && \
    dpkg-query -W -f='${Status}\n' libreoffice-l10n-zh-cn 2>/dev/null | grep -q '^install ok installed$' && \
    command -v konqueror >/dev/null && \
    command -v kfmclient >/dev/null && \
    command -v firefox-esr >/dev/null && \
    command -v google-chrome >/dev/null && \
    command -v fcitx5 >/dev/null && \
    command -v fcitx5-diagnose >/dev/null && \
    test -f /usr/lib/x86_64-linux-gnu/gtk-3.0/3.0.0/immodules/im-fcitx5.so && \
    test -f /usr/lib/x86_64-linux-gnu/fcitx5/libpinyin.so && \
    test -f /usr/share/fcitx5/inputmethod/pinyin.conf && \
    test -f /usr/share/icons/hicolor/16x16/apps/fcitx.png && \
    test -f /usr/share/icons/hicolor/16x16/apps/fcitx-pinyin.png && \
    test -f /usr/share/icons/AdwaitaLegacy/16x16/legacy/applications-system.png && \
    test -f /usr/share/icons/AdwaitaLegacy/16x16/legacy/utilities-terminal.png && \
    test -f /etc/X11/xrdp/xorg.conf && \
    test -x /etc/xrdp/startwm.sh
