import { readFile as read } from 'fs/promises';
import * as http from 'http';
import * as https from 'https';
import { from, Observable } from 'rxjs';
/**
 * Reads a file from disk or from a URL returning the contents of the file as an observable.
 * @param path The path to the file to be read.
 * @returns An observable that containing the contents of the file.
 */
export function readFile(path: URL | string) {
  const isHttp = path.toString().startsWith('http');
  const isHttps = path.toString().startsWith('https');

  if (isHttp || isHttps) {
    // Read file from URL.
    const requestType = isHttp ? http : https;
    return new Observable<Buffer>(sub => {
      requestType.get(path, res => {
        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => sub.next(Buffer.concat(chunks)));
      });
    });
  } else {
    // Read file from disk.
    const r = read(path, 'utf8');
    return from(r);
  }
}
