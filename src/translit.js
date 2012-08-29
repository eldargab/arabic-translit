var T = require('arabic-translit')
var Point = require('point')
var util = require('./util')
var shortcuts = require('./shortcuts')

var config = module.exports = function () {
    return config.get('transliterate')
}

Point.use.call(config, Point.Model)

config.reset(util.read('translit') || {
    enabled: true,
    quirks: true,
    diacritics: true
})

config.on('change', function () {
    util.save('translit', this)
})

config.use('computable', 'transliterate', ['change'], function () {
    if (!this.get('enabled')) return null
    return T(this.toJSON())
})

registerToggleCommand('enabled')
registerToggleCommand('quirks')
registerToggleCommand('diacritics')

function registerToggleCommand (attr) {
    shortcuts.command('toggle-' + attr, function () {
        config.set(attr, !config.get(attr))
    })
}