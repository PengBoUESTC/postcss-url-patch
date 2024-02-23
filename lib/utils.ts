export const enum VERSION {
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

// 特殊字符 转换 用于生成 正则
// . => \.
// - => \\x2d
export const escapeRegExp = (str: string) =>
  str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')

const formatRules = (rules?: Options['rules']): Options['rules'] => {
  if (!rules) return []
  return rules.map((rule) => {
    let { deprecated } = rule
    if (typeof deprecated === 'string')
      deprecated = new RegExp(escapeRegExp(deprecated))
    return {
      ...rule,
      deprecated,
    }
  })
}

const formatExclude = (
  exclude?: string | RegExp | ((path: string) => boolean),
): ((path: string) => boolean) => {
  if (!exclude) return () => true

  if (typeof exclude === 'function') return exclude
  if (typeof exclude === 'string') {
    return (path: string) => path.indexOf(exclude as string) !== -1
  }
  return (path: string) => exclude.test(path)
}

const DEFAULTS: Partial<Options> = {
  exclude: /node_modules/i,
  excludeUrl: /assets/i,
  filter:
    /^(mask(?:-image)?)|(list-style(?:-image)?)|(background(?:-image)?)|(content)|(cursor)|(src)/,
}

export const formatOptions = (options: Partial<Options>): FormatOptions => {
  const result = {
    ...DEFAULTS,
    ...options,
  }
  result.rules = formatRules(result.rules)
  result.exclude = formatExclude(result.exclude)
  result.excludeUrl = formatExclude(result.excludeUrl)
  return result as FormatOptions
}
