/** Values must match Mongo `AdditionalCategory` / `CustomizationSection` document **names**, not model names. */
const MONGO_NAME_JUNK = new Set([
  'additionalcategory',
  'customizationsection',
  'thirdcategory',
  'subcategory',
  'maincategory',
  'addon',
]);

export function sanitizeMongoNamedRef(raw: string): string | null {
  const s = raw
    .replace(/^\(([^)]+)\)$/g, '$1')
    .trim()
    .replace(/\s+/g, ' ');
  if (!s || MONGO_NAME_JUNK.has(s.toLowerCase())) return null;
  return s;
}

export function parseMongoNamedRefs(raw: string): string[] {
  return raw
    .split(/[,\n]+/)
    .map((s) => sanitizeMongoNamedRef(s))
    .filter((s): s is string => s != null);
}
