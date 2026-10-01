import { app } from 'electron';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { ELECTRON_RENDERER_URL } from './constants';

export function resolveHtmlPath(htmlFileName: string) {
  if (!app.isPackaged && ELECTRON_RENDERER_URL) {
    return new URL(htmlFileName, `${ELECTRON_RENDERER_URL}/`).href;
  }
  return pathToFileURL(path.join(__dirname, '../renderer', htmlFileName)).href;
}
