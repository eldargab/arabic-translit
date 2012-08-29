var arabic = require('arabic-translit').arabic
var diacritics = new RegExp('^[' + arabic.diacritics + ']$')

module.exports = function template (map) {
    var blockSize = 20
    var help = new HelpTable(map).toArray()
    var html = '<table><tbody>'
    var block = 0
    for (var i = 0, block = 0; i < help.length; i++, block++) {
        if (block == blockSize) {
            block = 0
            if (i < help.length - 1) html += '</tbody><tbody>'
        }
        html += '<tr>'
        html += '<td class="arabic">' + help[i].arabic + '</td>'
        html += '<td class="translit">' + help[i].translit + '</td>'
        html += '</tr>'
    }
    return html + '</tbody></table>'
}

function HelpTable (map) {
    this.table = {}
    this.map = map
    this.generate()
}

HelpTable.prototype.generate = function () {
    this.forEachSymbol(function (s, ar) {
        ar = this.normalize(ar)
        var item = this.table[ar]
        if (!item) {
            this.table[ar] = {
                arabic: ar,
                translit: s
            }
        } else {
            item.translit += ', ' + s
        }
    })
}

HelpTable.prototype.forEachSymbol = function (cb) {
    for (var key in this.map) {
        cb.call(this, key, this.map[key])
    }
}

HelpTable.prototype.normalize = function (ar) {
    return diacritics.test(ar)
        ? ar + '-'
        : ar
}

HelpTable.prototype.toArray = function () {
    var arr = []
    for (var key in this.table) {
        arr.push(this.table[key])
    }
    return arr.sort(function (a, b) {
        return a.arabic.localeCompare(b.arabic)
    })
}
