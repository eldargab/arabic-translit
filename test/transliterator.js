var T = require('../lib/transliterator')

describe('Transliterator', function () {
    it('ok', function () {
        var t = T(Object.create({
            '2': 'two',
            '2k': 'kk'
        }))
        t('k2kkk2').should.equal('kkkkktwo')
    })
})