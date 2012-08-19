var T = require('../lib')
var toArabic = require('./util/translit').toArabic
var toEnglish = require('./util/translit').toEnglish
var IntervalsParser = require('./util/intervals-parser')
var Eng = IntervalsParser('(', ')')
var Additions = IntervalsParser()


describe('Integration tests', function () {
    suite('Quirks mode', function () {
        test('xal[a]ykum', 'xalaykum')
        test('sharika`t (Microsoft)[ axlanat ]anna', "sharika`t Microsoft 'Aaxlanat anna") // note that "anna" not fixed
    })

    suite('Simple mode', {quirks: false}, function () {
        test("['Als``laAmu xalaykum]", "'Als``laAmu xalaykum")
    })

    suite('Custom mapping', {map: {asdf: 'Asdf!'}}, function () {
        test("[AhlaA asdf]", "AhlaA Asdf!")
    })
})



function suite (name, opts, fn) {
    if (typeof opts == 'function') {
        fn = opts
        opts = null
    }

    describe(name, function () {
        beforeEach(function () {
            this.t = T(opts)
        })
        fn()
    })
}


function test (spec, expected) {
    var s = parseSpec(spec)
    it(spec + ' -> ' + expected, function () {
        toEnglish(this.t(s.curr, s.prev)).should.equal(expected)
    })
}


function parseSpec (spec) {
    // convert everything to arabic
    spec = toArabic(spec)

    // Then convert back to english words in parentheses
    spec = Eng(spec).replace(toEnglish).str

    var additions = Additions(spec)

    return {
        curr: additions.replace(toEnglish).str,
        prev: additions.replace('').str
    }
}