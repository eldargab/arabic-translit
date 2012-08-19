var toArabic = require('./util/translit').toArabic
var toEnglish = require('./util/translit').toEnglish
var arabic = require('../lib/arabic')
var fixQuirks = arabic.quirks()

function test (input, expected) {
    it(input + ' -> ' + expected, function () {
        toEnglish(fixQuirks(toArabic(input))).should.equal(expected)
    })
}

describe('Quirks', function () {
    test('asslaam', "'Aals``laAm")
    test('imaan', 'IimaAn')
    test('washshams', "waAlsh``ams")
    test('aamana', "Aamana")
})