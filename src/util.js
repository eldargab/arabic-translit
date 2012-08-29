
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
