# CB (Cross-platform Clipboard Manager)

A clipboard manager supporting key/value pair storage.

<br>

<div align="center">

[![Build Status][github-actions-status]][github-actions-url]
[![Github Tag][github-tag-image]][github-tag-url]

</div>

## Stack

Built with [electron-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate).

## License

MIT © [Kevin Loughead](https://github.com/kvnloughead)

[github-actions-status]: https://github.com/kvnloughead/cb/workflows/Test/badge.svg
[github-actions-url]: https://github.com/kvnloughead/cb/actions
[github-tag-image]: https://img.shields.io/github/tag/kvnloughead/cb.svg?label=version
[github-tag-url]: https://github.com/kvnloughead/cb/releases/latest

## Development and builds

- `npm start`: build main/preload, start Vite, and reload on source changes.
- `npm run build`: produce main, preload, and renderer bundles in `release/app/dist`.
- `npm run preview`: build and launch the production bundles locally.
- `npm run package`: build installers with electron-builder.
- `npm run test:smoke`: verify development startup and preload IPC.

Build settings live in `electron.vite.config.ts`; development no longer needs a
DLL build or separate webpack watchers. Use `PORT` to select the renderer port,
or `npm start -- --inspect 5858 --remoteDebuggingPort 9223` for debugging.

SVG imports return asset URLs. For React components, use
`import Icon from './icon.svg?react'`. CSS modules and Sass are handled by Vite.

Native dependencies still belong in `release/app/package.json`. They remain
external to the main/preload bundles and are rebuilt and packaged by
electron-builder. Other application dependencies are bundled. The build uses
Vite 7, which is supported by electron-vite 5's current peer dependency range.
