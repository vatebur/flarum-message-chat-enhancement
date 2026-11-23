# Message Chat Enhancement

English | [简体中文](README.md)

An extension that turns custom CSS for Flarum Messages and forum pages into independently controlled style groups, with a persistent inline reply composer for private conversations.

The styles were developed on Flarum 2.0.2, the official Messages extension 2.0.2, and Melon 0.1.3. Requires PHP 8.3 or later, Flarum 2.0.2 or later (2.x), and the official Messages extension 2.0.2 or later (2.x). Melon is optional.

## Features and settings

Each group can be enabled separately. All groups are disabled on a fresh installation.

| Area | Available groups |
| --- | --- |
| Messages | Page layout; conversations and header; bubbles and media; persistent inline reply composer |
| Forum | Warm paper theme and portal; mobile discussion pages; mobile discussion lists; mobile board directory; mobile user profiles |
| Editor | Compact shared styles; discussion and reply composers |

**Theme dependency:** The color changes in **Forum · Warm paper theme and portal** require the **Masthead** extension. Install and enable Masthead before enabling this group. With this group disabled, the other groups fall back to the current theme's color variables.

Enable **Messages · Inline reply composer** to let users with reply permission type directly at the bottom of a conversation. The input area stays in place after sending. Unsent drafts are temporarily retained when switching conversations within the current page, and failed sends keep their content available to retry. Drafts are not persisted across page reloads. Previously saved reply composer settings remain effective, and the page layout group can be controlled separately.

On phones, the inline send button is 44px tall and aligned to the right. With the page layout group enabled, conversations fill the available content height while respecting bottom navigation padding supplied by the theme.

The extension includes English and Simplified Chinese translations for all admin settings. Labels and help text follow the admin interface language.

## Installation

Run these commands in your Flarum root directory, which contains `flarum` and `composer.json`:

```sh
composer config repositories.message-chat-enhancement vcs https://github.com/vatebur/flarum-message-chat-enhancement.git
composer require vatebur/flarum-message-chat-enhancement
php flarum cache:clear
```

The explicit VCS repository also supports installation before the package is available on Packagist. If the package is already available through your configured Composer repositories, you can omit the first command.

Enable **Message Chat Enhancement** in the admin panel, open its settings, and select the groups you want. Enable all 11 groups to apply the complete set of migrated styles. Save your settings and refresh the forum. Flarum recompiles the assets when the settings are saved.

## Updating

```sh
composer update vatebur/flarum-message-chat-enhancement --with-all-dependencies
php flarum cache:clear
```

Refresh the browser after updating.

## Migrating existing custom CSS

Back up the contents of **Appearance → Custom Styles** before removing any rules that overlap with this extension. Keep unrelated customizations. Rules left in Custom Styles may override the extension and continue to apply even when the corresponding extension setting is disabled.

To restore your previous setup, restore the CSS backup and disable this extension.

## Development

The package includes the built admin and forum scripts. After changing JavaScript source files, run this command from the repository root and commit the generated files in `js/dist/`:

```sh
node js/build.mjs
```

Run the JavaScript regression tests with:

```sh
node --test js/test/*.test.mjs
```

Style groups live in `less/`. Their admin setting names are listed in `style-groups.json`, and translations are in `locale/`.

## Support

Report problems or suggest improvements through [GitHub Issues](https://github.com/vatebur/flarum-message-chat-enhancement/issues). For layout issues, include your Flarum version, theme, relevant extensions, and a screenshot.

## Masthead Simplified Chinese patch

Since v0.1.5, the extension includes all 60 frontend translations from the custom-footer patch for Masthead 1.9.2. These cover navigation, featured discussions, boards, latest discussions, active members, games, the footer, and discussion details. Since v0.1.6, the independent **Masthead · Simplified Chinese translations** switch controls this patch. It defaults to on to preserve v0.1.5 behavior. Turning it off and refreshing the forum restores translations from other language packs. When enabled, Flarum loads the patch through its native locale system for `zh-Hans`, independently of the 11 style switches. Masthead is optional and loads first when installed. Other locales retain their existing translations.

After updating and clearing the Flarum cache, remove the block between `BEGIN: Masthead 简体中文汉化补丁` and `END: Masthead 简体中文汉化补丁` from **Appearance → Custom Footer**, including its marker comments. Keep other footer content, including the fish styles, container, and script. Keep the old patch until the site has been updated. The old footer script runs independently: if it remains, it will still apply its translations even with the extension switch off.

## License

Released under the [MIT License](LICENSE).
