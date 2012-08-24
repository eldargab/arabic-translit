var Emitter = require('point').Emitter

exports.read = function (area) {
    try {
        return JSON.parse(localStorage.getItem(area))
    } catch (e) {
        return null
    }
}

exports.save = function (area, obj) {
    localStorage.setItem(area, JSON.stringify(obj))
}


var Map = exports.Map = Emitter.extend()

Map.prototype.del = function (key) {
    if (this._attr) {
        delete this._attr[key]
        this.emit('change')
    }
}

Map.prototype.forEach = function (cb, ctx) {
    ctx = ctx || this
    for (var key in this._attr) {
        var ret = cb.call(ctx, key, this._attr[key])
        if (ret === false) return
    }
}

Map.prototype.set = function (key, val) {
    this._attr = this._attr || {}
    this._attr[key] = val
    this.emit('change')
}

Map.prototype.get = function (key) {
    return this._attr && this._attr[key]
}

Map.prototype.reset = function (initials) {
    this._attr = initials
}

Map.prototype.toJSON = function () {
    return this._attr
}


exports.toggle = function (flag) {
    this['toggle' + flag[0].toUpperCase() + flag.slice(1)] = function () {
        this.set(flag, !this.get(flag))
    }
}
