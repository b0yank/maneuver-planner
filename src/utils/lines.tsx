import { Line } from "../models/line.model";

export const isPointInTriangle = (point: DOMPointReadOnly, vertixA: DOMPointReadOnly, vertixB: DOMPointReadOnly, vertixC: DOMPointReadOnly) => {

  const area3 = calculateTriangleArea(point, vertixA, vertixB);
  const area1 = calculateTriangleArea(point, vertixB, vertixC);
  const area2 = calculateTriangleArea(point, vertixC, vertixA);

  const hasNegative = (area1 < 0) || (area2 < 0) || (area3 < 0);
  const hasPositive = (area1 > 0) || (area2 > 0) || (area3 > 0);

  return !(hasNegative && hasPositive);
}

export const getClosestPointToLine = (line: Line, initialPoint: DOMPointReadOnly) => { // TODO Needs to work with infinite-length lines

  if (line.isVertical) {
    return new DOMPointReadOnly(line.pointA.x, initialPoint.y);
  }

  if (line.isHorizontal) {
    return new DOMPointReadOnly(initialPoint.x, line.pointA.y);
  }

  const { slope, intercept: lineIntercept } = line.equation;

  // mp = - 1 / m (slope of perpendicular)
  // bp = yp - mp * xp = yp + (xp / m)
  const perpendicularIntercept = initialPoint.y + initialPoint.x / slope;

  const intersectX = slope * (perpendicularIntercept - lineIntercept) / (slope ** 2 + 1);
  const intersectY = intersectX * slope + lineIntercept;

  return new DOMPointReadOnly(intersectX, intersectY);
}

const calculateTriangleArea = (pointA: DOMPointReadOnly, pointB: DOMPointReadOnly, pointC: DOMPointReadOnly) => {
  return ((pointA.x - pointC.x) * (pointB.y - pointC.y)) - ((pointB.x - pointC.x) * (pointA.y - pointC.y));
}