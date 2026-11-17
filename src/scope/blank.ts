/** `s` with every character but a line break replaced by a space, so line and column numbers hold. */
export function blank(s: string): string {
  return s.replace(/[^\r\n]/g, ' ');
}
