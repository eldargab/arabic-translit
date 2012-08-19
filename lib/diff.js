var Interval = require('./util').Interval
var Intervals = require('./util').Intervals

function LcsElement (i, ii, prev) {
    this.i = i
    this.ii = ii
    this.length = 1
    if (this.prev = prev) {
        this.length += prev.length
    }
}

function LCS (seq1, seq2) {
    var tails = new Array(seq2.length)
    var prev, t

    for (var i = 0; i < seq1.length; i++) {
        for (var ii = 0; ii < seq2.length; ii++) {
            t = seq1[i] == seq2[ii] ? new LcsElement(i, ii, prev) : null
            if (tails[ii]) {
                prev = !prev || prev.length < tails[ii].length ? tails[ii] : prev
                if (t && t.length > tails[ii].length) tails[ii] = t
            } else {
                tails[ii] = t
            }
        }
    }

    return tails.reduce(function (prev, current) {
        if (!current) return prev
        return prev && (prev.length > current.length)
            ? prev
            : current
    })
}

function commonHead (seq1, seq2) {
    for (var i = 0; i < Math.min(seq1.length, seq2.length); i++) {
        if (seq1[i] != seq2[i]) return i
    }
    return i
}

function commonTail (seq1, seq2) {
    var l1 = seq1.length - 1
    var l2 = seq2.length - 1
    var count = 0

    while (l1 >= 0 && l2 >= 0) {
        if (seq1[l1] != seq2[l2]) return count
        l1--
        l2--
        count++
    }
    return count
}


function additions (curr, prev) {
    var head = commonHead(prev, curr)
    var current = curr
    prev = prev.slice(head)
    curr = curr.slice(head)
    if (curr.length == 0) return []
    if (prev.length == 0) return [new Interval(head, head + curr.length)]

    var tail = commonTail(prev, curr)
    prev = prev.slice(0, prev.length - tail)
    curr = curr.slice(0, curr.length - tail)
    if (curr.length == 0) return []
    if (prev.length == 0) return [new Interval(head, head + curr.length)]

    var ret = []
    var last = LCS(prev, curr)
    var end = curr.length
    while (last) {
        if (last.ii + 1 < end)
            ret.push(new Interval(head + last.ii + 1, head + end))
        end = last.ii
        last = last.prev
    }
    if (end > 0)
        ret.push(new Interval(head, head + end))

    return ret
}

exports.additions = function (curr, prev) {
    return Intervals(curr, additions(curr, prev))
}