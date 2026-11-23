<?php

declare(strict_types=1);

use Flarum\Extend;

$groups = json_decode(file_get_contents(__DIR__.'/style-groups.json'), true, flags: JSON_THROW_ON_ERROR);
$settings = new Extend\Settings();
$forum = new Extend\Frontend('forum');
$enabled = static fn (mixed $value): bool => in_array($value, [true, 1, '1'], true);

foreach ($groups as $group) {
    $key = "vatebur-message-chat-enhancement.$group";

    $settings
        ->default($key, '0')
        ->registerLessConfigVar("mce-$group", $key, static fn (mixed $value): int => (int) $enabled($value));

    $forum->css(__DIR__."/less/$group.less");
}

$settings->serializeToForum('vateburMessageInlineReply', 'vatebur-message-chat-enhancement.chat-composer', $enabled);
$forum->js(__DIR__.'/js/dist/forum.js');

return [
    $settings,
    $forum,
    (new Extend\Frontend('admin'))->js(__DIR__.'/js/dist/admin.js'),
    new Extend\Locales(__DIR__.'/locale'),
];
