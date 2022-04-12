"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.distance = distance;
exports.inAngleRanges = inAngleRanges;
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(Math.abs(x2 - x1), 2) + Math.pow(Math.abs(y2 - y1), 2));
}
function inAngleRanges(x1, y1, x2, y2, angleRanges) {
    if (!angleRanges) {
        return false;
    }
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI + 180;
    for(let i = 0; i < angleRanges.length; ++i){
        const ar = angleRanges[i];
        if (ar && (ar.start == null || angle >= ar.start) && (ar.end == null || angle <= ar.end)) {
            return true;
        }
    }
    return false;
}

//# sourceMappingURL=math.js.map