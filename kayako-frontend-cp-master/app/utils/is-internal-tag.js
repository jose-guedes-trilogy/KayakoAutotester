export default function isInternalTag(tag) {
  if (!tag || typeof tag.name !== 'string') {
    return false;
  }
  
  const atlasTags = [
    'atlas-attemp',
    'atlas-attempt',
    'atlas-closed',
    'atlas-complete',
    'atlas-completfleet',
    'atlas-low-confidence',
    'atlas-missing-category',
    'atlas-moreinfo',
    'atlas-skipped',
    'atlas-ticket-triaged'
  ];

  return tag.name.startsWith('.atlasai-') ||
         atlasTags.includes(tag.name);
}
