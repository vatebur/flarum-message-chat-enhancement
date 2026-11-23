function adminExtension(groups) {
  const app = flarum.reg.get('core', 'admin/app');
  const Extend = flarum.reg.get('core', 'common/extenders');
  const id = 'vatebur-message-chat-enhancement';
  const settings = new Extend.Admin();

  groups.forEach((group, index) => {
    const priority = groups.length - index + (group.startsWith('chat-') ? groups.length : 0);

    settings.setting(
      () => ({
        setting: `${id}.${group}`,
        label: app.translator.trans(`${id}.admin.settings.${group}.label`),
        help: app.translator.trans(`${id}.admin.settings.${group}.help`),
        type: 'boolean',
      }),
      priority
    );
  });

  return { extend: [settings] };
}
