const DEFAULT_WPM = 200;

export function countWords(plain: string): number {
  return plain
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function minutesToRead(plain: string, wpm: number = DEFAULT_WPM): number {
  return Math.max(1, Math.round(countWords(plain) / wpm));
}
