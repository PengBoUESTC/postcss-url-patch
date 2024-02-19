import type {
  Root,
  Plugin,
  Declaration,
  Processor,
  TransformCallback,
} from 'postcss'

import { VERSION, formatOptions, escapeRegExp } from './utils'
import type { Options } from './utils'

export default (
  options_: Partial<Options> = {},
): Plugin | Processor | TransformCallback => {
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
        if (
          url.startsWith('https://') ||
          url.startsWith('//') ||
          url.startsWith('http://')
        )
          return url
        if (exclude && (exclude as RegExp).test(url)) return url
        return `${base}${url}`
      },
      url,
    )
  }

  if (options.version === VERSION.LOW) {
    return function (root: Root) {
      root.walkRules(function (rule) {
        const { filter } = options

        rule.walkDecls(
          filter,
          loop(({ decl, url }: { decl: Declaration; url: string }) => {
            const newUrl = gneNewUrl(url, options)
            if (newUrl) {
              const regexp = new RegExp(`['"]?${escapeRegExp(url)}['"]?`, 'gm')
              decl.value = decl.value.replace(regexp, `'${newUrl}'`)
            }
          }),
        )
      })
    }
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
          }
        }),
      )
    },
  }
}
