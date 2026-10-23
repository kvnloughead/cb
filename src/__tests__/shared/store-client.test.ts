import { createStoreClient } from '../../shared/store-client';

describe('createStoreClient', () => {
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
