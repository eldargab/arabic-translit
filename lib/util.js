function Interval (start, end) {
    this.start = start
    this.end = end
}

function Intervals (str, intervals) {
    intervals.str = str

    intervals.sort(function (a, b) {
        return a.start - b.start
    })

    intervals.replace = function (cb) {
        var _cb = typeof cb == 'function' ? cb : function () {
            return cb
        }
        var str = ''
        var shift = 0
        var offset = 0

        var _intervals = this.map(function (i) {
            var prev = this.str.slice(i.start, i.end)
            var curr = _cb(prev)

            str += this.str.slice(offset, i.start)
            str += curr
            offset = i.end

            var start = i.start + shift
            shift += curr.length - prev.length
            return new Interval(start, start + curr.length)
        }, this)

        str += this.str.slice(offset, this.str.length)

        return Intervals(str, _intervals)
    }

    intervals.strings = function () {
        return this.map(function (i) {
            return this.str.slice(i.start, i.end)
        }, this)
    }

    intervals.expand = function (regex) {
        var prev
        return Intervals(this.str, this.filter(function (i) {
            var start = i.start
            while (start >= 0 && regex.test(this.str[start])) {
                i.start = start
                start--
            }

            var end = i.end
            while (end <= this.str.length && regex.test(this.str[end-1])) {
                i.end = end
                end++
            }
            var overlapsWithPrev = prev && (
                (i.start >= prev.start && i.start < prev.end) || (prev.start >= i.start && prev.start < i.end)
            )
            if (overlapsWithPrev) {
                prev.start = Math.min(prev.start, i.start)
                prev.end = Math.max(prev.end, i.end)
                return false
            } else {
                prev = i
                return true
            }
        }, this))
    }

    return intervals
}

exports.Interval = Interval
exports.Intervals = Intervals


exports.wordSplitter = function (separator) {
    return function (str) {
        var words = []
        var match, start = 0
        while (match = separator.exec(str)) {
            start < match.index && words.push(new Interval(start, match.index, str))
            start = separator.lastIndex
        }
        start < str.length && words.push(new Interval(start, str.length, str))
        return exports.Intervals(str, words)
    }
}


exports.mix = function (target, src) {
    for (var key in src) {
        target[key] = src[key]
    }
    return target
}