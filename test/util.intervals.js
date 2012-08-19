var I = require('./util/intervals-parser')()

describe('util.Intervals', function () {
    describe('.replace()', function () {
        it('ok', function () {
            I('ab[dfgg]ab[as]').replace(function (s) {
                return 'c'
            }).str.should.equal('abcabc')
        })
    })

    describe('.expand()', function () {
        function test (name, intervals, expect) {
            it(name, function () {
                I(intervals).expand(/x/).strings().should.eql(expect)
            })
        }

        test('Should expand', 'abcx[xx]xdf[xx]x', ['xxxx', 'xxx'])
        test('Should merge overlapping', 'ab[x][xx][x]ab', ['xxxx'])
        test('Should not expand if ends with non matching symbol', 'abx[cd]x', ['cd'])
    })
})