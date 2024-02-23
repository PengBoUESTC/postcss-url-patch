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
    if (!exclude)
        return () => true;
    if (typeof exclude === 'function')
        return exclude;
    if (typeof exclude === 'string') {
        return (path) => path.indexOf(exclude) !== -1;
    }
    return (path) => exclude.test(path);
};
const DEFAULTS = {
    exclude: /node_modules/i,
    excludeUrl: /assets/i,
    filter: /^(mask(?:-image)?)|(list-style(?:-image)?)|(background(?:-image)?)|(content)|(cursor)|(src)/,
};
const formatOptions = (options) => {
    const result = Object.assign(Object.assign({}, DEFAULTS), options);
    result.rules = formatRules(result.rules);
    result.exclude = formatExclude(result.exclude);
    result.excludeUrl = formatExclude(result.excludeUrl);
    return result;
};

var postcssUrlPatch = (options_ = {}) => {
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
        const { rules, excludeUrl } = options;
        return rules.reduce((url, { base, deprecated }) => {
            if (deprecated) {
                url = url.replace(deprecated, base);
                return url;
            }
            if (url.startsWith('https://') ||
                url.startsWith('//') ||
                url.startsWith('http://'))
                return url;
            if (excludeUrl(url))
                return url;
            return `${base}${url}`;
        }, url);
    };
    if (options.version === 7) {
        return function (root) {
            var _a;
            const filePath = (_a = root.source) === null || _a === void 0 ? void 0 : _a.input.file;
            const { filter, exclude } = options;
            if (filePath && exclude(filePath))
                return;
            root.walkRules(function (rule) {
                rule.walkDecls(filter, loop(({ decl, url }) => {
                    const newUrl = gneNewUrl(url, options);
                    if (newUrl) {
                        const regexp = new RegExp(`['"]?${escapeRegExp(url)}['"]?`, 'gm');
                        decl.value = decl.value.replace(regexp, `'${newUrl}'`);
                    }
                }));
            });
        };
    }
    return {
        postcssPlugin: 'postcss-url-patch',
        Once(root) {
            var _a;
            const filePath = (_a = root.source) === null || _a === void 0 ? void 0 : _a.input.file;
            const { filter, exclude } = options;
            if (filePath && exclude(filePath))
                return;
            root.walkDecls(filter, loop(({ decl, url }) => {
                const newUrl = gneNewUrl(url, options);
                if (newUrl) {
                    const regexp = new RegExp(`['"]?${escapeRegExp(url)}['"]?`, 'gm');
                    decl.value = decl.value.replace(regexp, `'${newUrl}'`);
                }
            }));
        },
    };
};

exports.postcssUrlPatch = postcssUrlPatch;
