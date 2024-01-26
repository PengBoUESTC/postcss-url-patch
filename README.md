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
  exclude?: string | RegExp // exclude style value test
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
