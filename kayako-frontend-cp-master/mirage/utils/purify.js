export default function purify(string) {
  return string.replace(/<span class="fr-marker" data-id="0" data-type="(true|false)" style="display: none; line-height: 0;"><\/span>/g, '');
}
