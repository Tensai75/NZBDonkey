import libarchive from './libarchive';
import { wrapLibarchiveWasm } from './wrapLibarchiveWasm';

export type LibarchiveWasm = ReturnType<typeof wrapLibarchiveWasm>;

export async function libarchiveWasm(
  ...args: Parameters<typeof libarchive>
): Promise<LibarchiveWasm> {
  return libarchive(...args).then((mod) => wrapLibarchiveWasm(mod));
}
