import type { ArchiveReader } from './ArchiveReader';

export class ArchiveReaderEntry {
  // eslint-disable-next-line @typescript-eslint/parameter-properties
  reader: ArchiveReader;

  pointer: number;

  readCalled: boolean;

  constructor(reader: ArchiveReader, ptr: number) {
    this.reader = reader;
    this.pointer = ptr;
    this.readCalled = false;
  }

  free(): void {
    this.skipData();
    this.reader = null as unknown as ArchiveReader;
    this.pointer = null as unknown as number;
  }

  readData(): Int8Array | undefined {
    if (this.readCalled) throw new Error('It has already been called.');

    const size = this.getSize();
    if (!size) {
      this.skipData();
      return undefined;
    }

    this.readCalled = true;
    return this.reader.readData(size);
  }

  skipData(): void {
    if (this.readCalled) return;
    this.readCalled = true;
    this.reader.skipData();
  }

  getFiletype(): string {
    return this.reader.getEntryFiletype(this.pointer);
  }

  getPathname(): string {
    return this.reader.getEntryPathname(this.pointer);
  }

  getSize(): number {
    return this.reader.getEntrySize(this.pointer);
  }

  getAccessTime(): number {
    return this.reader.getEntryAccessTime(this.pointer);
  }

  getBirthTime(): number {
    return this.reader.getEntryBirthTime(this.pointer);
  }

  getCreationTime(): number {
    return this.reader.getEntryCreationTime(this.pointer);
  }

  getModificationTime(): number {
    return this.reader.getEntryModificationTime(this.pointer);
  }

  isEncrypted(): boolean {
    return this.reader.isEntryEncrypted(this.pointer);
  }

  getSymlinkTarget(): string {
    return this.reader.getSymlinkTarget(this.pointer);
  }

  getHardlinkTarget(): string {
    return this.reader.getHardlinkTarget(this.pointer);
  }
}
