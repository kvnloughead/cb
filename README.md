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

## Setup

In the cloned repository, install node modules in three locations, in this order:

```bash
npm --prefix .erb/tooling install
npm install
npm --prefix release/app install
```

## Installing new packages

Runtime dependencies belong in `release/app/package.json`, and the rest go in the root.

## Development and builds

- `npm run dev`: build preload/preload, start Vite, and reload on source changes.
- `npm run debug`: run in debug mode
- `npm run build`: produce main, preload, and renderer bundles in `release/app/dist`.
- `npm run preview`: build and launch the production bundles locally.
- `npm run package`: build installers with electron-builder.
- `npm run test:smoke`: verify development startup and preload IPC.
- `npm run test:packaged`: build and launch the unpacked packaged app, verify IPC and keyboard shortcuts, then restart it to verify clipboard history persistence. Run this under `xvfb-run` on Linux.

## Keyboard shortcuts

Renderer shortcut defaults, registration, and extension guidance are documented in [docs/keyboard-shortcuts.md](docs/keyboard-shortcuts.md).
