var T = require('arabic-translit')
var Point = require('point')
var util = require('./util')

var config = module.exports = function () {
    return config.get('transliterate')
}

Point.use.call(config, Point.Model)

config.use('subobject', 'mappings', util.Map)

config.reset(util.read('translit') || {
    enabled: true,
    quirks: true,
    diacritics: true
})

config.save = function () {
    util.save('translit', this)
}

config.onevent(function (ev) {
    if (!~ev.indexOf('change:')) return
    config.save()
    config.emit('change')
})

config.mappings().on('change', function () {
    config.save()
    config.emit('change')
})

config.use('computable', 'transliterate', ['change'], function () {
    if (!this.get('enabled')) return null
    return T(this.toJSON())
})

config
.use(util.toggle, 'enabled')
.use(util.toggle, 'quirks')
.use(util.toggle, 'diacritics')
