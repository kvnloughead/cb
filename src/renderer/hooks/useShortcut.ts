import { useContext, useEffect, useRef } from 'react';
import ShortcutContext from '../contexts/ShortcutContext';
import type { ShortcutId } from '../config/defaultShortcuts';

type ShortcutCallbacks = Partial<Record<ShortcutId, () => void>>;

export default function useShortcut(callbacks: ShortcutCallbacks) {
  const context = useContext(ShortcutContext);
  const callbacksRef = useRef(callbacks);

  if (!context) {
    throw new Error('useShortcut must be used within a ShortcutProvider');
  }
  const { registerHandler } = context;

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(
    () =>
      registerHandler((shortcutId) => {
        const callback = callbacksRef.current[shortcutId];
        if (!callback) return false;
        callback();
        return true;
      }),
    [registerHandler],
  );
}
