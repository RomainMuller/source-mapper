import { resolve } from 'path';
import { mapSourceLocation } from '../lib';

describe(mapSourceLocation, () => {
  test('supports inline source maps', async () => {
    const js = resolve(__dirname, 'cases', 'inline-source-map.js');
    const ts = resolve(__dirname, 'cases', 'inline-source-map.ts');

    await expect(mapSourceLocation({ file: js, line: 13, column: 11 }))
      .resolves.toEqual({ file: ts, line: 14, column: 8 });

    await expect(mapSourceLocation({ file: js, line: 8, column: 9 }))
      .resolves.toEqual({ file: ts, line: 9, column: 4 });
  });
});
