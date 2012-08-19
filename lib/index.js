var util = require('./util')
var getAdditions = require('./diff').additions
var Transliterator = require('./transliterator')
var symbols = require('./symbols-map')
var arabic = require('./arabic')

module.exports = function (opts) {
    opts = opts || {}
    var map = util.mix(Object.create(symbols), opts.map)
    var t = Transliterator(map)
    var quirks = opts.quriks === false ? null: arabic.quirks(opts.quirks)

    return function (str, prev) {
        var i = getAdditions(str, prev || '')
        i = i.replace(t)
        if (quirks) {
            i = i.expand(arabic.wordCharsRegex).replace(function (s) {
                return arabic.splitWords(s).replace(quirks).str
            })
        }
        i = opts.removeDiacritics ? i.replace(arabic.removeDiacritics) : i
        return i.str
    }
}

module.exports.simple = Transliterator(symbols)

module.exports.Transliterator = Transliterator

module.exports.symbols = util.mix({}, symbols)

module.exports.arabic = arabic