/* eslint-disable import/no-default-export */

// cf. https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/emscripten/index.d.ts

interface JSTypes {
  number: number;
  string: string;
}

type JSType = keyof JSTypes;

type ReturnToType<R> = R extends null ? null : R extends JSType ? JSTypes[R] : never;

type ArgsToType<SA> = SA extends readonly [infer S, ...infer R]
  ? readonly [ReturnToType<S>, ...ArgsToType<R>]
  : readonly [];

// eslint-disable-next-line import/exports-last
export interface LibarchiveModule {
  _free: (ptr: number) => void;

  _malloc: (size: number) => number;

  cwrap: <
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    RT extends ReturnToType<R>,
    IA = undefined,
    R extends JSType = JSType,
    I extends readonly JSType[] = readonly JSType[],
  >(
    ident: string,
    returnType: R,
    argTypes: I,
  ) => (...args: IA extends unknown[] ? IA : ArgsToType<I>) => RT;

  HEAP8: Int8Array;

  locateFile: (url: string, scriptDirectory: string) => string;
}

declare function libarchive(options?: Partial<LibarchiveModule>): Promise<LibarchiveModule>;

export default libarchive;
