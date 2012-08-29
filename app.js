/*!
 * Require function by TJ Holowaychuk <tj@learnboost.com>
 */

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(p, parent){
  var path = require.resolve(p)
    , mod = require.modules[path];
  if (!mod) {
    parent = parent || 'root'
    throw new Error('failed to require "' + p + '" from ' + parent);
  }
  if (!mod.exports) {
    mod.exports = {};
    mod.call(mod.exports, mod, mod.exports, require.relative(path));
  }
  return mod.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Resolve `path`.
 *
 * @param {String} path
 * @return {Object} module
 * @api public
 */

require.resolve = function(path){
  var orig = path
    , reg = path + '.js'
    , index = path + '/index'
    , indexjs = index + '.js';
  return require.modules[orig] && orig
    || require.modules[index] && index
    || require.modules[reg] && reg
    || require.modules[indexjs] && indexjs
    || orig;
};

/**
 * Register module at `path` with callback `fn`.
 *
 * @param {String} path
 * @param {Function} fn
 * @api public
 */

require.register = function(path, fn){
  require.modules[path] = fn;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  return function(p){
    if ('.' != p.charAt(0)) return require(p);

    var path = parent.split('/')
      , segs = p.split('/');
    path.pop();

    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i];
      if ('..' == seg) path.pop();
      else if ('.' != seg) path.push(seg);
    }

    return require(path.join('/'), parent);
  };
};

require.register("point/index", function(module, exports, require) {
var util = require('./util')

exports.extend = util.extend

exports.Emitter = require('./emitter')

exports.Model = require('./model')

exports.View = require('./view/view')

exports.filters = require('./view/filters')

exports.endpoint = util.endpoint

exports.mixin = util.mixin

exports.thisFn = util.thisFn

exports.use = util.use

})
require.register("point/util", function(module, exports, require) {
var uid = 0

exports.guid = function (obj) {
    if (obj.__uid) return obj.__uid
    return obj.__uid = ++uid
}

exports.mix = function (target, src) {
    for (var key in src) {
        target[key] = src[key]
    }
    return target
}

exports.extend = function (Klass, parent) {
    if (parent && parent.prototype) {
        Klass.prototype = Object.create(parent.prototype)
    } else if (arguments.length > 1) {
        Klass.prototype = Object.create(parent)
    }
    Klass.use = function () {
        exports.use.apply(this.prototype, arguments)
        return this
    }
    Klass.extend = function (ChildKlass) {
        ChildKlass = ChildKlass || function () {}
        return exports.extend(ChildKlass, this)
    }
    return Klass
}

exports.use = function use (proto) {
    switch (typeof proto) {
        case 'function':
            var protoHasEnumerables = false
            for (var key in proto.prototype) {
                this[key] = proto.prototype[key]
                protoHasEnumerables = true
            }
            if (!protoHasEnumerables)
                proto.apply(this, Array.prototype.slice.call(arguments, 1))
            break
        case 'string':
            proto = exports.mixin(proto)
            use.apply(this, arguments)
            break
        default:
            for (var key in proto) {
                this[key] = proto[key]
            }
    }
    return this
}

exports.mixin = function (name) {
    return require('./mixin/' + name)
}

exports.thisFn = function (ctx, prop) {
    var key = '_' + prop
    if (ctx[key]) return ctx[key]
    return ctx[key] = function () {
        ctx[prop].apply(ctx, arguments)
    }
}

var eCache = {}

exports.endpoint = function (type) {
    if (eCache[type] !== undefined) return eCache[type]
    try {
        return eCache[type] = require('./endpoints/' + type)
    } catch (e) {
        return eCache[type] = null
    }
}


exports.traverse = function traverse (el, cb) {
    var child = el.firstChild
    while (child) {
        if (child.nodeType === 1) {
            if (cb.call(this, child) !== false) traverse.call(this, child, cb)
        }
        child = child.nextSibling
    }
}

})
require.register("point/mixin/collection", function(module, exports, require) {
var guid = require('../util').guid

var proto = exports

proto.add = function (obj) {
    var objects = this._objects || (this._objects = {})
    objects[guid(obj)] = obj
    this.length++
    this.emit('add', obj)
    this.emit('change:length')
    return this
}

proto.remove = function (obj) {
    if (!this._objects) return
    var id = guid(obj)
    if (!this._objects[id]) return
    delete this._objects[id]
    this.length--
    this.emit('remove', obj)
    this.emit('change:length')
    return this
}

proto.forEach = function (cb, ctx) {
    ctx = ctx || this
    for (var key in this._objects) {
        cb.call(ctx, this._objects[key])
    }
    return this
}

proto.onget_length = function () {
    return this.length
}

proto.length = 0
})
require.register("point/mixin/computable", function(module, exports, require) {

module.exports = function (name, deps, fn) {
    var change = 'change:' + name
    var scheduled = '__computable_change_scheduled_' + name
    var cache = '__computable_value_' + name

    this['onget_' + name] = function () {
        if (this[cache] !== undefined) return this[cache]
        return this[cache] = fn.call(this)
    }

    deps.forEach(function (dep) {
        this.on(dep, function () {
            this[cache] = undefined
            if (this[scheduled]) return
            this[scheduled] = true
            var self = this
            setTimeout(function () {
                self[scheduled] = false
                self.emit(change)
            })
        })
    }, this)
}
})
require.register("point/mixin/subobject", function(module, exports, require) {
module.exports = function (prop, Klass) {
    var child = '__subobject_' + prop
    var proto = Klass.prototype || Klass

    this[prop] = function () {
        var o = this[child]
        if (!o) {
            o = this[child] = Object.create(proto, {__ui_parent: {value: this}})
            this.emit('subobject:' + prop, o, prop)

        } else if (o.__ui_parent !== this) {
            o = this[child] = Object.create(o, {__ui_parent: {value: this}})
        }
        return o
    }

    this.on('json', function (json) {
        var j = this[prop]().toJSON()
        if (j !== undefined) json[prop] = j
    })

    this.on('_reset_', function (attr) {
        var initials = attr && attr[prop]
        if (initials) delete attr[prop]
        this[prop]().reset(initials)
    })

    this['onget_' + prop] = function () {
        return this[prop]()
    }

    this['onset_' + prop] = function (val) {
        this[prop]().set(val)
    }
}

})
require.register("point/model", function(module, exports, require) {
var Emitter = require('./emitter')

module.exports = Model

function Model () {}

Emitter.extend(Model)

Model.prototype.get = function (attr) {
    var getter = this['onget_' + attr]
    return getter ? getter.call(this, attr) : this.onget(attr)
}

Model.prototype.onget = function (attr) {
    return this._attr && this._attr[attr]
}

Model.prototype.set = function (attr, val) {
    if (typeof attr == 'string') {
        this.__setAttr(attr, val)
    } else {
        for (var key in attr) {
            this.__setAttr(key, attr[key])
        }
    }
}

Model.prototype.__setAttr = function (attr, val) {
    var setter = this['onset_' + attr]
    setter ? setter.call(this, val, attr) : this.onset(attr, val)
}

Model.prototype.onset = function (attr, val) {
    this._set(attr, val)
}

Model.prototype._set = function (attr, val) {
    this._thisAttributes()[attr] = val
    this.emit('change', attr)
    this.emit('change:' + attr, attr)
}

Model.prototype.toJSON = function () {
    var json = {}
    for (var key in this._attr) {
        json[key] = this._attr[key]
    }
    this.emit('json', json)
    return json
}

Model.prototype.reset = function (initials) {
    delete this._attr
    if (initials) {
        var a = this._thisAttributes()
        for (var key in initials) {
            a[key] = initials[key]
        }
    }
    this.emit('_reset_', this._attr)
    this.emit('reset')
}

Model.prototype._thisAttributes = function () {
    if (!this._attr) return this._attr = Object.create(null, {__ui_proto: {value: this}})
    if (this._attr.__ui_proto === this) return this._attr
    return this._attr = Object.create(this._attr, {__ui_proto: {value: this}})
}
})
require.register("point/endpoints/foreach", function(module, exports, require) {
var thisFn = require('../util').thisFn

module.exports = ForEach

function ForEach (el) {
    this.el = el
    if (this.template = this.el.firstElementChild) {
        this.el.removeChild(this.template)
    }
    this.views = []
    this.models = []
}

ForEach.prototype.attach = function (col) {
    if (this.col) this.detach()
    this.col = col
    this.col.on('add', thisFn(this, 'add'))
    this.col.on('remove', thisFn(this, 'remove'))
}

ForEach.prototype.detach = function () {
    this.col.off('add', this._add)
    this.col.off('remove', this._remove)
    this.col = null
    this.views.forEach(function (view) {
        view.destroy()
    })
    this.views = []
    this.models = []
}

ForEach.prototype.add = function (obj) {
    var view = new this.ItemView
    if (this.template) view.html = this.template
    view.attach(obj)
    view.render()
    this.views.push(view)
    this.models.push(obj)
    this.el.appendChild(view.el)
    this.resort()
}

ForEach.prototype.remove = function (obj) {
    var index = this.findItem(obj)
    var view = this.views.splice(index, 1)[0]
    view.destroy()
    this.models.splice(index, 1)
}

ForEach.prototype.findItem = function (obj) {
    for (var i = 0; i < this.models.length; i++) {
        if (this.models[i] === obj) return i
    }
    throw new Error('Attempt to remove uncontained object')
}

ForEach.prototype.sort = function (compare) {
    if (typeof compare != 'function')
        throw new Error('You must pass a compare function')
    this.compare = compare
    this.resort()
}

ForEach.prototype.resort = function () {
    if (!this.compare) return
    this.models.sort(this.compare).forEach(function (obj, i) {
        var view = this.views[i]
        if (view.model === obj) return
        view.detach()
        view.attach(obj)
    }, this)
}
})
require.register("point/endpoints/html", function(module, exports, require) {
module.exports = Html

function Html (el) {
    this.el = el
}

Html.prototype.get = function () {
    return this.el.innerHTML
}

Html.prototype.set = function (html) {
    this.el.innerHTML = html
}
})
require.register("point/endpoints/value", function(module, exports, require) {
var $ = require('jquery')

module.exports = Value

function Value (el) {
    this.$el = $(el)
    this.type = el.type

    var self = this

    this.$el.on('change', function () {
        self._onchange && self._onchange()
    })
}

Value.prototype.get = function () {
    return this.type == 'checkbox' || this.type == 'radio'
        ? this.$el[0].checked
        : this.$el.val()
}

Value.prototype.set = function (val) {
    this.type == 'checkbox' || this.type == 'radio'
        ? this.$el[0].checked = !!val
        : this.$el.val(val)
}

Value.prototype.onchange = function (cb) {
    this._onchange = cb
}

})
require.register("point/endpoints/css", function(module, exports, require) {
var $ = require('jquery')

module.exports = Css

function Css (el, klass) {
    this.$el = $(el)
    this.klass = klass
}

Css.prototype.get = function () {
    return this.$el.hasClass(this.klass)
}

Css.prototype.set = function (val) {
    this.$el.toggleClass(this.klass, !!val)
}
})
require.register("point/endpoints/text", function(module, exports, require) {
var $ = require('jquery')

module.exports = Text

function Text (el) {
    this.$el = $(el)
}

Text.prototype.get = function () {
    return this.$el.text()
}

Text.prototype.set = function (val) {
    return this.$el.text(val == null ? '' : String(val))
}

})
require.register("point/endpoints/event", function(module, exports, require) {
var $ = require('jquery')

module.exports = Event

function Event (el, name) {
    this.$el = $(el)
    var self = this
    this.$el.on(name, function (e) {
        self.stop = false
        self.hooks && self.hooks.forEach(function (hook) {
            !self.stop && hook.call(this, e)
        }, self)
    })
}

Event.prototype.onevent = function (cb) {
    if (!this.hooks) this.hooks = []
    this.hooks.push(cb)
}
})
require.register("point/endpoints/attr", function(module, exports, require) {
module.exports = Attr

function Attr (el, name) {
    this.el = el
    this.name = name
}

Attr.prototype.set = function (val) {
    val != null ? this.el.setAttribute(this.name, val) : this.el.removeAttribute(this.name)
}

Attr.prototype.get = function () {
    return this.el.getAttribute(this.name)
}
})
require.register("point/endpoints/cssValue", function(module, exports, require) {
var $ = require('jquery')

module.exports = CssValue

function CssValue (el, initialValue) {
    this.$el = $(el)
    this.prev = initialValue
}

CssValue.prototype.set = function (val) {
    if (this.prev) this.$el.removeClass(this.prev)
    this.$el.addClass(val)
    this.prev = val
}

CssValue.prototype.get = function () {
    return this.prev
}
})
require.register("point/view/view", function(module, exports, require) {
var parse = require('./data-bind-syntax')
var filters = require('./filters')
var Model = require('../model')
var util = require('../util')


module.exports = View

function View () {}

Model.extend(View)

View.prototype.attach = function (p, model) {
    if (typeof p != 'string') {
        model = p
        p = ''
    }
    this['model' + p] = model
    this.emit('attach' + p, model)
}

View.prototype.detach = function (p) {
    p = p || ''
    var model = 'model' + p
    this.emit('detach' + p, this[model])
    this[model] = undefined
}

View.prototype.getModel = function (p) {
    if (p == 'self') return this
    return p ? this['model' + p] : this.model
}

View.prototype.clearDom = function () {
    var p = this.el && this.el.parentNode
    p && p.removeChild(this.el)
}

View.prototype.destroy = function () {
    this.clearDom()
    this.emit('destroy')
}

View.prototype.render = function (el) {
    this.el = el || this.html.cloneNode(true)
    this.emit('bind')
}

View.prototype.on('bind', function () {
    if (this.procElementPoints(this.el) === false) return
    util.traverse.call(this, this.el, this.procElementPoints)
})

View.prototype.procElementPoints = function (el) {
    var points = el.getAttribute('data-bind'); if (!points) return

    var self = this, cont

    parse(points, function (type, param, path, filters) {
        var p = self.point(type, param, el)
        if (!p) return
        for (var i = 0; i < filters.length; i++) {
            p = self.filter(filters[i], p)
        }
        if (p.stopTraversal) cont = false
        self.bind(p, type, path)
    })
    return cont
}

View.prototype.point = function (type, param, el) {
    var create = this['point_' + type]
    if (create) return create.call(this, el, param)
    var Type = util.endpoint(type)
    return Type && (new Type(el, param))
}

View.prototype.filter = function (type, point) {
    var filter = this['filter_' + type] || filters[type]
    return filter ? filter(point) : point
}

View.prototype.bind = function (point, type, path) {
    var bind = this['bind_' + type + '_at_' + path]
    if (bind) {
        bind.call(this, point, type, path)
        return
    }

    bind = this['bind_' + type]
    if (bind) {
        bind.call(this, point, path)
        return
    }

    bind = this['bind_at_' + path]
    if (bind) {
        bind.call(this, point, type, path)
        return
    }

    this.bindPoint(point, path)
}

View.prototype.bindPoint = function (point, path) {
    if (!point.set) return
    var p = this.parsePath(path)
    var self = this

    point.onchange && point.onchange(function push () {
        var m = self.getModel(p.model)
        m && m.set(p.attr, point.get())
    })

    function pull () {
        var m = self.getModel(p.model)
        point.set(m && m.get(p.attr))
    }

    this.onmodel(p.model, 'change:' + p.attr, pull)
    this.onmodel(p.model, 'reset', pull)
    p.model != 'self' && this.on('attach' + p.model, pull)
    pull()
}

View.prototype.onmodel = function (p, event, fn) {
    if (typeof event != 'string') {
        fn = event
        event = p
        p = ''
    }

    if (p == 'self') return this.on(event, fn)

    fn && this.on('model' + p + ':' + event, fn)

    var getListener = '_get_onmodel_' + p

    if (this[getListener]) return

    this[getListener] = function () {
        var self = this
        var listener = '_onmodel_' + p

        if (this[listener]) return this[listener]

        return this[listener] = function (ev) {
            ev = 'model' + p + ':' + ev
            self.emit.apply(self, arguments)
        }
    }

    this.on('attach' + p, function (m) {
        m.onevent(this[getListener]())
    })

    this.on('detach' + p, function (m) {
        m.offevent(this[getListener]())
    })

    this.getModel(p) && this.getModel(p).onevent(this[getListener]())
}


View.prototype.parsePath = function (path) {
    var m = /((.*)\.)?([^\.]+)$/.exec(path)
    return new Path(m[2] || '', m[3])
}

function Path (model, attr) {
    this.model = model
    this.attr = attr
}


View.prototype.bind_event = function (point, path) {
    var self = this
    point.onevent(function (e) {
        self.emit('domevent', path, e)
    })
}

View.prototype.on('domevent', function (path, e) {
    var p = this.parsePath(path)
    var m = this.getModel(p.model)
    m && m[p.attr] && m[p.attr].call(m)
})

})
require.register("point/view/filters", function(module, exports, require) {

exports.not = function (point) {
    var get = point.get
    var set = point.set

    point.get = function () {
        return !get.call(this)
    }

    point.set = function (val) {
        set.call(this, !val)
    }

    return point
}


exports.stop = function (eventPoint) {
    eventPoint.onevent(stop)
    return eventPoint
}

function stop (e) {
    e.preventDefault()
    e.stopPropagation()
}
})
require.register("point/view/data-bind-syntax", function(module, exports, require) {
module.exports = function parse (attr, onpoint) {
    attr.split(/,/g).forEach(function (binding) {
        var b = binding.split(/:/g)
        var path = b[1] && b[1].trim() || ''
        var p = b[0].split(/\|/g)
        var m = /([^\-]*)(?:\-(.*))?/.exec(p[0].trim())
        var type = m[1]
        var param = m[2]
        if (param) param = param.trim()
        var filters = p.slice(1).map(function (s) { return s.trim() })
        onpoint(type, param, path, filters)
    })
}
})
require.register("point/emitter", function(module, exports, require) {
var util = require('./util')
var guid = util.guid

module.exports = Emitter

function Emitter () {}

Emitter.extend = function (Klass) {
    Klass = Klass || function () {}
    return util.extend(Klass, this)
}

Emitter.prototype.on = function (event, handler) {
    var h = this._createHandlers(event)
    h[guid(handler)] = handler
    return this
}

Emitter.prototype._createHandlers = function (event) {
    var key = '__event_' + event
    var h = this[key]
    if (!h) return this[key] = Object.create(null, {__evt_proto: {value: this}})
    if (h.__evt_proto === this) return h
    return this[key] = Object.create(this[key], {__evt_proto: {value: this}})
}

Emitter.prototype.off = function (event, handler) {
    delete this._createHandlers(event)[guid(handler)]
    return this
}

Emitter.prototype.onevent = function (handler) {
    return this.on('__ev__', handler)
}

Emitter.prototype.offevent = function (handler) {
    return this.off('__ev__', handler)
}

Emitter.prototype.emit = function (event, var_args) {
    if (this.__event___ev__) {
        for (var k in this.__event___ev__) {
            this.__event___ev__[k].apply(this, arguments)
        }
    }
    var handlers = this['__event_' + event]
    if (!handlers) return
    var args = Array.prototype.slice.call(arguments, 1)
    for (var key in handlers) {
        this.event = event
        handlers[key].apply(this, args)
    }
}

Emitter.prototype.setListener = function (event, handler) {
    this['__event_' + event] = null
    handler && this.on(event, handler)
    return this
}

Emitter.prototype.use = util.use
})
require.register("arabic-translit/index", function(module, exports, require) {
var util = require('./util')
var getAdditions = require('./diff').additions
var Transliterator = require('./transliterator')
var symbols = require('./symbols-map')
var arabic = require('./arabic')

module.exports = function (opts) {
    opts = opts || {}
    var map = util.mix(Object.create(symbols), opts.map)
    var t = Transliterator(map)
    var quirks = opts.quirks === false ? null : arabic.quirks()

    return function (str, prev) {
        var i = getAdditions(str, prev || '')
        i = i.replace(t)
        if (quirks) {
            i = i.expand(arabic.wordCharsRegex).replace(function (s) {
                return arabic.splitWords(s).replace(quirks).str
            })
        }
        if (opts.diacritics === false) i = i.replace(arabic.removeDiacritics)
        return i.str
    }
}

module.exports.simple = Transliterator(symbols)

module.exports.Transliterator = Transliterator

module.exports.symbols = util.mix({}, symbols)

module.exports.arabic = arabic
})
require.register("arabic-translit/util", function(module, exports, require) {
function Interval (start, end) {
    this.start = start
    this.end = end
}

function Intervals (str, intervals) {
    intervals.str = str

    intervals.sort(function (a, b) {
        return a.start - b.start
    })

    intervals.replace = function (cb) {
        var _cb = typeof cb == 'function' ? cb : function () {
            return cb
        }
        var str = ''
        var shift = 0
        var offset = 0

        var _intervals = this.map(function (i) {
            var prev = this.str.slice(i.start, i.end)
            var curr = _cb(prev)

            str += this.str.slice(offset, i.start)
            str += curr
            offset = i.end

            var start = i.start + shift
            shift += curr.length - prev.length
            return new Interval(start, start + curr.length)
        }, this)

        str += this.str.slice(offset, this.str.length)

        return Intervals(str, _intervals)
    }

    intervals.strings = function () {
        return this.map(function (i) {
            return this.str.slice(i.start, i.end)
        }, this)
    }

    intervals.expand = function (regex) {
        var prev
        return Intervals(this.str, this.filter(function (i) {
            var start = i.start
            while (start >= 0 && regex.test(this.str[start])) {
                i.start = start
                start--
            }

            var end = i.end
            while (end <= this.str.length && regex.test(this.str[end-1])) {
                i.end = end
                end++
            }
            var overlapsWithPrev = prev && (
                (i.start >= prev.start && i.start < prev.end) || (prev.start >= i.start && prev.start < i.end)
            )
            if (overlapsWithPrev) {
                prev.start = Math.min(prev.start, i.start)
                prev.end = Math.max(prev.end, i.end)
                return false
            } else {
                prev = i
                return true
            }
        }, this))
    }

    return intervals
}

exports.Interval = Interval
exports.Intervals = Intervals


exports.wordSplitter = function (separator) {
    return function (str) {
        var words = []
        var match, start = 0
        while (match = separator.exec(str)) {
            start < match.index && words.push(new Interval(start, match.index, str))
            start = separator.lastIndex
        }
        start < str.length && words.push(new Interval(start, str.length, str))
        return exports.Intervals(str, words)
    }
}


exports.mix = function (target, src) {
    for (var key in src) {
        target[key] = src[key]
    }
    return target
}
})
require.register("arabic-translit/diff", function(module, exports, require) {
var Interval = require('./util').Interval
var Intervals = require('./util').Intervals

function LcsElement (i, ii, prev) {
    this.i = i
    this.ii = ii
    this.length = 1
    if (this.prev = prev) {
        this.length += prev.length
    }
}

function LCS (seq1, seq2) {
    var tails = new Array(seq2.length)
    var prev, t

    for (var i = 0; i < seq1.length; i++) {
        for (var ii = 0; ii < seq2.length; ii++) {
            t = seq1[i] == seq2[ii] ? new LcsElement(i, ii, prev) : null
            if (tails[ii]) {
                prev = !prev || prev.length < tails[ii].length ? tails[ii] : prev
                if (t && t.length > tails[ii].length) tails[ii] = t
            } else {
                tails[ii] = t
            }
        }
    }

    return tails.reduce(function (prev, current) {
        if (!current) return prev
        return prev && (prev.length > current.length)
            ? prev
            : current
    })
}

function commonHead (seq1, seq2) {
    for (var i = 0; i < Math.min(seq1.length, seq2.length); i++) {
        if (seq1[i] != seq2[i]) return i
    }
    return i
}

function commonTail (seq1, seq2) {
    var l1 = seq1.length - 1
    var l2 = seq2.length - 1
    var count = 0

    while (l1 >= 0 && l2 >= 0) {
        if (seq1[l1] != seq2[l2]) return count
        l1--
        l2--
        count++
    }
    return count
}


function additions (curr, prev) {
    var head = commonHead(prev, curr)
    var current = curr
    prev = prev.slice(head)
    curr = curr.slice(head)
    if (curr.length == 0) return []
    if (prev.length == 0) return [new Interval(head, head + curr.length)]

    var tail = commonTail(prev, curr)
    prev = prev.slice(0, prev.length - tail)
    curr = curr.slice(0, curr.length - tail)
    if (curr.length == 0) return []
    if (prev.length == 0) return [new Interval(head, head + curr.length)]

    var ret = []
    var last = LCS(prev, curr)
    var end = curr.length
    while (last) {
        if (last.ii + 1 < end)
            ret.push(new Interval(head + last.ii + 1, head + end))
        end = last.ii
        last = last.prev
    }
    if (end > 0)
        ret.push(new Interval(head, head + end))

    return ret
}

exports.additions = function (curr, prev) {
    return Intervals(curr, additions(curr, prev))
}
})
require.register("arabic-translit/transliterator", function(module, exports, require) {
module.exports = function (map) {
    var keys = getKeys(map).sort(function (a, b) {
        return b.length - a.length
    })

    function matchKey (str, offset) {
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i]
            if (str.slice(offset, offset + key.length) == key) return key
        }
    }

    return function transliterate (str) {
        var out = ''
        var i = 0
        var l = str.length

        while (i < l) {
            var key = matchKey(str, i)
            if (key) {
                out += map[key]
                i += key.length
            } else {
                out += str[i]
                i++
            }
        }
        return out
    }
}

function getKeys (obj) {
    var keys = []
    for (var key in obj) {
        keys.push(key)
    }
    return keys
}
})
require.register("arabic-translit/symbols-map", function(module, exports, require) {
module.exports = {
    "'": '\u0621',
    'Aa': '\u0622',
    "'A": '\u0623',
    "'w": '\u0624',
    'I': '\u0625',
    "'y": '\u0626',
    'A': '\u0627',
    'b': '\u0628',
    'a`': '\u0629',
    'a`t': '\u0629',
    't': '\u062A',
    'th': '\u062B',
    'j': '\u062C',
    'H': '\u062D',
    'kh': '\u062E',
    'd': '\u062F',
    'dh': '\u0630',
    'r': '\u0631',
    'z': '\u0632',
    's': '\u0633',
    'sh': '\u0634',
    'S': '\u0635',
    'D': '\u0636',
    'T': '\u0637',
    'TH': '\u0638',
    'x': '\u0639',
    'gh': '\u063A',
    'f': '\u0641',
    'q': '\u0642',
    'k': '\u0643',
    'l': '\u0644',
    'm': '\u0645',
    'n': '\u0646',
    'h': '\u0647',
    'w': '\u0648',
    'AA': '\u0649',
    'y': '\u064A',
    'A`n': '\u064B',
    'u`n': '\u064C',
    'i`n': '\u064D',
    'a': '\u064E',
    'u': '\u064F',
    'i': '\u0650',
    '``': '\u0651',
    '`': '\u0652'
}
})
require.register("arabic-translit/arabic", function(module, exports, require) {
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
})
require.register("app/index", function(module, exports, require) {
var Point = require('point')
var $ = require('jquery')
var T = require('./translit')
var shortcuts = require('./shortcuts')

var view = new Point.View

view.attach('translit', T)
view.attach('tips', require('./tips'))

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
})
require.register("app/util", function(module, exports, require) {

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

})
require.register("app/translit", function(module, exports, require) {
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
})
require.register("app/shortcuts", function(module, exports, require) {
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

})
require.register("app/tips/index", function(module, exports, require) {
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
})
require.register("app/tips/template", function(module, exports, require) {
var arabic = require('arabic-translit').arabic
var diacritics = new RegExp('^[' + arabic.diacritics + ']$')

module.exports = function template (map) {
    var blockSize = 20
    var help = new HelpTable(map).toArray()
    var html = '<table><tbody>'
    var block = 0
    for (var i = 0, block = 0; i < help.length; i++, block++) {
        if (block == blockSize) {
            block = 0
            if (i < help.length - 1) html += '</tbody><tbody>'
        }
        html += '<tr>'
        html += '<td class="arabic">' + help[i].arabic + '</td>'
        html += '<td class="translit">' + help[i].translit + '</td>'
        html += '</tr>'
    }
    return html + '</tbody></table>'
}

function HelpTable (map) {
    this.table = {}
    this.map = map
    this.generate()
}

HelpTable.prototype.generate = function () {
    this.forEachSymbol(function (s, ar) {
        ar = this.normalize(ar)
        var item = this.table[ar]
        if (!item) {
            this.table[ar] = {
                arabic: ar,
                translit: s
            }
        } else {
            item.translit += ', ' + s
        }
    })
}

HelpTable.prototype.forEachSymbol = function (cb) {
    for (var key in this.map) {
        cb.call(this, key, this.map[key])
    }
}

HelpTable.prototype.normalize = function (ar) {
    return diacritics.test(ar)
        ? ar + '-'
        : ar
}

HelpTable.prototype.toArray = function () {
    var arr = []
    for (var key in this.table) {
        arr.push(this.table[key])
    }
    return arr.sort(function (a, b) {
        return a.arabic.localeCompare(b.arabic)
    })
}

})

require.register("jquery", function (module) { module.exports = $})
require("app")