import { inject as service } from '@ember/service';
import styles from './styles';
import caseContentStyles from 'frontend-cp/components/ko-case-content/styles';
import linkManagerStyles from 'frontend-cp/components/ko-text-editor/link-manager/styles';
import config from 'frontend-cp/config/environment';
import { scheduleOnce, cancel } from '@ember/runloop';
import Component from '@ember/component';
import { computed } from '@ember/object';
import $ from 'jquery';
import { isMac } from 'frontend-cp/utils/platform';
import { stripFormattingFromHTML } from 'frontend-cp/lib/html-to-text';
import * as KeyCodes from 'frontend-cp/lib/keycodes';
import dispatchEvent from 'frontend-cp/utils/dispatch-event';
import { run } from '@ember/runloop';
import { task, timeout } from 'ember-concurrency';

export const EDITOR_SELECTOR = `.${styles.froalaTextArea} .froala-editor-instance`;

const _COMMANDS = {
  bold: {
    command: ['commands.bold'],
    format: 'strong'
  },
  italic: {
    command: ['commands.italic'],
    format: 'em'
  },
  underline: {
    command: ['commands.underline'],
    format: 'u'
  },
  strikeThrough: {
    command: ['commands.strikeThrough'],
    format: 's'
  },
  outdent: {
    command: ['commands.outdent']
  },
  indent: {
    command: ['commands.indent']
  },
  url: {
    command: []
  },
  ul: {
    command: ['lists.format', 'UL']
  },
  ol: {
    command: ['lists.format', 'OL']
  },
  'quote.increase': {
    command: []
  },
  'quote.decrease': {
    command: []
  },
  'paragraph.format': {
    command: []
  }
};

export default Component.extend({
  session: service(),
  notificationService: service('notification'),
  i18n: service(),
  store: service(),
  metrics: service(),

  // Attributes
  isRichFormattingAvailable: true,
  onAttachFiles: null,
  placeholder: null,
  isErrored: true,
  allowFormatting: true,
  isNote: false,
  showMacros: false,
  onTextChanged: null,
  value: '',
  onCancelAttachment: () => {},
  attachedFiles: null,
  autofocus: true,
  _editor: null,
  _editorEventsAdded: false,
  footerText: null,

  classNameBindings: ['disabledClass'],
  localClassNames: ['root'],

  isButtonBold: false,
  isButtonItalic: false,
  isButtonUl: false,
  isButtonOl: false,
  isButtonIndentDisabled: false,
  isButtonOutdentDisabled: false,
  editorFocussed: false,
  isImageUploading: false,
  isGeneratingSummary: false,
  generatedSummary: '',
  isAddingSummaryToCase: false,

  messengerHelpText: null,
  isCopilotEnabled: false, // Default value for AI Copilot feature flag

  init() {
    this._super(...arguments);
    let copilotEnabled = localStorage.getItem('isCopilotEnabled');
    if (copilotEnabled !== null) {
      this.set('isCopilotEnabled', copilotEnabled === 'true');
      localStorage.setItem('isCopilotEnabled', this.get('isCopilotEnabled'));
    }
  },

  isSummaryModalVisible: computed('generatedSummary', function() {
    return !!this.get('generatedSummary');
  }),

  froalaParams: computed('placeholder', 'plugins', function() {
    const lineHeight = 20;
    const padding = 24;
    return {
      requestHeaders: { 'X-CSRF-Token': this.get('session.csrfToken') },
      heightMin: 1 * lineHeight + padding,
      heightMax: 10 * lineHeight + padding,
      key: config.froalaEditor.key,
      toolbarContainer: false,
      charCounterCount: false,
      shortcutsEnabled: ['undo', 'redo', 'bold', 'italic', 'underline'],
      spellcheck: true,
      placeholderText: this.get('placeholder'),
      imageResizeWithPercent: true,
      imagePaste: true,
      imageUploadURL: '/api/v1/media?include=*',
      imageUploadParam: 'files',
      imageDefaultDisplay: 'inline',
      imageEditButtons: [],
      imageOutputSize: true,
      imageDefaultWidth: 0,
      imageSplitHTML: true,
      enter: $.FroalaEditor.ENTER_DIV,
      toolbarButtons: [],
      toolbarButtonsMD: [],
      toolbarButtonsSM: [],
      toolbarButtonsXS: [],
      toolbarInline: false,
      toolbarVisibleWithoutSelection: false,
      linkEditButtons: ['linkOpen', 'linkEdit', 'linkRemove'],
      pluginsEnabled: this.get('plugins'),
      paragraphFormat: {
        N: 'Normal',
        PRE: 'Code'
      },
      zIndex: 60
    };
  }),

  plugins: [
    'align',
    'link',
    'lists',
    'paragraphFormat',
    'quote',
    'url',
    'image'
  ],


  _isRelatedToTarget(target, className) {
    return $(target).hasClass(className) || $(target).parents('.' + className).length;
  },

  shortcutPrefix: computed(function() {
    return isMac() ? '⌘' : 'Ctrl+';
  }),

  submitShortcut: computed(function() {
    return isMac() ? '⌘ + Enter' : 'Ctrl + Enter';
  }),

  showSubmitTip: computed.bool('value'),

  didReceiveAttrs() {
    this._super(...arguments);
    this._scheduleApplyPlaceholder();
  },

  didInsertElement() {
    this._super(...arguments);
    this.setupFocusEvents();
  },

  didRender() {
    this._super(...arguments);
    this._applyDisabledState();
  },

  willDestroyElement() {
    this._super(...arguments);
    this.tearDownFocusEvents();
    this._tearDownFroalaEvents(this.get('_editor'));

    cancel(this._afterRenderTimer);
  },

  scheduleEditorFocus() {
    this._afterRenderTimer = scheduleOnce('afterRender', this, 'focusEditor');
  },

  focusEditor() {
    this.getFroalaElement().froalaEditor('events.focus');
    this._refreshToolbarIcons();
  },

  focusIn() {
    run.next(() =>{
      if (this.isDestroyed || this.isDestroying) { return; }
      this.set('editorFocussed', true);
    });
  },

  focusOut() {
    run.next(() =>{
      if (this.isDestroyed || this.isDestroying) { return; }
      this.set('editorFocussed', false);
    });
  },

  setupFocusEvents() {
    this.$(document).on(`click.${this.get('elementId')}`, (event) => {
      const isPlaceholder =
        this._isRelatedToTarget(event.target, 'ko-feed_item_menu') ||
        this._isRelatedToTarget(event.target, 'ember-power-select-dropdown') ||
        this._isRelatedToTarget(event.target, styles.dropdownContent) ||
        this._isRelatedToTarget(event.target, styles.dropdown) ||
        this._isRelatedToTarget(event.target, caseContentStyles.replyOptions) ||
        this._isRelatedToTarget(event.target, linkManagerStyles.container);

      if (isPlaceholder || (this.$() && $.contains(this.$()[0], event.target))) {
        return;
      }
    });
  },

  tearDownFocusEvents() {
    this.$(document).off(`click.${this.get('elementId')}`);
  },

  didUpdateAttrs() {
    this._super(...arguments);
    if (!this.getFroalaElement()) {
      return;
    }

    const editor = this.get('_editor');
    if (this.get('isRichFormattingAvailable')) {
      if (editor && !this.get('_editorEventsAdded')) {
        this._setupFroalaEvents(editor);
      }
    } else {
      this._tearDownFroalaEvents(editor);
    }
  },

  getEditorContent() {
    const editor = this.get('_editor');
    if (editor) {
      return editor.html.get();
    }
    return '';
  },

  _applyDisabledState() {
    const element = this.getFroalaElement();
    if (!element) {
      return;
    }

    element.froalaEditor(this.get('disabled') ? 'edit.off' : 'edit.on');
  },

  getFroalaElement() {
    return this.$(EDITOR_SELECTOR);
  },

  disabledClass: computed('disabled', function() {
    if (this.get('disabled')) {
      return styles.disabled;
    }
  }),

  _refreshToolbarIcons() {
    const _editor = this.get('_editor');

    if (!_editor) {
      return;
    }

    Object.keys(_COMMANDS).forEach(key => {
      const command = _COMMANDS[key];

      if (command.format) {
        this.set(`isButton_${key}`.camelize(), _editor.format.is(command.format));
      } else if (['ul', 'ol'].indexOf(key) > -1 && _editor.lists) {
        const div = $('<div />');

        _editor.lists.refresh(div, key.toUpperCase());

        this.set(`isButton_${key}`.camelize(), div.hasClass('fr-active'));
      } else if (key === 'indent') {
        const indent = $('<div />');

        _editor.refresh.indent(indent);

        this.set('isButtonIndentDisabled', indent.hasClass('fr-disabled'));
      } else if (key === 'outdent') {
        const outdent = $('<div />');

        _editor.refresh.outdent(outdent);

        this.set('isButtonOutdentDisabled', outdent.hasClass('fr-disabled'));
      }
    });
  },

  _setupFroalaEvents(editor) {
    if (!editor) {
      return;
    }

    editor.$el.on('mouseup.ko keyup.ko blur.ko focus.ko contentChanged.ko', () => {
      this._refreshToolbarIcons();
    });

    // AI-GEN - Cursor and GPT4
    this.getFroalaElement().froalaEditor('events.on', 'keydown', (e) => {
      // re-broadcast mod+enter so KeyboardShortcuts can handle it elsewhere
      const modKey = e.ctrlKey || e.metaKey;
      if (modKey && e.keyCode === KeyCodes.enter) {
          // Check if image is still uploading
        if (this.get('isImageUploading')) {
              // Show a popup if ctrl+enter is pressed before image upload is complete
          // alert('Image upload is still in progress. Please wait until the upload is complete before submitting.');
          this.get('notificationService').error(this.get('i18n').t('generic.texteditor.image_upload_in_progress'));
          return false;
        }

        e.stopImmediatePropagation();
        e.preventDefault();

        dispatchEvent(this.get('element'), e.type, {
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
          keyCode: e.keyCode,
          charCode: e.charCode
        });

        return false;
      }
    }, true);

    this.getFroalaElement().on('froalaEditor.image.beforePasteUpload', (e, editor, response) => {
      this.set('isImageUploading', true);
      this.send('setImageUploadStatus', true);
    });

    this.getFroalaElement().on('froalaEditor.image.uploaded', (e, editor, response) => {
      let imageUrl = JSON.parse(response).data[0].attachment.url;
      this.send('insertImage', imageUrl);
      return false;
    });

    this.getFroalaElement().on('froalaEditor.image.inserted', () => {
      this.set('isImageUploading', false);
      this.send('setImageUploadStatus', false);
    });

    this.getFroalaElement().on('froalaEditor.image.removed', () => {
      this.set('isImageUploading', false);
      this.send('setImageUploadStatus', false);
    });

    this.set('_editorEventsAdded', true);
  },

  _tearDownFroalaEvents(editor) {
    if (!editor) {
      return;
    }

    editor.$el.off('blur.ko mouseup.ko keyup.ko blur.ko focus.ko contentChanged.ko');
    this.set('_editorEventsAdded', false);
  },

  _scheduleApplyPlaceholder() {
    let placeholder = this.get('placeholder');

    if (placeholder === this._prevPlaceholder) {
      return;
    }

    this._prevPlaceholder = placeholder;

    scheduleOnce('afterRender', this, '_applyPlaceholder');
  },

  _applyPlaceholder() {
    // From https://stackoverflow.com/a/46444280/273093

    let froala = this.getFroalaElement();
    let data = froala.data('froala.editor');
    let opts = data && data.opts;

    if (opts) {
      opts.placeholderText = this.get('placeholder');
      froala.froalaEditor('placeholder.refresh');
    }
  },

  _uploadingImagePlaceholder() {
    let $placeholder = $('img.fr-uploading');

    if ($placeholder.length > 0) {
      return $placeholder;
    }
  },

  aiSuggestion: '',      // Holds the AI-generated suggestion
  userInput: '',         // The current user input
  fetchAISuggestion: task(function* () {

    if (!this.get('isCopilotEnabled')) {
      this.set('aiSuggestion', '');
      return;
    }

    const text = this.get('userInput');
  
    // Early return if there's no text
    if (!text) {
      this.set('aiSuggestion', '');
      return;
    }
  
    // Debounce to limit API calls
    yield timeout(300);

    const caseId = this.get('case.id');
    if (!caseId) {
      return;
    }  
    
    try {
      // Get the context text from the page
      const caseContext = this.getCaseContextText();
  
      // Get the adapter
      const store = this.get('store');
      const copilotAdapter = store.adapterFor('case-ai-copilot');
  
      // Use the adapter's generateSuggestion method
      const suggestion = yield copilotAdapter.generateSuggestion(caseId, text, caseContext);
      
      const completion = suggestion;
  
      this.set('aiSuggestion', completion);

      this.displayAISuggestion();
    } catch (error) {
      // Handle errors appropriately

      this.get('notificationService').error('Error fetching AI suggestion. ' + error.message);
      this.set('aiSuggestion', '');
    }
  }).restartable(),

  generateSummary() {
    const caseId = this.get('case').id;
    const store = this.get('store');
    const caseSummaryAdapter = store.adapterFor('case-ai-summary');
    return caseSummaryAdapter.generateSummary(caseId);
  },

  getCaseContextText() {
    // Use querySelector to find the div with class starting with 'ko-timeline-2__container'
    // This accounts for dynamic class names like 'ko-timeline-2__container_vlsdot'
    let containerDiv = document.querySelector('div[class^="ko-timeline-2__container"]');

    if (containerDiv) {
      // Get the text content
      let textContent = containerDiv.textContent || '';

      // Clean up the text (optional)
      textContent = textContent.trim();

      return textContent;
    } else {
      // Div not found
      return '';
    }
  },
  
  initEditorEvents() {
    const editor = this.get('_editor');

    if (!editor) 
    {
      return;
    }
  
    editor.events.on('keyup', (event) => {
      this.handleEditorKeyup(event);
    });
  
    editor.events.on('keydown', (event) => {
      this.handleEditorKeydown(event);
    });
  
  },
  
  handleEditorKeyup(event) {
    // Ignore Tab key (handled separately)
    if (event.key === 'Tab') {
      return;
    }
  
    const content = this.getEditorContent();
  
    // Update userInput without suggestion
    const contentWithoutSuggestion = content.replace(new RegExp(`<span class="${styles.aiSuggestion}">.*?</span>`), '');
  
    this.set('userInput', contentWithoutSuggestion);
  
    // Trigger fetching a new suggestion
    Ember.run.next(this, () => {
      this.get('fetchAISuggestion').perform();
    });
  },
  
  handleEditorKeydown(event) {
    const editor = this.getFroalaElement().data('froala.editor');
    if (!editor) return;
  
    // Handle Tab key for accepting suggestion
    if (event.key === 'Tab' && this.get('aiSuggestion')) {
      event.preventDefault();
      this.acceptSuggestion();
      return false;
    } else if (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete') {
      // Remove existing suggestion on character input or deletion
      editor.$el.find(`span.${styles.aiSuggestion}`).remove();
      this.set('aiSuggestion', '');
    }
  },
  
  displayAISuggestion() {
    const editor = this.getFroalaElement().data('froala.editor');
    if (!editor) return;
  
    // Remove existing suggestion
    editor.$el.find(`span.${styles.aiSuggestion}`).remove();
  
    const aiSuggestion = this.get('aiSuggestion');
    if (!aiSuggestion) return;
  
    // Save the current selection (cursor position)
    editor.events.disableBlur();
    editor.selection.save();
  
    // Insert a zero-width space to prevent merging with preceding text
    editor.html.insert('\u200B', true); // Zero-width space inserted as plain text
  
    // Insert the suggestion at the cursor position
    const suggestionHtml = `<span class="${styles.aiSuggestion}">${aiSuggestion}</span>`;
    editor.html.insert(suggestionHtml, false); // Insert suggestion as HTML (false parameter)
  
    // Restore the selection to the position before the suggestion
    editor.selection.restore();
  
    // Get the suggestion element we just inserted
    const $suggestionSpan = editor.$el.find(`span.${styles.aiSuggestion}`).last();
  
    if ($suggestionSpan.length > 0) {
      // Create a new range before the suggestion
      const range = document.createRange();
      range.setStartBefore($suggestionSpan[0]);
      range.collapse(true);
  
      // Set the selection to the new range
      const sel = editor.selection.get();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  
    // Re-enable blur events
    editor.events.enableBlur();
  },
  
  acceptSuggestion() {
    const editor = this.getFroalaElement().data('froala.editor');
    if (!editor) return;
  
    const aiSuggestion = this.get('aiSuggestion');
    if (!aiSuggestion) return;
  
    // Cancel any pending fetchAISuggestion tasks
    this.get('fetchAISuggestion').cancelAll();
  
    // Save the current selection (cursor position)
    editor.events.disableBlur();
    editor.selection.save();
  
    // Remove the existing suggestion span
    editor.$el.find(`span.${styles.aiSuggestion}`).remove();
  
    // Restore the selection (cursor position should be before where the suggestion was)
    editor.selection.restore();
  
    // Save the editor state before insertion (for undo functionality)
    editor.undo.saveStep();
  
    // Insert the suggestion text at the cursor position, with a space after it
    editor.html.insert(`${aiSuggestion} `, true); // Insert as plain text with space
  
    // Save the editor state after insertion
    editor.undo.saveStep();
  
    // Clear the suggestion
    this.set('aiSuggestion', '');
  
    // Update the userInput to match the new content
    const content = editor.html.get();
    this.set('userInput', content);
  
    // Re-enable blur events
    editor.events.enableBlur();
  
    // The cursor should now be after the inserted text plus space
  },

  actions: {
    closeTicketSummaryModal() {
      if (!this.get('isAddingSummaryToCase')) {
        const caseId = this.get('case').id;
        this.get('metrics').trackEvent({
          event: 'AI Summary Popup Dismissed',
          caseId
        });
        this.set('generatedSummary', '');
      }
    },

    async generateTicketSummary() {
      const caseId = this.get('case').id;
      this.get('metrics').trackEvent({
        event: 'AI Summary Button Clicked',
        caseId
      });
      const store = this.get('store');
      const caseSummaryAdapter = store.adapterFor('case-ai-summary');
      this.set('isGeneratingSummary', true);
      try {
        const summary = await caseSummaryAdapter.generateSummary(caseId);
        this.set('generatedSummary', summary);
      } catch (error) {
        this.get('notificationService').error(this.get('i18n').t('generic.generic_error'));
      } finally {
        this.set('isGeneratingSummary', false);
      }
    },

    async addSummaryToCase() {
      const caseId = this.get('case').id;
      this.get('metrics').trackEvent({
        event: 'AI Summary Added to Case',
        caseId
      });
      const store = this.get('store');
      const caseSummaryAdapter = store.adapterFor('case-ai-summary');
      this.set('isAddingSummaryToCase', true);
      const generatedSummary = this.get('generatedSummary');
      try {
        await caseSummaryAdapter.addSummaryToCase(caseId, generatedSummary);
        await this.get('fetchNewerPosts').perform();
        this.set('generatedSummary', '');
      } catch (error) {
        this.get('notificationService').error(this.get('i18n').t('generic.generic_error'));
      } finally {
        this.set('isAddingSummaryToCase', false);
      }
    },

    updateUserInput(event) {
      this.set('userInput', event.target.value);
      this.get('fetchAISuggestion').perform();
    },

    toggleCopilot(newState) {
      // Here, newState is the boolean from ko-toggle
      this.set('isCopilotEnabled', newState);
      localStorage.setItem('isCopilotEnabled', newState);
    },

    setImageUploadStatus(status){
      this.get('imageUploadStatus')(status);
    },

    allowFormattingCommands(editor, cmd) {
      if (['bold', 'italic', 'underline'].indexOf(cmd) > -1) {
        return this.get('allowFormatting');
      } else {
        return true;
      }
    },

    allowToolbar() {
      return this.get('allowFormatting');
    },

    processPastedContentAfterFroalaClean(_editor, html) {
      if (this.get('atMentionSupport.target')) {
        return this.get('atMentionSupport.target').handlePaste(html);
      }
    },

    processPastedContent(editor, html) {
      // FT-1321 - In Firefox (and IE?) Froala triggers this twice on a paste event
      // the first time, `html` is an object (the event) and the HTML isn't available
      // the second time we get what we expect and all is good.
      if (typeof html !== 'string') {
        return null;
      }

      let postContent = processPastedContentCore(html, !this.get('allowFormatting'));
      const knownHtmlEntityEscapingGlitches = [
        ['¤', '&curren'],
        ['¶', '&para'],
      ];
      let htmlToReprocess = undefined;
      for (let i = 0; i < knownHtmlEntityEscapingGlitches.length; i++) {
        const [encoded, source] = knownHtmlEntityEscapingGlitches[i];
        if (postContent.indexOf(encoded) !== -1 && html.indexOf(source) !== -1) {
          if (!htmlToReprocess) htmlToReprocess = html;
          const regex = new RegExp(source + '(?=[^;]|$)', 'g');
          htmlToReprocess = htmlToReprocess.replaceAll(regex, '&amp;' + source.substr(1));
        }
      }
      if (htmlToReprocess) {
        postContent = processPastedContentCore(htmlToReprocess, !this.get('allowFormatting'));
      }

      return postContent;
    },

    openDropdown(dropdown, e) {
      e.preventDefault();

      try {
        this.get('_editor').selection.save();
      } catch (err) {
        // this catch is specific to avoid problem in safari with bug triggered in froala
      }
    },

    insertImage(url) {
      const editor = this.get('_editor');
      let sanitize = true;
      let data = '';
      let $existingImage = this._uploadingImagePlaceholder();
      let response = null;

      if ($existingImage) {
        editor.selection.restore();
        editor.image.insert(url, sanitize, data, $existingImage, response);
        editor.events.trigger('contentChanged');
      }
    },

    uploadImage(files) {
      this.set('isImageUploading', true);
      this.get('_editor').image.upload(files);

      // clear file value after uploading so it can be used again
      $('input[type=file][accept="image/*"]').val('');
    },

    triggerControl(type, e) {
      e.preventDefault();

      if (!_COMMANDS[type]) {
        return;
      }

      const $editor = this.getFroalaElement();
      const editor = this.get('_editor');

      if (type === 'outdent' && !this.get('isButtonOutdentDisabled')) {
        $editor.froalaEditor.apply($editor, _COMMANDS.outdent.command); // eslint-disable-line prefer-reflect,prefer-spread
      } else if (_COMMANDS[type].command && _COMMANDS[type].command.length) {
        $editor.froalaEditor.apply($editor, _COMMANDS[type].command); // eslint-disable-line prefer-reflect,prefer-spread
      } else if (type === 'quote.increase') {
        $editor.froalaEditor('quote.apply', 'increase');
        editor.selection.clear();
      } else if (type === 'quote.decrease') {
        $editor.froalaEditor('quote.apply', 'decrease');
      }

      $editor.froalaEditor('placeholder.refresh');

      this._refreshToolbarIcons();
    },

    initialized(editor) {
      this.set('_editor', editor._editor);
      this._setupFroalaEvents(editor._editor);
      this.initEditorEvents();
      if (this.get('autofocus')) {
        this.scheduleEditorFocus();
      }
    },

    setParagraph(code, dropdown, e) {
      const editor = this.get('_editor');

      editor.selection.restore();
      editor.paragraphFormat.apply(code); // eslint-disable-line prefer-reflect

      dropdown.actions.close();

      e.preventDefault();
    },

    addLink(dropdown, url, text, e) {
      const editor = this.get('_editor');

      if (!url) {
        return;
      }

      editor.selection.restore();
      editor.link.insert(url, text);

      const $editor = this.getFroalaElement();
      var editorHtmlContent = $editor.froalaEditor('html.get');
      var divArray = editorHtmlContent.split('</div>');
      var isFirstRowHaveLinks = divArray[0].search('<a');
      if (isFirstRowHaveLinks > -1) {
        $editor.froalaEditor('html.set','<div>&nbsp;</div>'+ editorHtmlContent);
      }
      dropdown.actions.close();
      e.preventDefault();

      editor.events.trigger('contentChanged');
    },

    closeLinkManager(dropdown, e) {
      dropdown.actions.close();
      e.preventDefault();
    }
  }
});

const processPastedContentCore = function (html, stripFormatting) {
  if (stripFormatting) {
    return stripFormattingFromHTML(html);
  } else {
    const el = document.createElement('div');
    el.innerHTML = html;
    $(el).find('.br-wrapper.br-wrapper--multiple').replaceWith('<br><br>');
    $(el).find('.br-wrapper.br-wrapper--single').replaceWith('<br>');
    return el.innerHTML;
  }
};
