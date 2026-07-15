#!/bin/bash
# 原因：只移除指向本产品安装目录的链接，不能删除用户或其他软件拥有的命令。
set -e

for link in /usr/bin/sbbgt /usr/bin/orca-ide; do
  if [ -L "$link" ]; then
    target="$(readlink "$link" || true)"
    case "$target" in
      /opt/赛博包工头/*|/opt/sbbgt/*|/opt/Orca/*|/opt/orca-ide/*|/opt/orca/*)
        rm -f "$link"
        ;;
    esac
  fi
done

exit 0
