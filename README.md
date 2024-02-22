# postcssUrlPatch

- replace the `deprecated` with `base`

      deprecated/a.png  => base/a.png

- patch the `base` for the url without base

      a.png => base/a.png

## options
```javascript
interface Options {
  rules: Array<{
    base: string,  // 'new url base',
    deprecated?: string | RegExp, // 'deprecated url base',
    replace?: boolean  // replace the deprecated or not 
  }>
  replace?: boolean // replace the deprecated or not
  filter: RegExp // style selector
  exclude?: string | RegExp | ((path: string) => boolean) // exclude build dir, with default value /node_modules/i
  excludeUrl?: string | RegExp | ((path: string) => boolean) // exclude url value, with default value /assets/i,
  version?: VERSION // postcss 7 | 8
}
```

## use
```javascript
plugins: [
  postcssPxtorem({
    rootValue: 100,
    propList: ['*']
  }),
  postcssUrlReplace({
    rules: [
      {
        base: 'new url base',
        deprecated: 'deprecated url base',
      },
      // ...
    ],
    replace: false
  })
]
```
