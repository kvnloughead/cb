import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  DEFAULT_SHORTCUTS,
  type ShortcutId,
  type UserSettingsShortcuts,
} from '../config/defaultShortcuts';

type ShortcutHandler = (shortcutId: ShortcutId) => boolean;

type ShortcutContextValue = {
  registerHandler: (handler: ShortcutHandler) => () => void;
};

const ShortcutContext = createContext<ShortcutContextValue | null>(null);
const EMPTY_SHORTCUTS: UserSettingsShortcuts = {};

export function matchesShortcut(
  event: KeyboardEvent,
  keyCombo: string,
  platform: string,
) {
  const parts = keyCombo.toLowerCase().split('+');
  const key = parts.pop();
  if (!key || event.key.toLowerCase() !== key) return false;

  const commandOrControl = parts.includes('commandorcontrol');
  const control = parts.includes('control') || parts.includes('ctrl');
  const command =
    parts.includes('command') ||
    parts.includes('cmd') ||
    parts.includes('meta');
  const shift = parts.includes('shift');
  const alt = parts.includes('alt') || parts.includes('option');
  const usesControl = control || (commandOrControl && platform !== 'darwin');
  const usesCommand = command || (commandOrControl && platform === 'darwin');

  return (
    event.ctrlKey === usesControl &&
    event.metaKey === usesCommand &&
    event.shiftKey === shift &&
    event.altKey === alt
  );
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.closest('input, textarea, select, [contenteditable="true"]') !== null
  );
}

type ShortcutProviderProps = {
  children: ReactNode;
  shortcuts?: UserSettingsShortcuts;
};

export function ShortcutProvider({
  children,
  shortcuts = EMPTY_SHORTCUTS,
}: ShortcutProviderProps) {
  const handlers = useRef(new Set<ShortcutHandler>());
  const registerHandler = useCallback((handler: ShortcutHandler) => {
    handlers.current.add(handler);
    return () => {
      handlers.current.delete(handler);
    };
  }, []);
  const contextValue = useMemo(() => ({ registerHandler }), [registerHandler]);

  useEffect(() => {
    const resolvedShortcuts = { ...DEFAULT_SHORTCUTS, ...shortcuts };

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      let handled = false;
      for (const [shortcutId, keyCombo] of Object.entries(resolvedShortcuts)) {
        if (!matchesShortcut(event, keyCombo, window.electron.platform))
          continue;

        for (const handler of handlers.current) {
          if (handler(shortcutId as ShortcutId)) handled = true;
        }
      }

      if (handled) event.preventDefault();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  return (
    <ShortcutContext.Provider value={contextValue}>
      {children}
    </ShortcutContext.Provider>
  );
}

export default ShortcutContext;
