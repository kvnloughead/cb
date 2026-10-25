import { Snippets } from '../../shared/config';
import { createStoreClient } from '../../shared/store-client';

describe('createStoreClient (config store)', () => {
  const invoke = jest.fn();
  const client = createStoreClient<{ theme: string }>({ invoke }, 'config');

  beforeEach(() => {
    invoke.mockReset();
  });

  it('maps get to the store get channel and forwards its default value', async () => {
    invoke.mockResolvedValue('dark');

    await expect(client.get('theme', 'light')).resolves.toBe('dark');
    expect(invoke).toHaveBeenCalledWith('config-store-get', 'theme', 'light');
  });

  it('maps set to the store set channel', async () => {
    invoke.mockResolvedValue(undefined);

    await expect(client.set('theme', 'dark')).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith('config-store-set', 'theme', 'dark');
  });

  it('maps has to the store has channel', async () => {
    invoke.mockResolvedValue(true);

    await expect(client.has('theme')).resolves.toBe(true);
    expect(invoke).toHaveBeenCalledWith('config-store-has', 'theme');
  });

  it('maps delete to the store delete channel', async () => {
    invoke.mockResolvedValue(undefined);

    await expect(client.delete('theme')).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith('config-store-delete', 'theme');
  });

  it('maps getAll to the store get-all channel', async () => {
    const config = { theme: 'dark' };
    invoke.mockResolvedValue(config);

    await expect(client.getAll()).resolves.toBe(config);
    expect(invoke).toHaveBeenCalledWith('config-store-get-all');
  });

  it('propagates IPC failures', async () => {
    const error = new Error('IPC unavailable');
    invoke.mockRejectedValue(error);

    await expect(client.getAll()).rejects.toBe(error);
  });
});

describe('createStoreClient (snippets store)', () => {
  const invoke = jest.fn();
  const client = createStoreClient<Snippets>({ invoke }, 'snippets');

  beforeEach(() => {
    invoke.mockReset();
  });

  it('maps get to the store get channel', async () => {
    invoke.mockResolvedValue('bar');

    await expect(client.get('foo')).resolves.toBe('bar');
    expect(invoke).toHaveBeenCalledWith('snippets-store-get', 'foo', undefined);
  });

  it('returns undefined if key is not found', async () => {
    invoke.mockResolvedValue(undefined);

    await expect(client.get('not-there')).resolves.toBe(undefined);
    expect(invoke).toHaveBeenCalledWith(
      'snippets-store-get',
      'not-there',
      undefined,
    );
  });

  it('maps set to the store set channel', async () => {
    invoke.mockResolvedValue(undefined);

    await expect(client.set('foo', 'bar')).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith('snippets-store-set', 'foo', 'bar');
  });

  it('maps has to the store has channel', async () => {
    invoke.mockResolvedValue(false);

    await expect(client.has('not-there')).resolves.toBe(false);
    expect(invoke).toHaveBeenCalledWith('snippets-store-has', 'not-there');
  });

  it('maps delete to the store delete channel', async () => {
    invoke.mockResolvedValue(undefined);

    await expect(client.delete('foo')).resolves.toBeUndefined();
    expect(invoke).toHaveBeenCalledWith('snippets-store-delete', 'foo');
  });

  it('maps getAll to the store get-all channel', async () => {
    const snippets = { foo: 'bar' };
    invoke.mockResolvedValue(snippets);

    await expect(client.getAll()).resolves.toBe(snippets);
    expect(invoke).toHaveBeenCalledWith('snippets-store-get-all');
  });

  it('propagates IPC failures', async () => {
    const error = new Error('IPC unavailable');
    invoke.mockRejectedValue(error);

    await expect(client.getAll()).rejects.toBe(error);
  });
});
