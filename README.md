# Message 聊天增强

把 Flarum「外观 → 自定义样式」里的私信和论坛样式迁移为可独立启用的扩展。以 Flarum 2.0.2、Messages 2.0.2 和 Melon 0.1.3 上使用的样式为基础。要求 PHP 8.3 及以上、Flarum 2.0.2 及以上（2.x）和官方 Messages 2.0.2 及以上（2.x）。Melon 为可选扩展。

## 样式开关

| 区域 | 可独立启用的样式 |
| --- | --- |
| 私信 | 页面布局、会话列表和标题栏、消息气泡和媒体、回复输入栏 |
| 论坛 | 东方未明配色和门户、移动端帖子正文、移动端主题列表、移动端版块目录、移动端用户资料 |
| 编辑器 | 通用紧凑样式、发帖和回帖 |

同时启用私信「页面布局」和「回复输入栏」，编辑器会贴合对话底部。只启用「回复输入栏」时，输入框样式会应用到 Flarum 原有的编辑器布局上。关闭「东方未明配色和门户」后，其他区域会回退到当前主题的颜色变量。

## 安装与迁移

1. GitHub 仓库为私有仓库。使用只对本仓库有 `Contents: Read-only` 权限的 GitHub 细粒度访问令牌。在 Flarum 根目录运行 `composer config --editor --auth`，将令牌写入 `github-oauth.github.com`。见 [Composer 私有仓库认证文档](https://getcomposer.org/doc/articles/authentication-for-private-packages.md#github-oauth)。
2. 在包含 `flarum` 命令和 `composer.json` 的 Flarum 根目录添加 GitHub 仓库并安装。

   ```sh
   composer config repositories.message-chat-enhancement vcs https://github.com/vatebur/flarum-message-chat-enhancement.git
   composer require vatebur/flarum-message-chat-enhancement:0.1.0
   ```

3. 在 Flarum 后台启用 **Message 聊天增强**，打开扩展页。全部开关初次安装时关闭。勾选需要的组并保存。要接管本次迁移涉及的全部外观样式，请开启全部 11 组。
4. 备份「外观 → 编辑自定义 CSS」中的原内容，再从该栏移除已迁移的规则并保存。手工添加的其他规则可留在原处。旧规则留在该栏时，扩展开关关闭后仍会看到旧规则的效果。
5. 刷新论坛页面。Flarum 会在保存开关后重新编译资源。如需恢复原样式，可先粘贴备份，再停用扩展。

安装包内含后台脚本。修改后台源码后，在仓库根目录运行 `node js/build.mjs`，并提交生成的 `js/dist/admin.js`。样式分组位于 `less/`，后台开关列表在 `style-groups.json`。
