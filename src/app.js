var ui = require('point')
var T = require('arabic-translit')
var $ = require('jquery')


var config = new ui.Model

config.use(function () {
    try {
        var json = JSON.parse(localStorage.getItem('translit'))
    } catch (e) {}
    this.set(json || {
        enabled: true,
        quirks: true
    })
})

config.onset = function (key, val) {
    this.emit('before:settings')
    this._set(key, val)
    localStorage.setItem('translit', JSON.stringify(this))
    this.emit('settings')
}


var transliterate

function setup () {
    var cfg = config.toJSON() || {}
    transliterate = cfg.enabled ? T(cfg) : null
}

setup(); config.on('settings', setup)


var App = ui.View.extend()

App.prototype.attach(config)

App.prototype.point_translitEdit = function (el) {
    var prev

    $(el).on('keydown', function (evt) {
        if (evt.keyCode != 27) return // not Esc key
        transl()
    }).on('keypress', function (evt) {
        var c = String.fromCharCode(evt.charCode)
        if (!/[^\w`']/.test(c)) return
        transl()
    })

    config.on('before:settings', transl)

    function transl () {
        if (!transliterate) {
            prev = el.value
            return
        }
        var str = el.value
        var cursorPos = el.selectionEnd

        // mark cursor position with NULL character
        str = str.slice(0, cursorPos) + '\u0000' + str.slice(cursorPos)

        el.value = prev = transliterate(str, prev).replace(/\u0000/, function (_, offset) {
            cursorPos = offset
            return ''
        })
        el.selectionStart = el.selectionEnd = cursorPos
    }
}

$(function () {
    var app = new App
    app.el = document.body
    app.bind()
})