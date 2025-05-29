export function removePrefix(str: string, prefix: string): string {
    if (str.startsWith(prefix)) {
        return str.slice(prefix.length)
    }
    return str
}

export function removeSuffix(str: string, suffix: string): string {
    if (str.endsWith(suffix)) {
        return str.slice(0, -suffix.length)
    }
    return str
}

const startsWithHTTPRegex = /^http(?:s?):\/\//
export function fixWebsiteString(website: string) {
    if (!startsWithHTTPRegex.exec(website)) {
        return `https://${website}`
    }
    return website
}

const titleRegex = /<title>(.+)<\/title>/
const domainRegex = /http(?:s?):\/\/.*?([^\.\/]+?\.[^\.]+?)(?:\/|$)/
export function getWebsiteTitle(website: string, html: string) {
    const title = titleRegex.exec(html)
    if (title) {
        return title[1]
    }
    const domain = domainRegex.exec(website)
    if (domain) {
        return domain[1]
    }
    return website
}
