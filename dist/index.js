'use strict';

const escapeRegExp = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
const formatRules = (rules) => {
    if (!rules)
        return [];
    return rules.map((rule) => {
        let { deprecated } = rule;
        if (typeof deprecated === 'string')
            deprecated = new RegExp(escapeRegExp(deprecated));
        return Object.assign(Object.assign({}, rule), { deprecated });
    });
};
const formatExclude = (exclude) => {
    if (typeof exclude === 'string')
        return RegExp(escapeRegExp(exclude));
    return exclude;
};
const DEFAULTS = {
    exclude: /assets/,
    filter: /^(mask(?:-image)?)|(list-style(?:-image)?)|(background(?:-image)?)|(content)|(cursor)/,
};
const formatOptions = (options) => {
    const result = Object.assign(Object.assign({}, DEFAULTS), options);
    result.rules = formatRules(result.rules);
    result.exclude = formatExclude(result.exclude);
    return result;
};
const postcssUrlPatch = (options_ = {}) => {
    const options = formatOptions(options_);
    const loop = (cb) => {
        const matcher = /url\(\s*['"]*(?!['"]*data:)(.*?)['"]*\s*\)/gm;
        return (decl) => {
            let match;
            while ((match = matcher.exec(decl.value)) !== null) {
                cb({ decl, url: match[match.length - 1] });
            }
        };
    };
    const gneNewUrl = (url, options) => {
        const { rules, replace, exclude } = options;
        return rules.reduce((url, { base, deprecated, replace: replaceLocale = replace }) => {
            if (!replaceLocale && deprecated && deprecated.test(url))
                return url;
            if (replaceLocale && deprecated) {
                url = url.replace(deprecated, base);
            }
            if (url.startsWith(base))
                return url;
            if (url.startsWith('http') || url.startsWith(':/'))
                return url;
            if (exclude && exclude.test(url))
                return url;
            return `${base}${url}`;
        }, url);
    };
    return {
        postcssPlugin: 'postcss-url-patch',
        Once(root) {
            const { filter } = options;
            root.walkDecls(filter, loop(({ decl, url }) => {
                const newUrl = gneNewUrl(url, options);
                if (newUrl) {
                    const regexp = new RegExp(`['"]?${escapeRegExp(url)}['"]?`, 'gm');
                    decl.value = decl.value.replace(regexp, `'${newUrl}'`);
                    console.log(url, 'successfully replaced with ', newUrl);
                }
                else {
                    console.log(url, 'failed');
                }
            }));
        },
    };
};

exports.postcssUrlPatch = postcssUrlPatch;
