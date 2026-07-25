import styles from "./AccentText.module.css";

/**
 * Renders heading text with a small, deterministic (not truly random —
 * stable per string, so no hydration mismatch and no visual flicker on
 * re-render) portion highlighted in the accent color:
 *   - Multi-word text: ~10% of words (minimum 1) get accented.
 *   - Single-word text: 1-2 letters within that word get accented.
 *
 * Works in both Server and Client Components — it's a pure function of
 * its `text` prop, no hooks involved.
 */
export function AccentText({ text }: { text: string }) {
  const words = text.split(" ");

  if (words.length === 1) {
    const word = words[0];
    const letterCount = word.length > 4 ? 2 : 1;
    const maxStart = Math.max(1, word.length - letterCount);
    const start = hashString(word) % maxStart;

    return (
      <>
        {word.slice(0, start)}
        <span className={styles.accent}>{word.slice(start, start + letterCount)}</span>
        {word.slice(start + letterCount)}
      </>
    );
  }

  const accentCount = Math.max(1, Math.round(words.length * 0.1));
  const accentedIndices = pickIndices(text, words.length, accentCount);

  return (
    <>
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 ? " " : ""}
          {accentedIndices.has(i) ? <span className={styles.accent}>{word}</span> : word}
        </span>
      ))}
    </>
  );
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickIndices(seedText: string, wordCount: number, count: number): Set<number> {
  const indices = new Set<number>();
  let seed = hashString(seedText) || 1;

  while (indices.size < count && indices.size < wordCount) {
    // Simple LCG step — deterministic but well-scattered across indices.
    seed = (seed * 1103515245 + 12345) >>> 0;
    indices.add(seed % wordCount);
  }

  return indices;
}
