import { createReadStream } from 'fs';
import { pathExists } from 'fs-extra';
import { dirname, resolve } from 'path';
import { SourceMapConsumer } from 'source-map';
import { Readable } from 'stream';

export interface SourceLocation {
  readonly file: string;
  readonly line: number;
  readonly column: number;
}

export async function mapSourceLocation(location: SourceLocation): Promise<SourceLocation> {
  if (!await pathExists(location.file)) {
    throw new Error(`Source file does not exist: ${location.file}`);
  }

  const sourceMap = await loadSourceMap(location.file);
  if (sourceMap == null) {
    return location;
  }

  const position = sourceMap.originalPositionFor({
    line: location.line,
    column: location.column,
  });

  if (position == null) {
    return location;
  }

  return {
    file: resolve(dirname(location.file), position.source),
    line: position.line,
    column: position.column,
  };
}

const INLINE_SOURCE_MAP_PREFIX = Buffer.from('//# sourceMappingURL=data:application/json;base64,');
const INLINE_SOURCE_MAP_PREFIX_LENGTH = INLINE_SOURCE_MAP_PREFIX.length;

async function loadSourceMap(path: string): Promise<SourceMapConsumer | undefined> {
  return new Promise((ok, ko) => {
    try {
      const stream: Readable = createReadStream(path, { encoding: 'utf-8' });

      stream.once('error', ko);

      let buffer = Buffer.alloc(0);

      stream.once('close', () => ok(tryLoadSourceMap(buffer)));

      stream.on('data', chunk => {
        buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
        buffer = processAllLines(buffer);
        if (buffer == null) {
          stream.destroy();
        }
      });

    } catch (error) {
      ko(error);
    }

    function processAllLines(buff: Buffer): Buffer | undefined {
      let newLine: number;
      while ((newLine = buff.indexOf('\n')) >= 0) {
        const sourceMap = tryLoadSourceMap(buff.slice(0, newLine));
        if (sourceMap != null) {
          ok(sourceMap);
          return undefined;
        }
        buff = buff.slice(newLine + 1);
      }
      return buff;
    }

    function tryLoadSourceMap(buf: Buffer): Promise<SourceMapConsumer> | undefined {
      if (!buf.slice(0, INLINE_SOURCE_MAP_PREFIX_LENGTH).equals(INLINE_SOURCE_MAP_PREFIX)) {
        return undefined;
      }
      const data = Buffer.from(
        buf.slice(INLINE_SOURCE_MAP_PREFIX_LENGTH).toString('ascii'),
        'base64',
      );
      return new SourceMapConsumer(data.toString('utf-8'));
    }
  });
}
