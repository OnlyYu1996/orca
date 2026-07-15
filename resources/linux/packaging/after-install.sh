#!/bin/bash
# 原因：无界面的服务器无法点击应用内“安装 CLI”，安装包必须直接注册 sbbgt。
#
# The shim resolves the real app by walking up from its own location, so a
# symlink works. We discover the install dir instead of hardcoding /opt/Orca
# because electron-builder's directory name can vary by productName sanitization.
set -e

primary_link="/usr/bin/sbbgt"
legacy_link="/usr/bin/orca-ide"

for dir in "/opt/赛博包工头" /opt/sbbgt /opt/Orca /opt/orca-ide /opt/orca; do
  sandbox="$dir/chrome-sandbox"
  if [ -f "$sandbox" ]; then
    # Why: packaged Linux installs must leave Chromium's sandbox helper usable
    # on hosts where unprivileged user namespaces are unavailable.
    chmod 4755 "$sandbox" || true
  fi

  shim="$dir/resources/bin/sbbgt"
  if [ -x "$shim" ]; then
    if [ ! -e "$primary_link" ] || [ -L "$primary_link" ]; then
      ln -sf "$shim" "$primary_link"
    fi
    legacy_shim="$dir/resources/bin/orca-ide"
    if [ -x "$legacy_shim" ] && { [ ! -e "$legacy_link" ] || [ -L "$legacy_link" ]; }; then
      ln -sf "$legacy_shim" "$legacy_link"
    fi
    break
  fi
done

exit 0
