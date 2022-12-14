const { getEntrySet } = require("./utils")
const {stringifyRequest, parseQuery} = require("loader-utils")
const path = require("path")
const packageJson = require(path.join(process.cwd(), "package.json"))

let entryStringSet = null
const entryOriginCodeMap = {}

module.exports = function lod (source, map, meta) {
  if (entryStringSet == null) {
    entryStringSet = getEntrySet(this._compiler)
  }

  if (entryStringSet.has(this.resourcePath)) {
    const query = parseQuery(this.resourceQuery || "?") || {}
    if ('wpm' in query && query.type === "entry") {
      this.callback(null, entryOriginCodeMap[this.resourcePath], map, meta)
      return
    } else {
      entryOriginCodeMap[this.resourcePath] = source
      return `
      /* eslint-disable */
      const preget = require("pre-get")
      module.exports = preget(function () {
        const chunkId = "__wpm__entryWaitLoaderChunkId"
        const wpmPackages = window.__wpm__plugin.chunkMap["${packageJson.name}__" + chunkId]
        return window.__wpm__plugin.wait(wpmPackages).then(function (res) {
          return require(${stringifyRequest(this, `${this.resourcePath}?wpm&type=entry${this.resourceQuery.replace("?", "&")}`)})
        })
      }())
      `
    }
  }
  this.callback(null, source, map, meta)
  return
}