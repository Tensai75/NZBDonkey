import { describe, expect, test } from 'vitest';

import { libarchiveWasm } from './libarchiveWasm';

describe('libarchiveWasm', () => {
  test('version_number', async () => {
    const mod = await libarchiveWasm();
    expect(mod.version_number()).toBeGreaterThanOrEqual(0);
  });

  test('version_string', async () => {
    const mod = await libarchiveWasm();
    expect(mod.version_string()).toMatch(/^libarchive \d+(?:.\d+)*$/);
  });

  test('version_details', async () => {
    const mod = await libarchiveWasm();
    expect(mod.version_details()).toMatch(/^libarchive \d+(?:.\d+)*(?: \w+\/\d+(?:.\d+)*)*$/);
  });
});
