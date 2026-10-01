/** @jest-environment node */
import type { MenuItemConstructorOptions } from 'electron';
import { createTray, type CreateTrayOptions } from '../../../main/tray';

const mockTrayInstance = {
  setToolTip: jest.fn(),
  setContextMenu: jest.fn(),
  destroy: jest.fn(),
};

const MockTray = jest.fn(() => mockTrayInstance);
const mockMenu = {
  buildFromTemplate: jest.fn((template: MenuItemConstructorOptions[]) => ({
    template,
  })),
};

describe('createTray', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createTestTray = (
    platform: string,
    onShow = jest.fn(),
    onQuit = jest.fn(),
  ) => {
    const getAssetPath = jest.fn(
      (...paths: string[]) => `/workspace/cb/${paths.join('/')}`,
    );

    const tray = createTray({
      Tray: MockTray as unknown as CreateTrayOptions['Tray'],
      Menu: mockMenu as unknown as CreateTrayOptions['Menu'],
      getAssetPath,
      platform,
      onShow,
      onQuit,
    });

    return { tray, getAssetPath, onShow, onQuit };
  };

  it.each([
    ['darwin', ['icons', 'macos', 'clipboardTemplate.png']],
    ['win32', ['icons', '16x16.png']],
  ])('constructs the tray with the %s icon', (platform, iconParts) => {
    const { tray, getAssetPath } = createTestTray(platform);

    expect(getAssetPath).toHaveBeenCalledWith(...iconParts);
    expect(MockTray).toHaveBeenCalledWith(
      `/workspace/cb/${iconParts.join('/')}`,
    );
    expect(tray).toBe(mockTrayInstance);
    expect(mockTrayInstance.setToolTip).toHaveBeenCalledWith('CB');
    expect(mockTrayInstance.setContextMenu).toHaveBeenCalledTimes(1);
    expect(mockMenu.buildFromTemplate).toHaveBeenCalledWith([
      expect.objectContaining({ label: 'Show', click: expect.any(Function) }),
      expect.objectContaining({ label: 'Quit', click: expect.any(Function) }),
    ]);
  });

  it('connects menu actions to the injected callbacks', () => {
    const onShow = jest.fn();
    const onQuit = jest.fn();

    createTestTray('darwin', onShow, onQuit);

    const menuItems = mockMenu.buildFromTemplate.mock.calls[0][0];
    menuItems.find((item) => item.label === 'Show')?.click?.();
    menuItems.find((item) => item.label === 'Quit')?.click?.();

    expect(onShow).toHaveBeenCalledTimes(1);
    expect(onQuit).toHaveBeenCalledTimes(1);
  });
});
