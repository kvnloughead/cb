export type ShortcutId =
  | 'selectClip1'
  | 'selectClip2'
  | 'selectClip3'
  | 'selectClip4'
  | 'selectClip5'
  | 'selectClip6'
  | 'selectClip7'
  | 'selectClip8'
  | 'selectClip9'
  | 'previousPage'
  | 'nextPage';
export type UserSettingsShortcuts = Partial<Record<ShortcutId, string>>;

export const DEFAULT_SHORTCUTS: Record<ShortcutId, string> = {
  selectClip1: 'CommandOrControl+1',
  selectClip2: 'CommandOrControl+2',
  selectClip3: 'CommandOrControl+3',
  selectClip4: 'CommandOrControl+4',
  selectClip5: 'CommandOrControl+5',
  selectClip6: 'CommandOrControl+6',
  selectClip7: 'CommandOrControl+7',
  selectClip8: 'CommandOrControl+8',
  selectClip9: 'CommandOrControl+9',
  previousPage: 'CommandOrControl+ArrowLeft',
  nextPage: 'CommandOrControl+ArrowRight',
};
