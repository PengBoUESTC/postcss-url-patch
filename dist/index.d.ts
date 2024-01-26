import type { Plugin } from 'postcss'
interface Options {
  rules: Array<{
    base: string
    deprecated?: string | RegExp
    replace?: boolean
  }>
  replace?: boolean
  filter: RegExp
  exclude?: string | RegExp
}
export declare const postcssUrlPatch: (options_?: Partial<Options>) => Plugin
export {}
