import { useState, useEffect, useRef } from 'react';
import type { ComponentProps } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import { useConfig } from '../../contexts/ConfigContext';
import './CommandPalette.css';

type SubItemProps = ComponentProps<typeof Command.Item> & { search: string };

const SubItem = ({ search, ...props }: SubItemProps) => {
  if (!search) return null;
  return <Command.Item {...props} />;
};

type Pages = 'theme' | 'other';

const CommandPalette = () => {
  const isMac = window.electron.platform === 'darwin';
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [pages, setPages] = useState<Pages[]>([]);
  const page = pages[pages.length - 1];

  const { updateConfig } = useConfig();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <div className="command-palette">
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger className="command-palette-trigger" asChild>
          <button>Open Command Palette {isMac ? '⌘' : '⌃'}&nbsp;K</button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="popover-content"
            align="start"
            side="bottom"
            sideOffset={0}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              inputRef.current?.focus();
            }}
            onEscapeKeyDown={(event) => {
              if (pages) {
                event.preventDefault();
                setPages((oldPages) => oldPages.slice(0, -1));
              }
            }}
          >
            <Command
              label="Command Palette"
              onKeyDown={(e) => {
                if (e.key === 'Escape' || (e.key === 'Backspace' && !search)) {
                  setPages((oldPages) => oldPages.slice(0, -1));
                }
              }}
            >
              <Command.Input
                ref={inputRef}
                placeholder="Type a command or search..."
                className="command-palette-trigger"
                value={search}
                onValueChange={setSearch}
              />

              <Command.List className="items">
                <Command.Empty>No results found.</Command.Empty>

                {!page && (
                  <Command.Group>
                    <>
                      <Command.Item
                        className="item"
                        onSelect={() => {
                          setSearch('');
                          setPages([...pages, 'theme']);
                        }}
                      >
                        Change theme
                      </Command.Item>
                      {['light', 'dark', 'system'].map((theme) => (
                        <SubItem
                          key={theme}
                          className="item"
                          search={search}
                          onSelect={() => {
                            setSearch('');
                            updateConfig('theme', theme);
                          }}
                        >
                          Change theme to {theme}
                        </SubItem>
                      ))}
                    </>
                    <Command.Item
                      className="item"
                      onSelect={window.electron.openConfigFile}
                    >
                      Open Configuration File
                    </Command.Item>
                  </Command.Group>
                )}

                {page === 'theme' && (
                  <>
                    {['light', 'dark', 'system'].map((theme) => (
                      <Command.Item
                        key={theme}
                        className="item"
                        onSelect={() => {
                          setSearch('');
                          updateConfig('theme', theme);
                        }}
                      >
                        Change theme to {theme}
                      </Command.Item>
                    ))}
                  </>
                )}
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

export default CommandPalette;
