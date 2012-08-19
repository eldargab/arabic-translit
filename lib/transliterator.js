module.exports = function (map) {
    var keys = getKeys(map).sort(function (a, b) {
        return b.length - a.length
    })

    function matchKey (str, offset) {
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i]
            if (str.slice(offset, offset + key.length) == key) return key
        }
    }

    return function transliterate (str) {
        var out = ''
        var i = 0
        var l = str.length

        while (i < l) {
            var key = matchKey(str, i)
            if (key) {
                out += map[key]
                i += key.length
            } else {
                out += str[i]
                i++
            }
        }
        return out
    }
}

function getKeys (obj) {
    var keys = []
    for (var key in obj) {
        keys.push(key)
    }
    return keys
}