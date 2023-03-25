import * as util from 'util';
// let util: any = undefined;
// if (typeof window === 'undefined') {
//   util = await import('util');
// }

export class debug {
  /**
   * **Node Environment ONLY.**
   *
   * Logs values to the console.
   * @param args Arguments.
   */
  static logAndExit(...args: any[]) {
    this.log(...args);
    process.exit();
  }

  static log(...args: any[]) {
    args.forEach(arg => {
      let logValue = arg;
      if (typeof util !== 'undefined' && typeof arg === 'object')
        logValue = util.inspect(arg, { depth: null, showHidden: false, colors: true });
      console.log(logValue);
    });
  }

  static error(...args: any[]) {
    args.forEach(arg => {
      let logValue = arg;
      if (typeof util !== 'undefined' && typeof arg === 'object')
        logValue = util.inspect(arg, { depth: null, showHidden: false, colors: true });
      console.error(logValue);
    });
  }
}
