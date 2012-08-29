var map = require('arabic-translit').symbols
var util = require('../util')
var shortcuts = require('../shortcuts')
var Point = require('point')
var $ = require('jquery')
var template = require('./template')

var model = module.exports = new Point.Model

model.reset(util.read('tips') || {
    hide: false
})

model.on('change', function () {
    util.save('tips', this)
})

shortcuts.command('toggle-tips', function () {
    model.set('hide', !model.get('hide'))
})

var view = new Point.View

view.html = $('<div id="tips" data-bind="css-hide:hide">' + template(map) + '</div>')[0]
view.attach(model)
view.render()

$(function () {
    document.body.appendChild(view.el)
})