import { useState, useEffect, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Command } from 'cmdk';
import './CommandPalette.css';

const CommandPalette = () => {
  const isMac = window.electron.platform === 'darwin';
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
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
          >
            <Command label="Command Palette">
              <Command.Input
                ref={inputRef}
                placeholder="Type a command or search..."
                className="command-palette-trigger"
              />

              <Command.List className="items">
                <Command.Empty>No results found.</Command.Empty>

                <Command.Group>
                  <Command.Item
                    className="item"
                    onSelect={() => console.log('Profile clicked')}
                  >
                    Profile
                  </Command.Item>
                  <Command.Item
                    className="item"
                    onSelect={() => console.log('Settings clicked')}
                  >
                    Settings
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
};

export default CommandPalette;
