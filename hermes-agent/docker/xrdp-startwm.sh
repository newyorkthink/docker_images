#!/bin/sh
set -eu

unset DBUS_SESSION_BUS_ADDRESS
unset SESSION_MANAGER

export HOME=/opt/data
export LANG=zh_CN.UTF-8
export LANGUAGE=zh_CN:zh
export LC_ALL=zh_CN.UTF-8
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
export GTK_THEME=Adwaita:dark
export XDG_CURRENT_DESKTOP=OPENBOX
export XDG_SESSION_DESKTOP=openbox
export DESKTOP_SESSION=openbox

# 窗口管理器使用 Openbox，面板使用 tint2，桌面层使用 xfdesktop；Konqueror 保持主文件管理入口。
# Thunar 仅用于 xfdesktop 的桌面特殊图标/文件管理首选应用；GTK 使用深色主题，图标主题仍独立使用彩色 Adwaita 系列。
exec dbus-run-session -- sh -c '
    command -v xdg-user-dirs-update >/dev/null 2>&1 && xdg-user-dirs-update >/dev/null 2>&1 || true

    # 首次创建应用程序启动器桌面入口；不覆盖同名文件，初始化完成后用户删除也不会反复生成。
    appfinder_marker="$HOME/.config/hermes/appfinder-launcher-v1"
    if [ ! -e "$appfinder_marker" ]; then
        desktop_dir="$(xdg-user-dir DESKTOP 2>/dev/null || true)"
        if [ -n "$desktop_dir" ] && [ -f /usr/share/applications/xfce4-appfinder.desktop ]; then
            mkdir -p "$desktop_dir" "$(dirname "$appfinder_marker")"
            launcher="$desktop_dir/应用程序.desktop"
            if [ -e "$launcher" ]; then
                : > "$appfinder_marker"
            elif install -m 0755 /usr/share/applications/xfce4-appfinder.desktop "$launcher"; then
                gio set -t string "$launcher" metadata::trusted true >/dev/null 2>&1 || true
                : > "$appfinder_marker"
            fi
        fi
    fi

    # 仅迁移未修改的 Debian 默认 Openbox 菜单；用户自定义菜单保持原样。
    user_openbox_menu="$HOME/.config/openbox/menu.xml"
    stock_openbox_menu="/usr/local/share/hermes/openbox-menu.debian.xml"
    if [ -f "$user_openbox_menu" ] && [ -f "$stock_openbox_menu" ] && cmp -s "$user_openbox_menu" "$stock_openbox_menu"; then
        cp /etc/xdg/openbox/menu.xml "$user_openbox_menu"
    fi

    # 初始化 Xfce 首选文件管理器和终端；仅迁移本镜像此前写入的终端默认值，其他用户选择不覆盖。
    xfce_helpers="$HOME/.config/xfce4/helpers.rc"
    mkdir -p "$HOME/.config/xfce4"
    touch "$xfce_helpers"
    grep -q "^FileManager=" "$xfce_helpers" || printf "%s\n" "FileManager=thunar" >> "$xfce_helpers"
    if grep -q "^TerminalEmulator=debian-x-terminal-emulator$" "$xfce_helpers"; then
        sed -i "s/^TerminalEmulator=debian-x-terminal-emulator$/TerminalEmulator=xfce4-terminal/" "$xfce_helpers"
    elif ! grep -q "^TerminalEmulator=" "$xfce_helpers"; then
        printf "%s\n" "TerminalEmulator=xfce4-terminal" >> "$xfce_helpers"
    fi

    # 图标主题与深色 GTK 主题分开设置；只在用户没有图标主题时默认使用 Adwaita。
    gtk_settings="$HOME/.config/gtk-3.0/settings.ini"
    mkdir -p "$HOME/.config/gtk-3.0"
    if [ ! -s "$gtk_settings" ]; then
        printf "%s\n" "[Settings]" "gtk-icon-theme-name=Adwaita" > "$gtk_settings"
    elif ! grep -q "^[[:space:]]*gtk-icon-theme-name[[:space:]]*=" "$gtk_settings"; then
        if grep -q "^\[Settings\][[:space:]]*$" "$gtk_settings"; then
            sed -i "/^\[Settings\][[:space:]]*$/a gtk-icon-theme-name=Adwaita" "$gtk_settings"
        else
            printf "%s\n" "" "[Settings]" "gtk-icon-theme-name=Adwaita" >> "$gtk_settings"
        fi
    fi

    # Debian 13 默认关闭 PulseAudio 客户端 autospawn，当前 Openbox 会话也没有 systemd --user；先显式启动会话级 PulseAudio，再加载官方 xrdp 音频模块。
    if ! pactl info >/dev/null 2>&1; then
        pulseaudio --start --exit-idle-time=-1 >/dev/null 2>&1 || echo "[xrdp] PulseAudio 会话服务启动失败，桌面继续启动。" >&2
    fi

    if pactl info >/dev/null 2>&1; then
        if [ -x /usr/libexec/pulseaudio-module-xrdp/load_pa_modules.sh ]; then
            /usr/libexec/pulseaudio-module-xrdp/load_pa_modules.sh || echo "[xrdp] PulseAudio xrdp 音频模块加载失败，桌面继续启动。" >&2
        else
            echo "[xrdp] PulseAudio xrdp 音频模块加载脚本不存在，桌面继续启动。" >&2
        fi
    else
        echo "[xrdp] PulseAudio 会话服务不可用，RDP 音频不可用，桌面继续启动。" >&2
    fi

    fcitx5 -d >/dev/null 2>&1 || true

    openbox &
    wm_pid=$!

    i=0
    while ! wmctrl -m >/dev/null 2>&1; do
        i=$((i + 1))
        [ "$i" -ge 50 ] && break
        sleep 0.1
    done

    xfdesktop &
    tint2 &

    wait "$wm_pid"
'
