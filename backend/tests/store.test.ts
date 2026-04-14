import fs from 'fs';
import { readDb } from '../src/store';

// No import from ./setup — the store mock must NOT be active here
// so we test the real readDb() function.

afterEach(() => {
  jest.restoreAllMocks();
});

describe('readDb', () => {
  it('returns empty state when the db file does not exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(false);

    const db = readDb();
    expect(db).toEqual({ users: [], transactions: [] });
  });

  it('throws a clear error when the db file contains invalid JSON', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    (jest.spyOn(fs, 'readFileSync') as jest.SpyInstance).mockReturnValueOnce('{ this is not valid json');

    expect(() => readDb()).toThrow('Database file is corrupted');
  });

  it('parses and returns valid db content', () => {
    const mockDb = { users: [], transactions: [] };
    jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
    (jest.spyOn(fs, 'readFileSync') as jest.SpyInstance).mockReturnValueOnce(JSON.stringify(mockDb));

    expect(readDb()).toEqual(mockDb);
  });
});
