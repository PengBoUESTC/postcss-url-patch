export declare const enum VERSION {
  LOW = 7,
  EIGHT = 8,
}
export interface Options {
  rules: Array<{
    base: string
    deprecated?: string | RegExp
    replace?: boolean
  }>
  replace?: boolean
  filter: RegExp
  exclude?: string | RegExp
  version?: VERSION
}
export declare const escapeRegExp: (str: string) => string
export declare const formatOptions: (options: Partial<Options>) => Options
