import { registerAsyncHelper } from '@ember/test';
import { EDITOR_SELECTOR } from 'frontend-cp/components/ko-text-editor/component';

export default registerAsyncHelper('fillInRichTextEditor', function(app, html) {
  fillInRichTextEditorSync(html);

  return wait();
});

export function fillInRichTextEditorSync(html) {
  let editor = find(EDITOR_SELECTOR);

  editor.froalaEditor('html.set', html);
  editor.froalaEditor('events.trigger', 'contentChanged');
}
