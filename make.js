require('shelljs/global')
require('shelljs/make')

target.build = function () {
    target.html()
    target.css()
    target.js()
}

target.html = function () {
    var src = 'src/index.jade'
    require('jade').render(cat(src), {
        filename: src
    }, function (err, html) {
        if (err) error(err)
        html.to('index.html')
    })
}

target.css = function () {
    var src = 'src/style.stylus'
    require('stylus')(cat(src))
        .set('filename', src)
        .use(require('nib')())
        .render(function (err, css) {
            if (err) error(err)
            css.to('style.css')
        })
}

target.js = function () {
    require('exposer').Bundle('app.js', function () {
        this.add('node_modules/point', 'lib', {as: 'point'})
        this.add('node_modules/arabic-translit', 'lib', {as: 'arabic-translit'})
        this.add('src', '.', {as: 'app'})
        this.includeRequire()
        this.append('require.register("jquery", function (module) { module.exports = $})')
        this.append('require("app")')
    })
}


function error (msg) {
    msg && console.error(msg)
    exit(1)
}