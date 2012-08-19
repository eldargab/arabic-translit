var util = require('../../lib/util')

module.exports = function (open, close) {
    open = open || '['
    close = close || ']'
    var regex = new RegExp('\\' + open + '([^' + '\\' + close + ']*)' + '\\' + close, 'g')
    return function parse (spec) {
        var intervals = []
        var shift = 0
        var str = spec.replace(regex, function (m, contents, offset) {
            var start = offset - shift
            intervals.push(new util.Interval(start, start + contents.length))
            shift += 2
            return contents
        })
        return util.Intervals(str, intervals)
    }
}