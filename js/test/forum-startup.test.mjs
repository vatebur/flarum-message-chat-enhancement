import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const bundle = await readFile(new URL('../dist/forum.js', import.meta.url), 'utf8');

for (const enabled of [true, false]) {
  test(`boots before forum hydration with inline replies ${enabled ? 'enabled' : 'disabled'}`, () => {
    const initializers = [];
    const beforeMounts = [];
    const hooks = [];
    const app = {
      initializers: { add: (_id, callback) => initializers.push(callback) },
      beforeMount: (callback) => beforeMounts.push(callback),
    };
    const modules = {
      'forum/app': app,
      'common/extend': { extend: (...args) => hooks.push(args) },
      'forum/states/ComposerState': class {},
      'common/utils/Stream': () => {},
    };

    runInNewContext(bundle, {
      module: { exports: {} },
      flarum: { reg: { get: (_extension, name) => modules[name] } },
    });

    assert.equal(initializers.length, 1);
    // Flarum runs initializers before pushing resources into the store.
    assert.equal(app.forum, undefined);
    initializers.forEach((initialize) => initialize(app));
    assert.equal(hooks.length, 0);
    assert.equal(beforeMounts.length, 1);

    app.forum = {
      attribute(name) {
        assert.equal(name, 'vateburMessageInlineReply');
        return enabled;
      },
    };
    app.session = { user: null };
    beforeMounts.forEach((callback) => callback());

    assert.deepEqual(hooks.map(([component, method]) => [component, method]), enabled ? [
      ['ext:flarum/messages/forum/components/MessageStream', 'oninit'],
      ['ext:flarum/messages/forum/components/MessageStream', 'onremove'],
      ['ext:flarum/messages/forum/components/MessageStream', 'content'],
      ['ext:flarum/messages/forum/components/DialogSection', 'view'],
      ['flarum/common/components/TextEditor', 'controlItems'],
    ] : []);
  });
}
