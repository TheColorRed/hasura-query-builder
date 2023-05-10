import { of, tap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

class HasuraFileReader {
  files = new Map<string, string>();

  read(file: string | URL) {
    const path = file.toString();
    if (this.files.has(path)) return of(this.files.get(path)!);
    return fromFetch(path, {
      method: 'GET',
      selector: resp => resp.text(),
    }).pipe(tap(text => this.files.set(path, text)));
  }
}

const win = (typeof global !== 'undefined' ? global.window : window) as CustomWindow;
win.hasuraFileReader = new HasuraFileReader();
