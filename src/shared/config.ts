import type { Schema } from 'electron-store';

export type Theme = 'light' | 'dark' | 'system';

export interface ConfigOptions {
  maxHistory: number;
  theme: Theme;
  windowSize: {
    width: number;
    height: number;
  };
}

export const configDefaults: ConfigOptions = {
  maxHistory: 10_000,
  theme: 'system',
  windowSize: {
    width: 600,
    height: 800,
  },
};

export const ConfigOptionsSchema: Schema<ConfigOptions> = {
  maxHistory: {
    type: 'number',
    default: configDefaults.maxHistory,
  },
  theme: {
    type: 'string',
    enum: ['light', 'dark', 'system'],
    default: configDefaults.theme,
  },
  windowSize: {
    type: 'object',
    properties: {
      width: { type: 'number' },
      height: { type: 'number' },
    },
    required: ['width', 'height'],
    default: configDefaults.windowSize,
  },
};
