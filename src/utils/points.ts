const getDistanceBetweenPoints = (pointA: DOMPointReadOnly, pointB: DOMPointReadOnly) => {
    return Math.sqrt((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2)
}

const getAngleBetweenPoints = (startPoint: DOMPointReadOnly, endPoint: DOMPointReadOnly) => {

    if (startPoint.x === endPoint.x) {
        return startPoint.y <= endPoint.y ? 0 : 180;
    }

    if (startPoint.y === endPoint.y) {
        return startPoint.x < endPoint.x ? 270 : 90;
    }

    const angleRadians = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
    const angleDegrees = angleRadians * 180 / Math.PI;
    
    const angleCanvasCoordinates = (angleDegrees + 270) % 360;

    return angleCanvasCoordinates;
}

const getRotatedPoint = (pointToRotate: DOMPointReadOnly, rotationOrigin: DOMPointReadOnly, angle: number) => {

    const diffPoint = new DOMPointReadOnly(pointToRotate.x - rotationOrigin.x, pointToRotate.y - rotationOrigin.y);
    const rotationMatrix = new DOMMatrix(` rotateZ(${angle}deg)`);

    const rotatedDiffPoint = diffPoint.matrixTransform(rotationMatrix);
    return new DOMPointReadOnly(rotatedDiffPoint.x + rotationOrigin.x, rotatedDiffPoint.y + rotationOrigin.y);
}

export {
    getDistanceBetweenPoints,
    getAngleBetweenPoints,
    getRotatedPoint
}