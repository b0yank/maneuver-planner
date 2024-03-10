export const getDistanceBetweenPoints = (pointA: DOMPointReadOnly, pointB: DOMPointReadOnly) => {
    return Math.sqrt((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2)
}

export const getAngleBetweenPoints = (startPoint: DOMPointReadOnly, endPoint: DOMPointReadOnly) => {

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