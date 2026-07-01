// Shared logic for the offline translation pipeline: given a content item,
// return the ordered list of human-readable strings to translate plus setters
// that write translations back into a clone (index-aligned). prepare and apply
// MUST derive the same order, so both import this single function.

export function collect(item) {
  const segments = [];
  const setters = [];

  const pushField = (field) => {
    const value = item[field];
    if (typeof value === 'string' && value.trim()) {
      segments.push(value);
      setters.push((target, translated) => {
        target[field] = translated;
      });
    }
  };

  pushField('title');
  pushField('summary');
  pushField('excerpt');
  pushField('bodyHtml');

  for (const arrayKey of ['photos', 'images', 'attachments']) {
    const files = item[arrayKey];
    if (!Array.isArray(files)) continue;
    files.forEach((file, fileIndex) => {
      for (const field of ['alt', 'title']) {
        const value = file[field];
        if (typeof value === 'string' && value.trim()) {
          segments.push(value);
          setters.push((target, translated) => {
            target[arrayKey][fileIndex][field] = translated;
          });
        }
      }
    });
  }

  return { segments, setters };
}

export const COLLECTIONS = ['pages', 'articles', 'galleries'];

export function itemId(collection, index) {
  return `${collection}:${index}`;
}
