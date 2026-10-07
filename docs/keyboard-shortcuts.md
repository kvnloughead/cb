# Keyboard Shortcuts

The renderer shortcut system is separate from Electron's main-process global shortcuts. Renderer shortcuts listen for `keydown` events while the app window is focused.

## Architecture

- [`config/defaultShortcuts.ts`](../src/renderer/config/defaultShortcuts.ts) defines shortcut IDs, their default key combinations, and the partial type used for overrides.
- [`contexts/ShortcutContext.tsx`](../src/renderer/contexts/ShortcutContext.tsx) installs one document-level listener in `ShortcutProvider`, merges overrides with defaults, and dispatches matching IDs to registered handlers.
- [`hooks/useShortcut.ts`](../src/renderer/hooks/useShortcut.ts) registers callbacks from a component and unregisters them when that component unmounts.
- [`App.tsx`](../src/renderer/App.tsx) mounts the provider once around the renderer app.

Keep callbacks close to the component that owns the relevant state. For example, `ClipHistoryList` owns the current page items and registers the clip-selection actions there.

## Default bindings

| Shortcut ID    | Default binding               | Current action                                |
| -------------- | ----------------------------- | --------------------------------------------- |
| `selectClip1`  | `CommandOrControl+1`          | Copy the first visible clip to the clipboard  |
| `selectClip2`  | `CommandOrControl+2`          | Copy the second visible clip to the clipboard |
| `...`          | `...`                         | ...                                           |
| `selectClip9`  | `CommandOrControl+9`          | Copy the ninth visible clip to the clipboard  |
| `previousPage` | `CommandOrControl+ArrowLeft`  | Go to previous page of clips                  |
| `nextPage`     | `CommandOrControl+ArrowRight` | Go to next page of clips                      |

`CommandOrControl` means Command on macOS and Control on other platforms. The current matcher recognizes `CommandOrControl`, `Command`/`Cmd`/`Meta`, `Control`/`Ctrl`, `Shift`, and `Alt`/`Option` modifier names, followed by a key name matching `KeyboardEvent.key` (for example, `1` or `ArrowLeft`). All modifiers must match exactly.

Shortcuts are ignored when the event target is an input, textarea, select, or content-editable element. The event's default behavior is prevented only when a registered callback handles the shortcut.

## Registering an action

Call `useShortcut` inside a component rendered beneath `ShortcutProvider`, and map shortcut IDs to callbacks:

```tsx
useShortcut({
  previousPage: () => setCurrentPage((page) => Math.max(1, page - 1)),
  nextPage: () => setCurrentPage((page) => Math.min(page + 1, totalPages)),
});
```

The hook reads the latest callback functions and cleans up its registration automatically. It throws if called outside the provider.

## Overriding bindings

Pass a partial ID-to-binding map to the provider. Unspecified IDs keep their defaults:

```tsx
<ShortcutProvider shortcuts={{ selectClip1: 'Alt+1' }}>
  {children}
</ShortcutProvider>
```

The provider accepts overrides, but the app does not currently load or persist shortcut preferences. Add persistence separately before describing these as saved user settings.
