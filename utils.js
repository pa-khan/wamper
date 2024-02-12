"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hash = void 0;
var ranges = [
    [48, 57],
    [65, 90],
    [97, 122],
];
function random(range) {
    var minCeiled = Math.ceil(range[0]);
    var maxFloored = Math.floor(range[1]);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}
function hash(length) {
    if (length === void 0) { length = 16; }
    var hash = '';
    for (var i = 0; i < length; i++) {
        var type = random([1, ranges.length - 1]);
        hash += String.fromCharCode(random(ranges[type]));
    }
    return hash;
}
exports.hash = hash;
