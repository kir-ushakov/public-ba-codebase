declare module 'probe-image-size' {
  import type { Readable } from 'stream';

  type ProbeResult = {
    width: number;
    height: number;
    mime: string;
  };

  function probe(stream: Readable): Promise<ProbeResult>;

  export default probe;
}
