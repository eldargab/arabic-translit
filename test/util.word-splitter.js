var separator = /_+/g
var split = require('../lib/util').wordSplitter(separator)

describe('Word splitter', function () {
    test('_abc__d')
    test('abcd__')
})

function test (spec) {
    it(spec, function () {
        split(spec).strings().should.eql(spec.split(separator).filter(function (i) {
            return !!i
        }))
    })
}