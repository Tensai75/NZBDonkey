import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

import { ArchiveReader } from './ArchiveReader';
import { libarchiveWasm } from './libarchiveWasm';

function verifyArchiveEntries(a: ArchiveReader): void {
  const entries: Record<string, unknown>[] = [];
  a.forEach((entry) => {
    const pathname = entry.getPathname();
    const size = entry.getSize();
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    const data = pathname.includes('.md') ? entry.readData() : (entry.skipData() as undefined);
    entries.push({
      data: new TextDecoder().decode(data),
      encrypted: entry.isEncrypted(),
      filetype: entry.getFiletype(),
      pathname,
      size,
    });

    const atime = entry.getAccessTime();
    const btime = entry.getBirthTime();
    const ctime = entry.getCreationTime();
    const mtime = entry.getModificationTime();
    expect(atime).toBeGreaterThanOrEqual(0);
    expect(btime).toBe(0);
    expect(ctime).toBe(0);
    expect(mtime).toBeGreaterThan(new Date('2020-01-01').getTime());
  });
  expect(entries).toMatchSnapshot();
}

describe('ArchiveReaderEntry', () => {
  test('verification all methods', async () => {
    const data = await readFile('./archives/deflate.zip');
    const mod = await libarchiveWasm();
    const a = new ArchiveReader(mod, new Int8Array(data));
    verifyArchiveEntries(a);
    a.free();
  });
});
