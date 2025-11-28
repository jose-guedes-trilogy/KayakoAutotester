import ClipboardAction from 'npm:clipboard/lib/clipboard-action';

export default function (text) {
  const emitter = { emit() {} };
  const container = document.body;
  const action = new ClipboardAction({ text, emitter, container });
  action.destroy();
}
