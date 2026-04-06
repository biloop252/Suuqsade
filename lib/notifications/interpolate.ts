/** Replace {placeholders} in template strings using metadata values. */
export function interpolateTemplate(
  template: string,
  metadata?: Record<string, unknown>
): string {
  if (!metadata) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = metadata[key];
    if (v === undefined || v === null) return `{${key}}`;
    return String(v);
  });
}
