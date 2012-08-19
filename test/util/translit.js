var T = require('../../lib/transliterator')
var symbols = require('../../lib/symbols-map')

var arabicSymbols = (function () {
    var map = {}
    for (var key in symbols) {
        map[symbols[key]] = key
    }
    return map
})()

exports.toArabic = T(symbols)
exports.toEnglish = T(arabicSymbols)