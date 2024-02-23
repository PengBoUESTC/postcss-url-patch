export declare const enum VERSION {
  LOW = 7,
  EIGHT = 8,
}
export interface Options {
  rules: Array<{
    base: string
    deprecated?: string | RegExp
  }>
  filter: RegExp
  exclude?: string | RegExp | ((path: string) => boolean)
  excludeUrl?: string | RegExp | ((path: string) => boolean)
  version?: VERSION
}
export interface FormatOptions extends Options {
  exclude: (path: string) => boolean
  excludeUrl: (path: string) => boolean
}
export declare const escapeRegExp: (str: string) => string
export declare const formatOptions: (options: Partial<Options>) => FormatOptions
