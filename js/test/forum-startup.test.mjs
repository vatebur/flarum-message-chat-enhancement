import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const bundle = await readFile(new URL('../dist/forum.js', import.meta.url), 'utf8');

test('keeps inline submit controls out of the mobile header without changing floating composers', async () => {
  const hooks = new Map();
  let initialize;
  let beforeMount;
  const app = {
    initializers: { add: (_id, callback) => { initialize = callback; } },
    beforeMount: (callback) => { beforeMount = callback; },
    forum: { attribute: () => true },
    session: { user: {} },
    composer: {},
  };
  class ComposerState {
    static Position = { NORMAL: 'normal' };
    fields = {};
  }
  class MessageComposer { oninit() {} }
  const modules = {
    'forum/app': app,
    'common/extend': { extend: (component, method, callback) => hooks.set(`${component}:${method}`, callback) },
    'forum/states/ComposerState': ComposerState,
    'common/utils/Stream': (initial) => { let value = initial; return (...args) => args.length ? (value = args[0]) : value; },
    'forum/components/MessageComposer': MessageComposer,
  };
  const m = (tag, attrs, ...children) => ({ tag, attrs, children });
  m.redraw = () => {};
  runInNewContext(bundle, {
    module: { exports: {} }, m,
    flarum: { reg: { get: (_extension, name) => modules[name], asyncModuleImport: async () => {} } },
  });
  initialize();
  beforeMount();

  const dialog = { id: () => '2', canSendMessage: () => true };
  const section = hooks.get('ext:flarum/messages/forum/components/DialogSection:view');
  section.call({ attrs: { dialog } }, { attrs: {}, children: [] });
  await new Promise((resolve) => setImmediate(resolve));
  const view = { attrs: { className: 'DialogSection' }, children: [] };
  section.call({ attrs: { dialog } }, view);
  const dock = view.children[0].attrs;
  const dockState = {};
  dock.tag.oninit.call(dockState, { attrs: dock.attrs });
  const composer = dock.tag.view.call(dockState, { attrs: dock.attrs }).children[0];
  const instance = new composer.tag();
  instance.oninit({ attrs: composer.attrs });
  const controls = hooks.get('flarum/common/components/TextEditor:controlItems');
  const submit = { attrs: { itemClassName: 'custom App-primaryControl' } };
  const items = { get: () => submit };
  controls.call({ attrs: { composer: {} } }, items);
  assert.equal(submit.attrs.itemClassName, 'custom App-primaryControl');
  controls.call({ attrs: { composer: composer.attrs.composer } }, items);
  assert.equal(submit.attrs.itemClassName, 'custom');
  composer.attrs.draft.sending = true;
  controls.call({ attrs: { composer: composer.attrs.composer } }, items);
  assert.equal(submit.attrs.loading, true);
});

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
