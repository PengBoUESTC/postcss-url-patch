import type { Plugin, Declaration } from 'postcss'

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

// 特殊字符 转换 用于生成 正则
// . => \.
// - => \\x2d
const escapeRegExp = (str: string) =>
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

const formatOptions = (options: Partial<Options>): Options => {
  const result = {
    ...DEFAULTS,
    ...options,
  }
  result.rules = formatRules(result.rules)
  result.exclude = formatExclude(result.exclude)
  return result as Options
}

export const postcssUrlPatch = (options_: Partial<Options> = {}): Plugin => {
  const options = formatOptions(options_)

  const loop = (cb: (params: { decl: Declaration; url: string }) => void) => {
    // url()
    // url("")
    // url('') 排除 data:
    const matcher = /url\(\s*['"]*(?!['"]*data:)(.*?)['"]*\s*\)/gm
    return (decl: Declaration) => {
      let match
      while ((match = matcher.exec(decl.value)) !== null) {
        cb({ decl, url: match[match.length - 1] })
      }
    }
  }

  const gneNewUrl = (url: string, options: Options) => {
    const { rules, replace, exclude } = options
    return rules.reduce(
      (url, { base, deprecated, replace: replaceLocale = replace }) => {
        // 不替换  && 包含指定字符串 直接返回旧的
        if (!replaceLocale && deprecated && (deprecated as RegExp).test(url))
          return url
        // 需要替换
        if (replaceLocale && deprecated) {
          url = url.replace(deprecated, base)
        }

        if (url.startsWith(base)) return url
        if (url.startsWith('http') || url.startsWith(':/')) return url
        if (exclude && (exclude as RegExp).test(url)) return url
        return `${base}${url}`
      },
      url,
    )
  }

  return {
    postcssPlugin: 'postcss-url-patch',
    Once(root) {
      const { filter } = options

      root.walkDecls(
        filter,
        loop(({ decl, url }: { decl: Declaration; url: string }) => {
          const newUrl = gneNewUrl(url, options)
          if (newUrl) {
            const regexp = new RegExp(`['"]?${escapeRegExp(url)}['"]?`, 'gm')

            decl.value = decl.value.replace(regexp, `'${newUrl}'`)
            // console.log(url, 'successfully replaced with ', newUrl)
          } else {
            // console.log(url, 'failed')
          }
        }),
      )
    },
  }
}
