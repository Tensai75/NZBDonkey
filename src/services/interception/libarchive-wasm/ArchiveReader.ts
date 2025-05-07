import type { LibarchiveWasm } from './libarchiveWasm';

import { ArchiveReaderEntry } from './ArchiveReaderEntry';

function toTimeFromTimeT(timeT: number): number {
  return timeT * 1000;
}

export class ArchiveReader {
  libarchive: LibarchiveWasm;

  archive: number;

  pointer: number;

  /* eslint-disable perfectionist/sort-objects, @typescript-eslint/no-unnecessary-template-expression, @typescript-eslint/restrict-template-expressions */
  static FileTypes = {
    [`${0o170000}`]: 'Mount',
    [`${0o100000}`]: 'File',
    [`${0o120000}`]: 'SymbolicLink',
    [`${0o140000}`]: 'Socket',
    [`${0o020000}`]: 'CharacterDevice',
    [`${0o060000}`]: 'BlockDevice',
    [`${0o040000}`]: 'Directory',
    [`${0o010000}`]: 'NamedPipe',
  };
  /* eslint-enable perfectionist/sort-objects, @typescript-eslint/no-unnecessary-template-expression, @typescript-eslint/restrict-template-expressions */

  constructor(libarchive: LibarchiveWasm, data: Int8Array, passphrase?: string) {
    const ptr = libarchive.module._malloc(data.length);
    libarchive.module.HEAP8.set(data, ptr);

    this.libarchive = libarchive;
    this.archive = libarchive.read_new_memory(ptr, data.length, passphrase);
    this.pointer = ptr;
  }

  free(): void {
    this.libarchive.read_free(this.archive);
    this.libarchive.module._free(this.pointer);

    this.libarchive = null as unknown as LibarchiveWasm;
    this.archive = null as unknown as number;
    this.pointer = null as unknown as number;
  }

  hasEncryptedData(): boolean | null {
    const code = this.libarchive.read_has_encrypted_entries(this.archive);
    return code < 0 ? null : !!code;
  }

  readData(size: number): Int8Array {
    const eptr = this.libarchive.module._malloc(size);
    const esize = this.libarchive.read_data(this.archive, eptr, size);
    const data = this.libarchive.module.HEAP8.slice(eptr, eptr + esize);
    this.libarchive.module._free(eptr);
    return data;
  }

  skipData(): void {
    this.libarchive.read_data_skip(this.archive);
  }

  nextEntryPointer(): number {
    return this.libarchive.read_next_entry(this.archive);
  }

  getEntryFiletype(ptr: number): string {
    const fileType = String(this.libarchive.entry_filetype(ptr));
    return fileType in ArchiveReader.FileTypes
      ? ArchiveReader.FileTypes[fileType as keyof typeof ArchiveReader.FileTypes]
      : 'Invalid';
  }

  getEntryPathname(ptr: number): string {
    return this.libarchive.entry_pathname(ptr);
  }

  getEntrySize(ptr: number): number {
    return this.libarchive.entry_size(ptr);
  }

  getEntryAccessTime(ptr: number): number {
    return toTimeFromTimeT(this.libarchive.entry_atime(ptr));
  }

  getEntryBirthTime(ptr: number): number {
    return toTimeFromTimeT(this.libarchive.entry_birthtime(ptr));
  }

  getEntryCreationTime(ptr: number): number {
    return toTimeFromTimeT(this.libarchive.entry_ctime(ptr));
  }

  getEntryModificationTime(ptr: number): number {
    return toTimeFromTimeT(this.libarchive.entry_mtime(ptr));
  }

  isEntryEncrypted(ptr: number): boolean {
    return !!this.libarchive.entry_is_encrypted(ptr);
  }

  getSymlinkTarget(ptr: number): string {
    return this.libarchive.entry_symlink(ptr);
  }

  getHardlinkTarget(ptr: number): string {
    return this.libarchive.entry_hardlink(ptr);
  }

  nextEntry(): ArchiveReaderEntry | null {
    const entryPtr = this.nextEntryPointer();
    if (entryPtr === 0) return null;
    return new ArchiveReaderEntry(this, entryPtr);
  }

  forEach(fn: (entry: ArchiveReaderEntry) => unknown): void {
    for (;;) {
      const entry = this.nextEntry();
      if (!entry) break;
      fn(entry);
      entry.free();
    }
  }

  *entries(): Generator<ArchiveReaderEntry, void, unknown> {
    for (;;) {
      const entry = this.nextEntry();
      if (!entry) break;
      yield entry;
      entry.free();
    }
  }
}
