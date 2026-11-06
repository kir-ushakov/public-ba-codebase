/** Compiled only into the benchmark build, via fileReplacements. */
export function benchMark(name: string): void {
  performance.mark(name);
}

export function benchMeasure(name: string, start: string, end: string): void {
  performance.measure(name, start, end);
}
