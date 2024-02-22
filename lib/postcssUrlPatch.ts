import type {
  Root,
  Plugin,
  Declaration,
  Processor,
  TransformCallback,
} from 'postcss'

import { VERSION, formatOptions, escapeRegExp } from './utils'
import type { Options, FormatOptions } from './utils'

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

  // deprecated/a.png => replaceLocale/a.png
  // https://a.com/a.png | http://a.com/a.png | //a.com/a.png => https://a.com/a.png
  // assets/a.png => assets/a.png
  // a.png => replaceLocale/a.png
  const gneNewUrl = (url: string, options: FormatOptions) => {
    const { rules, replace, excludeUrl } = options
    return rules.reduce(
      (url, { base, deprecated, replace: replaceLocale = replace }) => {
        // 不替换  && 包含指定字符串 直接返回旧的
        if (!replaceLocale && deprecated && (deprecated as RegExp).test(url))
          return url
        // 需要替换
        // deprecated/a.png => replaceLocale/a.png
        if (replaceLocale && deprecated) {
          url = url.replace(deprecated, base)
        }

        if (url.startsWith(base)) return url
        // 有根路径 不进行 base 补充
        // https://a.com/a.png | http://a.com/a.png | //a.com/a.png => https://a.com/a.png
        if (
          url.startsWith('https://') ||
          url.startsWith('//') ||
          url.startsWith('http://')
        )
          return url
        // 排除在外的 不进行补充
        // assets/a.png => assets/a.png
        if (excludeUrl(url)) return url
        // a.png => replaceLocale/a.png
        return `${base}${url}`
      },
      url,
    )
  }

  if (options.version === VERSION.LOW) {
    return function (root: Root) {
      const filePath = root.source?.input.file
      const { filter, exclude } = options
      if (filePath && exclude(filePath)) return

      root.walkRules(function (rule) {
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
      const filePath = root.source?.input.file

      const { filter, exclude } = options
      if (filePath && exclude(filePath)) return

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
