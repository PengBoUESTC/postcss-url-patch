export const enum VERSION {
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

const formatExclude = (exclude?: string | RegExp): RegExp | undefined => {
  if (typeof exclude === 'string') return RegExp(escapeRegExp(exclude))
  return exclude
}

const DEFAULTS: Partial<Options> = {
  exclude: /assets/,
  filter:
    /^(mask(?:-image)?)|(list-style(?:-image)?)|(background(?:-image)?)|(content)|(cursor)/,
}

export const formatOptions = (options: Partial<Options>): Options => {
  const result = {
    ...DEFAULTS,
    ...options,
  }
  result.rules = formatRules(result.rules)
  result.exclude = formatExclude(result.exclude)
  return result as Options
}
