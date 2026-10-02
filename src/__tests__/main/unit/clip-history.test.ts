/** @jest-environment node */
const ClipHistoryDB = require('../../../main/database/clip-history').default;

type ClipRow = { id: number; content: string; createdAt: string };
type ClipHistory = {
  addClip: (text: string) => void;
  getAllClips: () => ClipRow[];
  getClipByPosition: (pos: number) => ClipRow;
  close: () => void;
};

describe('ClipHistoryDB', () => {
  it('getClipByPosition returns the correct clip', () => {
    const history: ClipHistory = new ClipHistoryDB(':memory:');

    try {
      history.addClip('first');
      history.addClip('second');
      const first = history.getClipByPosition(1);
      const second = history.getClipByPosition(2);

      expect(first.content).toEqual('first');
      expect(second.content).toEqual('second');
      for (const badPos of [-1, 0.1, NaN]) {
        expect(history.getClipByPosition(badPos)).toEqual(null);
      }
    } finally {
      history.close();
    }
  });

  it('does not change the database when adding the newest clip again', () => {
    const history: ClipHistory = new ClipHistoryDB(':memory:');

    try {
      history.addClip('first');
      history.addClip('second');
      const before = history.getAllClips();

      history.addClip('second');

      expect(history.getAllClips()).toEqual(before);
    } finally {
      history.close();
    }
  });

  it('works when the method is extracted and called as a callback', () => {
    const history: ClipHistory = new ClipHistoryDB(':memory:');
    const addClip = history.addClip;

    try {
      addClip('first');
      addClip('second');

      expect(history.getAllClips().map((clip) => clip.content)).toEqual([
        'second',
        'first',
      ]);
    } finally {
      history.close();
    }
  });

  it('moves an older duplicate to the newest position', () => {
    const history: ClipHistory = new ClipHistoryDB(':memory:');

    try {
      history.addClip('first');
      history.addClip('second');
      const originalFirstClip = history
        .getAllClips()
        .find((clip) => clip.content === 'first');
      if (!originalFirstClip) throw new Error('Expected first clip to exist');

      history.addClip('first');

      const clips = history.getAllClips();
      expect(clips.map((clip) => clip.content)).toEqual(['first', 'second']);
      const newestClip = clips[0];
      if (!newestClip) throw new Error('Expected newest clip to exist');
      expect(newestClip.id).toBeGreaterThan(originalFirstClip.id);
    } finally {
      history.close();
    }
  });

  it('caps the database at maxSize entries', () => {
    const history: ClipHistory = new ClipHistoryDB(':memory:', 2);

    try {
      history.addClip('first');
      history.addClip('second');
      const before = history.getAllClips();
      expect(before.map((clip) => clip.content)).toEqual(['second', 'first']);

      history.addClip('third');
      const after = history.getAllClips();
      expect(after.map((clip) => clip.content)).toEqual(['third', 'second']);
    } finally {
      history.close();
    }
  });
});
