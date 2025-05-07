/* eslint-disable perfectionist/sort-objects */
import type { LibarchiveModule } from './libarchive';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function wrapLibarchiveWasm(module: LibarchiveModule) {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, unicorn/consistent-function-scoping */
  const checkReturnValue = <R, F extends (...args: any[]) => R>(
    fn: F,
    test: (r: R) => boolean,
  ): F =>
    function f(this: any, ...args: any[]) {
      const r = fn(...args);
      if (test(r)) throw new Error(this.error_string(args[0]));
      return r;
    } as unknown as F;

  const nonzero = (r: number): boolean => r !== 0;
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, unicorn/consistent-function-scoping */

  return {
    module,
    version_number: module.cwrap('archive_version_number', 'number', []),
    version_string: module.cwrap('archive_version_string', 'string', []),
    version_details: module.cwrap('archive_version_details', 'string', []),
    read_new_memory: checkReturnValue(
      module.cwrap<number, [number, number, string?]>('archive_read_new_memory', 'number', [
        'number',
        'number',
        'string',
      ] as const),
      (r: number) => r === 0,
    ),
    read_new: module.cwrap('archive_read_new', 'number', []),
    read_support_filter_all: checkReturnValue(
      module.cwrap('archive_read_support_filter_all', 'number', ['number'] as const),
      nonzero,
    ),
    read_support_format_all: checkReturnValue(
      module.cwrap('archive_read_support_format_all', 'number', ['number'] as const),
      nonzero,
    ),
    read_open_memory: checkReturnValue(
      module.cwrap('archive_read_open_memory', 'number', ['number', 'number', 'number'] as const),
      nonzero,
    ),
    read_next_entry: module.cwrap('archive_read_next_entry', 'number', ['number'] as const),
    read_has_encrypted_entries: module.cwrap('archive_read_has_encrypted_entries', 'number', [
      'number',
    ] as const),
    read_data: checkReturnValue(
      module.cwrap('archive_read_data', 'number', ['number', 'number', 'number'] as const),
      (r: number) => r < 0,
    ),
    read_data_skip: checkReturnValue(
      module.cwrap('archive_read_data_skip', 'number', ['number'] as const),
      nonzero,
    ),
    read_add_passphrase: checkReturnValue(
      module.cwrap('archive_read_add_passphrase', 'number', ['number', 'string'] as const),
      nonzero,
    ),
    read_free: checkReturnValue(
      module.cwrap('archive_read_free', 'number', ['number'] as const),
      nonzero,
    ),
    error_string: module.cwrap('archive_error_string', 'string', ['number'] as const),
    entry_filetype: module.cwrap('archive_entry_filetype', 'number', ['number'] as const),
    entry_pathname: module.cwrap('archive_entry_pathname_utf8', 'string', ['number'] as const),
    entry_symlink: module.cwrap('archive_entry_symlink_utf8', 'string', ['number'] as const),
    entry_hardlink: module.cwrap('archive_entry_hardlink_utf8', 'string', ['number'] as const),
    entry_size: module.cwrap('archive_entry_size', 'number', ['number'] as const),
    entry_atime: module.cwrap('archive_entry_atime', 'number', ['number'] as const),
    entry_birthtime: module.cwrap('archive_entry_birthtime', 'number', ['number'] as const),
    entry_ctime: module.cwrap('archive_entry_ctime', 'number', ['number'] as const),
    entry_mtime: module.cwrap('archive_entry_mtime', 'number', ['number'] as const),
    entry_is_encrypted: module.cwrap('archive_entry_is_encrypted', 'number', ['number'] as const),
  };
}
