var util = require('./util')

var shortcuts = module.exports = new util.Map

shortcuts.reset(util.read('shortcuts') || {
    'alt-shift-t': 'toggleEnabled',
    'alt-shift-q': 'toggleQuirks',
    'alt-shift-d': 'toggleDiacritics'
})

shortcuts.on('change', function () {
    util.save('shortcuts', this)
})

shortcuts.handle = function (e) {
    var keys = []
    e.altKey && keys.push('alt')
    e.ctrlKey && keys.push('ctrl')
    e.shiftKey && keys.push('shift')
    var keyCode = e.charCode || e.keyCode
    var key = keyCode && String.fromCharCode(keyCode)
    key && keys.push(key)
    var command = this.get(keys.join('-').toLowerCase())
    this.emit('command', command)
}
