const POLL_INTERVAL_MS = 500;

type TrackerDependencies = {
  readText: () => Promise<string>;
  addToHistory: (text: string) => void;
};

/**
 * Polls the clipboard and adds each new, non-empty value to history.
 * The initial read establishes a baseline; transient read errors are retried.
 *
 * @returns A promise resolving to a function that stops future polling.
 */
export async function startClipboardTracker({
  readText,
  addToHistory,
}: TrackerDependencies): Promise<() => void> {
  let timer: NodeJS.Timeout | null = null;
  let stopped = false;
  let lastText = '';

  try {
    lastText = await readText();
  } catch {
    // Keep polling so a transient clipboard read error does not stop tracking.
  }

  const poll = async () => {
    if (stopped) return;

    try {
      const text = await readText();
      if (text && text !== lastText) {
        lastText = text;
        addToHistory(text);
      }
    } catch {
      // Retry on the next poll after a transient clipboard read error.
    } finally {
      if (!stopped) {
        timer = setTimeout(() => void poll(), POLL_INTERVAL_MS);
      }
    }
  };

  timer = setTimeout(() => void poll(), POLL_INTERVAL_MS);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
