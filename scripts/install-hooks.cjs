const { spawnSync } = require('node:child_process');

if (process.env.CI) process.exit(0);

const repository = spawnSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
});

if (repository.status !== 0) process.exit(0);

const result = spawnSync(
  'git',
  ['config', '--local', 'core.hooksPath', '.githooks'],
  { cwd: repository.stdout.trim(), stdio: 'inherit' },
);

if (result.status !== 0) process.exit(result.status || 1);
