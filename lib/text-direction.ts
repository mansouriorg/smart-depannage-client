/**
 * The `dir` of a box where the visitor types free words (a description, an address, a name) on a page that may run right to left (P3-04).
 *
 * Text typed in either language must run in its own direction ("12 rue de la République" typed in an Arabic page must not become
 * "rue de la République 12"), which `dir="auto"` does. But an EMPTY box with `dir="auto"` draws its placeholder left to right, even in
 * Arabic, so the attribute is only set once something is typed; before that the box follows the page.
 */
export function typedDir(value: string): 'auto' | undefined {
  return value.trim() === '' ? undefined : 'auto';
}
