var shortcuts = module.exports = {}

shortcuts.map = {
    'alt-shift-t': 'toggle-enabled',
    'alt-shift-q': 'toggle-quirks',
    'alt-shift-d': 'toggle-diacritics',
    'alt-shift-h': 'toggle-tips'
}

shortcuts.commands = {}

shortcuts.command = function (name, fn) {
    this.commands[name] = fn
}

shortcuts.handle = function (e) {
    var keys = []
    e.altKey && keys.push('alt')
    e.ctrlKey && keys.push('ctrl')
    e.shiftKey && keys.push('shift')
    var keyCode = e.charCode || e.keyCode
    var key = keyCode && String.fromCharCode(keyCode)
    key && keys.push(key)
    var cmd = this.map[keys.join('-').toLowerCase()]
    if (cmd) {
        this.commands[cmd]()
        e.stopPropagation()
        e.preventDefault()
    }
}
