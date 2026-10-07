const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const root = path.resolve(__dirname, '..');
const windows = process.platform === 'win32';
const linux = process.platform === 'linux';
const profileRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), 'cb-packaged-smoke-'),
);
const userDataPath = path.join(profileRoot, 'user-data');
fs.mkdirSync(userDataPath);

/** Finds the unpacked executable produced for the current host platform. */
function findExecutable() {
  const candidates =
    process.platform === 'darwin'
      ? [
          `mac-${process.arch}/CB.app/Contents/MacOS/CB`,
          'mac-arm64/CB.app/Contents/MacOS/CB',
          'mac/CB.app/Contents/MacOS/CB',
          'mac-universal/CB.app/Contents/MacOS/CB',
        ]
      : process.platform === 'win32'
        ? ['win-unpacked/CB.exe']
        : ['linux-unpacked/cb', 'linux-unpacked/CB'];

  const executable = candidates
    .map((candidate) => path.join(root, 'release/build', candidate))
    .find((candidate) => fs.existsSync(candidate));

  if (!executable) {
    throw new Error(
      `Packaged app executable not found. Checked:\n${candidates
        .map((candidate) => path.join(root, 'release/build', candidate))
        .join('\n')}`,
    );
  }

  return executable;
}

/** Reserves an available localhost port for Electron's DevTools endpoint. */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

/** Launches the packaged app with an isolated profile and remote debugging. */
function launchApp(executable, debugPort) {
  const args = [
    `--remote-debugging-port=${debugPort}`,
    '--remote-debugging-address=127.0.0.1',
  ];
  if (linux) args.push('--no-sandbox');

  const child = spawn(executable, args, {
    cwd: root,
    detached: !windows,
    env: {
      ...process.env,
      CB_TEST_USER_DATA: userDataPath,
      CB_DISABLE_AUTO_UPDATES: 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.output = '';
  child.stdout.on('data', (data) => {
    child.output += data;
  });
  child.stderr.on('data', (data) => {
    child.output += data;
  });
  child.on('error', (error) => {
    child.output += error.stack;
  });
  return child;
}

/** Stops the app process and its Electron helper processes. */
async function stopApp(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  if (windows) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }

    const exited = await Promise.race([
      once(child, 'exit').then(() => true),
      delay(1500).then(() => false),
    ]);
    if (!exited) {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch (error) {
        if (error.code !== 'ESRCH') throw error;
      }
    }
  }
}

/** Polls an asynchronous condition until it succeeds, the app exits, or time runs out. */
async function waitFor(check, description, child, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(
        `Packaged app exited before ${description}.\n${child.output}`,
      );
    }
    try {
      const value = await check();
      if (value) return value;
    } catch {
      // The app may still be starting or the renderer may not be ready yet.
    }
    await delay(200);
  }
  throw new Error(`Timed out waiting for ${description}.\n${child.output}`);
}

/** Connects to the packaged renderer and exposes a small CDP client. */
async function connectToRenderer(debugPort, child) {
  const target = await waitFor(
    async () => {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      if (!response.ok) return null;
      const targets = await response.json();
      return targets.find((entry) => entry.type === 'page');
    },
    'packaged renderer',
    child,
  );

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let requestId = 0;
  const requests = new Map();
  const exceptions = [];
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(
        message.params.exceptionDetails?.text || 'Renderer exception',
      );
    }
    const resolveRequest = requests.get(message.id);
    if (resolveRequest) {
      requests.delete(message.id);
      if (message.error) {
        resolveRequest.reject(new Error(JSON.stringify(message.error)));
      } else {
        resolveRequest.resolve(message.result);
      }
    }
  });

  /** Sends a Chrome DevTools Protocol command and resolves its response. */
  function send(method, params = {}) {
    requestId += 1;
    const id = requestId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        requests.delete(id);
        reject(new Error(`Timed out waiting for DevTools method ${method}`));
      }, 10_000);
      requests.set(id, {
        resolve: (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  /** Evaluates an expression in the renderer and returns its serialized value. */
  async function evaluate(expression) {
    const response = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) {
      throw new Error(response.exceptionDetails.text);
    }
    return response.result.value;
  }

  await send('Runtime.enable');
  await waitFor(
    () =>
      evaluate('typeof window.electron?.ipcRenderer?.invoke === "function"'),
    'packaged preload bridge',
    child,
  );

  return { evaluate, exceptions, send, socket };
}

/** Reads clipboard history through the renderer's exposed IPC bridge. */
async function readHistory(client) {
  return client.evaluate(
    'window.electron.ipcRenderer.invoke("load-clip-history")',
  );
}

/** Waits for the clipboard poller to persist a particular value. */
async function waitForClip(client, child, content) {
  return waitFor(
    async () => {
      const history = await readHistory(client);
      return history.some((clip) => clip.content === content) ? history : null;
    },
    `clip ${JSON.stringify(content)} to be stored`,
    child,
  );
}

/** Sends a platform-correct CommandOrControl+number key event through CDP. */
async function dispatchShortcut(client, number) {
  const modifiers = process.platform === 'darwin' ? 4 : 2;
  const key = String(number);
  const keyCode = 48 + number;
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    modifiers,
    key,
    code: `Digit${key}`,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  });
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    modifiers,
    key,
    code: `Digit${key}`,
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  });
}

/** Builds, exercises, and restarts the packaged app against one temporary profile. */
async function main() {
  const executable = findExecutable();
  const debugPort = await getFreePort();
  const firstClip = `packaged-smoke-older-${process.pid}`;
  const secondClip = `packaged-smoke-newer-${process.pid}`;
  let child;
  let client;

  try {
    child = launchApp(executable, debugPort);
    client = await connectToRenderer(debugPort, child);

    assert.equal(
      await client.evaluate(
        'window.electron.ipcRenderer.invoke("health-check")',
      ),
      'ok',
    );
    await waitFor(
      () =>
        client.evaluate(
          'Boolean(document.querySelector(".clip-history-list"))',
        ),
      'clipboard history view',
      child,
    );

    for (const content of [firstClip, secondClip]) {
      await client.evaluate(
        `window.electron.ipcRenderer.sendMessage("add-to-clipboard", ${JSON.stringify(content)}); true`,
      );
      await waitForClip(client, child, content);
    }

    let history = await readHistory(client);
    assert.deepEqual(
      history.slice(0, 2).map((clip) => clip.content),
      [secondClip, firstClip],
      'new clipboard contents should be stored newest-first',
    );

    await dispatchShortcut(client, 2);
    await waitFor(
      async () => {
        const currentHistory = await readHistory(client);
        return currentHistory[0]?.content === firstClip ? currentHistory : null;
      },
      'numbered shortcut to select the second clip',
      child,
    );

    assert.deepEqual(
      client.exceptions,
      [],
      'renderer should not throw during packaged use',
    );
    client.socket.close();
    client = null;
    await stopApp(child);
    child = null;

    const restartedPort = await getFreePort();
    child = launchApp(executable, restartedPort);
    client = await connectToRenderer(restartedPort, child);
    history = await waitFor(
      async () => {
        const currentHistory = await readHistory(client);
        return currentHistory.length >= 2 ? currentHistory : null;
      },
      'clipboard history to persist after relaunch',
      child,
    );

    assert.deepEqual(
      history.slice(0, 2).map((clip) => clip.content),
      [firstClip, secondClip],
      'history order should survive a packaged-app restart',
    );
    assert.deepEqual(
      client.exceptions,
      [],
      'restarted renderer should not throw',
    );
    console.log(
      'Packaged app smoke test passed: IPC, shortcuts, and history persistence.',
    );
  } finally {
    client?.socket.close();
    await stopApp(child);
    fs.rmSync(profileRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
