import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

import { ArchiveReader } from './ArchiveReader';
import { libarchiveWasm } from './libarchiveWasm';

function verifyArchiveEntries(a: ArchiveReader): void {
  const entries: Record<string, unknown>[] = [];
  for (;;) {
    const entryPointer = a.nextEntryPointer();
    if (entryPointer === 0) break;
    const pathname = a.getEntryPathname(entryPointer);
    const size = a.getEntrySize(entryPointer);
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    const data = pathname.includes('.md') ? a.readData(size) : (a.skipData() as undefined);
    entries.push({
      data: new TextDecoder().decode(data),
      encrypted: a.isEntryEncrypted(entryPointer),
      filetype: a.getEntryFiletype(entryPointer),
      pathname,
      size,
    });

    const atime = a.getEntryAccessTime(entryPointer);
    const btime = a.getEntryBirthTime(entryPointer);
    const ctime = a.getEntryCreationTime(entryPointer);
    const mtime = a.getEntryModificationTime(entryPointer);
    expect(atime).toBeGreaterThanOrEqual(0);
    expect(btime).toBe(0);
    expect(ctime).toBe(0);
    expect(mtime).toBeGreaterThan(new Date('2020-01-01').getTime());
  }
  expect(entries).toMatchSnapshot();
}

function testArchive(name: string, passphrase?: string): void {
  test(name, async () => {
    const data = await readFile(`./archives/${name}`);
    const mod = await libarchiveWasm();
    const a = new ArchiveReader(mod, new Int8Array(data), passphrase);
    expect(a.hasEncryptedData()).toBe(null);
    verifyArchiveEntries(a);
    expect(!!a.hasEncryptedData()).toBe(passphrase != null);
    a.free();
  });
}

describe('ArchiveReader', () => {
  testArchive('deflate.zip');
  testArchive('deflate-encrypted.zip', 'Passw0rd!');
  testArchive('store.zip');

  testArchive('a.tar');
  testArchive('a.tar.bz2');
  testArchive('a.tar.gz');
  testArchive('a.tar.xz');

  testArchive('bzip2.7z');
  testArchive('lzma.7z');
  testArchive('lzma2.7z');

  testArchive('v4.rar');
  testArchive('v4-encrypted.rar', 'Passw0rd!');
  testArchive('v5.rar');
});
