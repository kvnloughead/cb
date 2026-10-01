/** @jest-environment node */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getAssetPath, resolveHtmlPath } from '../../../main/path';

jest.mock('electron', () => ({
  app: {
    isPackaged: false,
    getAppPath: jest.fn(() => '/workspace/cb'),
  },
}));

const { app } = require('electron');
const originalResourcesPath = Object.getOwnPropertyDescriptor(
  process,
  'resourcesPath',
);

afterEach(() => {
  app.isPackaged = false;
  jest.clearAllMocks();

  if (originalResourcesPath) {
    Object.defineProperty(process, 'resourcesPath', originalResourcesPath);
  } else {
    Reflect.deleteProperty(process, 'resourcesPath');
  }
});

describe('getAssetPath', () => {
  it('resolves assets from the app directory in development', () => {
    expect(getAssetPath('icons', 'clipboard.png')).toBe(
      path.join('/workspace/cb', 'assets', 'icons', 'clipboard.png'),
    );
  });

  it('resolves assets from Electron resources in a packaged app', () => {
    app.isPackaged = true;
    Object.defineProperty(process, 'resourcesPath', {
      configurable: true,
      value: '/packaged/resources',
    });

    expect(getAssetPath('icons', 'clipboard.png')).toBe(
      path.join('/packaged/resources', 'assets', 'icons', 'clipboard.png'),
    );
  });
});

describe('resolveHtmlPath', () => {
  it('resolves the bundled renderer HTML file', () => {
    app.isPackaged = true;

    expect(resolveHtmlPath('index.html')).toBe(
      pathToFileURL(path.resolve(process.cwd(), 'src/renderer/index.html'))
        .href,
    );
  });
});
