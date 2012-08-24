var Point = require('point')
var $ = require('jquery')
var T = require('./translit')
var shortcuts = require('./shortcuts')

shortcuts.on('command', function (cmd) {
    if (typeof T[cmd] == 'function') T[cmd]()
})


var view = new Point.View

view.attach(T)


view.on('bind', function () {
    $(this.el).on('keyup', function (ev) {
        shortcuts.handle(ev)
    })
})


view.point_translitEdit = function (el) {
    var prev

    $(el).on('keydown', function (evt) {
        if (evt.keyCode != 27) return // not Esc key
        transl()
    }).on('keypress', function (evt) {
        var c = String.fromCharCode(evt.charCode)
        if (!/[^\w`']/.test(c)) return
        transl()
    })

    function transl () {
        var t = T()
        if (!t) {
            prev = el.value
            return
        }
        var str = el.value
        var cursorPos = el.selectionEnd

        // mark cursor position with NULL character
        str = str.slice(0, cursorPos) + '\u0000' + str.slice(cursorPos)

        el.value = prev = t(str, prev).replace(/\u0000/, function (_, offset) {
            cursorPos = offset
            return ''
        })
        el.selectionStart = el.selectionEnd = cursorPos
    }
}


$(function () {
    view.render(document.body)
})