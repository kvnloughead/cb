import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';

type Row = {
  id: number;
  content: string;
  createdAt: string;
};

/**
 * Stores clipboard history in SQLite and keeps only the most recent unique
 * entries.
 *
 * Each clip value is unique in the table, and the database enforces a maximum
 * row limit. If a clip already exists and is older than the newest copy, the
 * older row is moved back to the newest position so the most recent duplicate
 * remains first.
 */
export default class ClipHistoryDB {
  DB: DatabaseType;
  private _maxSize: number;
  private _insertClipAndTrim: (text: string) => Clip | null;

  /**
   * Creates a clipboard history database at the given SQLite path.
   *
   * @param dbPath SQLite database path, such as a file path or ':memory:' for an in-memory database.
   * @param maxSize Maximum number of clips to retain before trimming the oldest entries.
   * @throws {Error} If maxSize is not a positive integer.
   */
  constructor(dbPath: string, maxSize = 10_000) {
    if (!this._isPositiveInteger(maxSize)) {
      throw new Error('maxSize must be a positive integer');
    }
    this.DB = new Database(dbPath);
    this._maxSize = maxSize;
    this._insertClipAndTrim = () => null;
    this._init();
  }

  _init = () => {
    this.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS clipboard_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
      `,
    ).run();

    const getLatest = this.DB.prepare<[], Row>(
      `SELECT * FROM clipboard_history ORDER BY id DESC LIMIT 1`,
    );
    const deleteDuplicate = this.DB.prepare<[string]>(
      'DELETE FROM clipboard_history WHERE content = ?',
    );
    const insert = this.DB.prepare<[string]>(
      `
      INSERT INTO clipboard_history (content) VALUES (?)
      RETURNING *;
      `,
    );

    const trim = this.DB.prepare<[number]>(
      `
      DELETE FROM clipboard_history
      WHERE id NOT IN (
        SELECT id
        FROM clipboard_history
        ORDER BY id DESC
        LIMIT ?
      )
      `,
    );

    this._insertClipAndTrim = this.DB.transaction(
      (text: string): Clip | null => {
        if (getLatest.get()?.content === text) return null;

        deleteDuplicate.run(text);
        const newClip = insert.get(text) as Clip;
        trim.run(this._maxSize);

        return newClip;
      },
    );
  };

  /**
   * Closes the underlying SQLite connection.
   */
  close() {
    this.DB.close();
  }

  /**
   * Fetches a clip by its 1-based position from the oldest entry.
   *
   * @param pos Position in the history, where 1 is the oldest row.
   * @returns The matching clip row or null if the position is invalid.
   */
  getClipByPosition(pos: number) {
    if (!this._isPositiveInteger(pos)) return null;
    const offset = pos - 1;

    return (
      this.DB.prepare<[number], Row>(
        `
        SELECT * FROM clipboard_history 
        ORDER BY id ASC 
        LIMIT 1 OFFSET ?
        `,
      ).get(offset) || null
    );
  }

  /**
   * Adds a clipboard entry while preserving recency for duplicates.
   *
   * Empty or whitespace-only strings are ignored. If the same text already
   * exists, the newest copy is kept at the front and older duplicates are
   * bumped forward.
   *
   * @param text Clipboard text to store.
   */
  addClip = (text: string): Clip | null => {
    if (!text.trim()) return null;
    return this._insertClipAndTrim(text);
  };

  /**
   * Fetches the full history in newest-first order.
   *
   * @returns All clip rows sorted by most recent first.
   */
  getAllClips() {
    return this.DB.prepare<[], Row>(
      'SELECT * FROM clipboard_history ORDER BY id DESC',
    ).all();
  }

  _isPositiveInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value > 0;
  }
}
