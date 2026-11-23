function forumExtension() {
  const app = flarum.reg.get('core', 'forum/app');
  const id = 'vatebur-message-chat-enhancement';
  const messages = 'ext:flarum/messages/forum/components/';
  const composerModule = 'forum/components/MessageComposer';

  app.initializers.add(id, () => {
    // Flarum hydrates forum and session after initializers, before mounting.
    app.beforeMount(initializeInlineReply);
  });

  function initializeInlineReply() {
    if (!app.forum.attribute('vateburMessageInlineReply')) return;

    const { extend } = flarum.reg.get('core', 'common/extend');
    const ComposerState = flarum.reg.get('core', 'forum/states/ComposerState');
    const Stream = flarum.reg.get('core', 'common/utils/Stream');
    const streams = new Map();
    const drafts = new Map();
    const inlineComposers = new WeakMap();
    let InlineMessageComposer;
    let loadingComposer;

    function releaseDraft(dialogId, draft) {
      if (!draft.views && !draft.sending && !draft.content()) drafts.delete(dialogId);
    }

    function useInlineReply(dialog) {
      return InlineMessageComposer && dialog.canSendMessage() && !app.composer.composingMessageTo?.(dialog);
    }

    const ReplyDock = {
      oninit({ attrs }) {
        this.dialogId = attrs.dialog.id();
        this.draft = drafts.get(this.dialogId) ?? { content: Stream(''), sending: false, revision: 0, views: 0 };
        this.draft.views++;
        drafts.set(this.dialogId, this.draft);
      },

      onremove() {
        this.draft.views--;
        releaseDraft(this.dialogId, this.draft);
      },

      view({ attrs }) {
        return m('div.MceInlineReply', { 'aria-busy': String(this.draft.sending) }, m(InlineMessageComposer, {
          key: this.draft.revision,
          draft: this.draft,
          user: app.session.user,
          replyingTo: attrs.dialog,
        }));
      },
    };

    function loadComposer() {
      // The official reply path loads the core body before evaluating MessageComposer.
      loadingComposer ??= flarum.reg.asyncModuleImport('flarum/forum/components/ComposerBody')
        .then(() => flarum.reg.asyncModuleImport(`ext:flarum/messages/${composerModule}`))
        .then(() => {
          // A subclass can inherit its parent's default export from the lazy loader.
          const MessageComposer = flarum.reg.get('flarum-messages', composerModule);

          InlineMessageComposer = class extends MessageComposer {
            oninit(vnode) {
              const { draft, replyingTo } = vnode.attrs;
              const composer = new ComposerState();
              composer.fields.content = draft.content;
              composer.body = { componentClass: MessageComposer, attrs: { replyingTo } };
              composer.position = ComposerState.Position.NORMAL;
              vnode.attrs.composer = composer;
              vnode.attrs.originalContent = draft.content();
              inlineComposers.set(composer, draft);
              super.oninit(vnode);
            }

            onremove(vnode) {
              this.composer.clear();
              super.onremove(vnode);
            }

            hasChanges() {
              return Boolean(this.composer.fields.content());
            }

            async onsubmit() {
              const { draft, replyingTo } = this.attrs;
              const content = draft.content();
              if (draft.sending || !content.trim() || !replyingTo.canSendMessage()) return;

              const dialogId = replyingTo.id();
              draft.sending = true;
              m.redraw();

              try {
                const message = await app.store.createRecord('dialog-messages').save(this.data(), {
                  params: { include: ['dialog'] },
                });

                // Keep edits made while the request was pending. The editor driver
                // has no reset method, so rebuild its body inside the same dock.
                if (draft.content() === content) {
                  draft.content('');
                  draft.revision++;
                }

                streams.get(dialogId)?.receive(message);
              } catch {
                // Flarum reports request errors. Leave the draft available to retry.
              } finally {
                draft.sending = false;
                releaseDraft(dialogId, draft);
                m.redraw();
              }
            }
          };

          m.redraw();
        })
        .catch((error) => {
          // If an upstream chunk cannot load, the original reply action stays available.
          console.warn('Message Chat Enhancement could not load the inline reply editor.', error);
        });
    }

    extend(messages + 'MessageStream', 'oninit', function () {
      const dialog = this.attrs.dialog;
      const dialogId = dialog.id();
      streams.set(dialogId, this);

      // Messages' optional Realtime integration normally reads the floating draft.
      const checkTyping = this.checkTyping;
      if (typeof checkTyping !== 'function' || !Array.isArray(this.typingChannels)) return;

      this.checkTyping = () => {
        const draft = drafts.get(dialogId);
        if (!draft?.views || !useInlineReply(dialog)) return checkTyping.call(this);

        const content = draft.content();
        if (content !== '' && content !== this.typingPrevious) this.typingDirty = true;
        this.typingPrevious = content;

        const now = Date.now();
        if (!this.typingDirty || now - this.typingSentAt < 2000) return;

        this.typingChannels[0]?.trigger('client-typing', {});
        this.typingDirty = false;
        this.typingSentAt = now;
      };
    });

    extend(messages + 'MessageStream', 'onremove', function () {
      const dialogId = this.attrs.dialog.id();
      if (streams.get(dialogId) === this) streams.delete(dialogId);
    });

    extend(messages + 'MessageStream', 'content', function (items) {
      if (!useInlineReply(this.attrs.dialog)) return;

      const placeholder = items.findIndex((item) => item?.key === 'reply');
      if (placeholder !== -1) items.splice(placeholder, 1);
    });

    extend(messages + 'DialogSection', 'view', function (view) {
      const dialog = this.attrs.dialog;
      if (!dialog.canSendMessage()) return;

      loadComposer();
      if (!useInlineReply(dialog)) return;

      view.attrs.className += ' DialogSection--mceInlineReply';
      view.children.push(m('div.MceReplyDock', m(ReplyDock, { key: dialog.id(), dialog })));
    });

    extend('flarum/common/components/TextEditor', 'controlItems', function (items) {
      const draft = inlineComposers.get(this.attrs.composer);
      const submit = items.get('submit');
      if (!draft || !submit) return;

      // The inline submit belongs in the dock, not Flarum's mobile header.
      submit.attrs.itemClassName = (submit.attrs.itemClassName ?? '')
        .split(/\s+/).filter((name) => name !== 'App-primaryControl').join(' ');
      if (draft.sending) submit.attrs.loading = true;
    });
  }

  return {};
}
