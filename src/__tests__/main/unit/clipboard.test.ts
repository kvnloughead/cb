/** @jest-environment node */
import { startClipboardTracker } from '../../../main/clipboard';

describe('startClipboardTracker', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('adds changed clipboard text to history', async () => {
    jest.useFakeTimers();
    const readText = jest
      .fn()
      .mockResolvedValueOnce('initial')
      .mockResolvedValueOnce('updated');
    const addToHistory = jest.fn();

    const stop = await startClipboardTracker({ readText, addToHistory });

    await jest.advanceTimersByTimeAsync(500);

    expect(readText).toHaveBeenCalledTimes(2);
    expect(addToHistory).toHaveBeenCalledWith('updated');

    stop();
  });

  it('stops scheduling polls after the stop function is called', async () => {
    jest.useFakeTimers();
    const readText = jest.fn().mockResolvedValue('unchanged');
    const addToHistory = jest.fn();

    const stop = await startClipboardTracker({ readText, addToHistory });
    await jest.advanceTimersByTimeAsync(500);

    expect(readText).toHaveBeenCalledTimes(2);

    stop();
    await jest.advanceTimersByTimeAsync(1000);

    expect(readText).toHaveBeenCalledTimes(2);
  });
});
