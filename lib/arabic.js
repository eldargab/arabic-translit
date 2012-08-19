var util = require('./util')

var ALIF = '\u0627'
var BA = '\u0628'
var KAF = '\u0643'
var LAM = '\u0644'
var WA = '\u0648'
var YA = '\u064A'
var ALIF_WITH_HAMZA_ABOVE = '\u0623'
var ALIF_WITH_HAMZA_BELOW = '\u0625'
var ALIF_WITH_MADDA = '\u0622'
var FATHA = '\u064e'
var KASRA = '\u0650'
var DAMMA = '\u064f'
var SHADDA = '\u0651'
var SUKUN = '\u0652'
var MADDA = '\u0653'

var wordChars = '\u0620-\u065F\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06EF\u06FA-\u06FC\u06FF'
var diacritics = '\u064B-\u0652'


function Replace (regex, replacement) {
    var regex = new RegExp(regex, 'g')
    return function (str) {
        return str.replace(regex, replacement)
    }
}

function RegexQuirk (name, regex, replacement) {
    quirks[name] = Replace(regex, replacement)
}

var quirks = {}

RegexQuirk('beginsWithFatha', '^' + FATHA, ALIF_WITH_HAMZA_ABOVE + FATHA)
RegexQuirk('beginsWithKasra', '^' + KASRA, ALIF_WITH_HAMZA_BELOW + KASRA)
RegexQuirk('beginsWithDamma', '^' + DAMMA, ALIF_WITH_HAMZA_ABOVE + DAMMA)
RegexQuirk('doubledFatha', FATHA + FATHA, FATHA + ALIF)
RegexQuirk('doubledKasra', KASRA + KASRA, KASRA + YA)
RegexQuirk('doubledDamma', DAMMA + DAMMA, DAMMA + WA)

var shaddables = /[بتثجحخدذرزسشصضطظعغفقكلمنهوي]/

quirks.shadda = function (str) {
    var prev, ret = ''
    for (var i = 0; i < str.length; i++) {
        var c = str[i]
        if (prev == c && shaddables.test(c)) {
            ret += SHADDA
            prev = SHADDA
        } else {
            ret += c
            prev = c
        }
    }
    return ret
}

RegexQuirk('alifWithMadda',
    '(?:' + ALIF + '|' + ALIF_WITH_HAMZA_ABOVE + ')' + FATHA + '?' + ALIF,
    ALIF_WITH_MADDA)


var solar = '[تثدذرزسشصضطظنل]'
var root = '[بتثجحخدذرزسشصضطظعغفقكلمنهويىأئإؤ]'

RegexQuirk('al',
    '^' +
    '(' + LAM + KASRA + '|' + BA + KASRA + '|' + WA + FATHA + '|' + KAF + FATHA + ')?' +
    '([' + ALIF_WITH_HAMZA_ABOVE + ALIF + ']' + FATHA + '?' + ')?' +
    '(?:' +
        '(?:' +
            '(' + LAM + SUKUN + '?' + ')?' +
            '(' + solar + SHADDA + ')' +
        ')' + '|' +
        '(' + LAM + SUKUN + '?' + root + ')' +
    ')' +
    '(.*' + root + '.*' + root + ')'

, function (match, particle, alif, lam, solar, moonPart, rest) {
    particle = particle || ''
    alif = alif || ALIF
    if (solar && !lam) {
        lam = LAM
    }
    lam = lam || ''
    solar = solar || ''
    moonPart = moonPart || ''
    return particle + alif + lam + solar + moonPart + rest
})



exports.quirks = function (opts) {
    opts = opts || {}
    var rules = []
    for (var key in quirks) {
        if (opts[key] !== false) {
            rules.push(quirks[key])
        }
    }
    return function (s) {
        for (var i = 0; i < rules.length; i++) {
            s = rules[i](s)
        }
        return s
    }
}

exports.diacritics = diacritics

exports.removeDiacritics = Replace('[' + diacritics + ']', '')

exports.splitWords = util.wordSplitter(new RegExp('[^' + wordChars + ']+', 'g'))

exports.wordCharsRegex = new RegExp('[' + wordChars + ']')