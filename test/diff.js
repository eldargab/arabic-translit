var diff = require('../lib/diff')
var I = require('./util/intervals-parser')()

describe('Diff additions', function () {
    test('[abc]')
    test('[bbb]aaa')
    test('[c]aa[b]')
    test('aa[12]bb[456]cc[78]dd')
})

function test (spec) {
    var s = parseSpec(spec)
    it(spec, function () {
        diff.additions(s.curr, s.prev).strings().should.eql(s.additions)
    })
}

function parseSpec (spec) {
    var additions = I(spec)
    return {
        additions: additions.strings(),
        curr: additions.str,
        prev: additions.replace('').str
    }
}