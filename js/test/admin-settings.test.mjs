import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

test('registers Masthead translations separately from the eleven style settings', async () => {
  const bundle = await readFile(new URL('../dist/admin.js', import.meta.url), 'utf8');
  const groups = JSON.parse(await readFile(new URL('../../style-groups.json', import.meta.url), 'utf8'));
  const registered = [];
  const app = { translator: { trans: (key) => key } };
  class Admin {
    setting(callback) { registered.push(callback()); }
  }

  runInNewContext(bundle, {
    module: { exports: {} },
    flarum: { reg: { get: (_extension, name) => {
      if (name === 'admin/app') return app;
      if (name === 'common/extenders') return { Admin };
      throw new Error(`Unexpected module: ${name}`);
    } } },
  });

  const prefix = 'vatebur-message-chat-enhancement';
  assert.equal(registered.length, groups.length + 1);
  assert.deepEqual(registered.slice(0, -1).map(({ setting }) => setting), groups.map((group) => `${prefix}.${group}`));
  const masthead = registered.at(-1);
  assert.equal(masthead.setting, `${prefix}.masthead-zh-hans`);
  assert.equal(masthead.type, 'boolean');
  assert.equal(masthead.label, `${prefix}.admin.settings.masthead-zh-hans.label`);
  assert.equal(masthead.help, `${prefix}.admin.settings.masthead-zh-hans.help`);
  assert(!groups.includes('masthead-zh-hans'));
});
