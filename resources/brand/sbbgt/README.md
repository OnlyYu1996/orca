# 赛博包工头图标

本目录是用户指定图标目录的仓库内快照。构建只读取仓库内资源，不依赖开发机上的绝对路径。

导入来源：

- `/Users/a1234/Documents/学习资料/auto-coding/frontend/src-tauri/icons`
- `icon.svg` 和 `icon_1024.png` 作为可编辑源图与高分辨率主图。
- `icon.icns`、`icon.ico` 以及各 PNG 尺寸按原样保留，便于溯源和重新导出。

项目消费路径：

- Electron Builder：`resources/build/icon.icns`、`resources/build/icon.ico`、`resources/build/icon.png`。
- 桌面运行时：`resources/icon.png` 和 `resources/logo.svg`。
- Expo Mobile：`mobile/assets/icon.png`、`mobile/assets/adaptive-icon.png`、`mobile/assets/splash-icon.png`。
