export class Matrix3x3 {

    constructor(private readonly matrixArray: [[number, number, number], [number, number, number], [number, number, number]]) {

    }

    static get eye(): Matrix3x3 {
        return new Matrix3x3([
            [1, 0 , 0],
            [0, 1, 0],
            [0, 0, 1]
        ])
    }

    get matrix() {
        return this.matrixArray;
    }

    dot(other: Matrix3x3): Matrix3x3 {
        
        const A = this.matrix;
        const B = other.matrix;

        return new Matrix3x3([
            [A[0][0]*B[0][0] + A[0][1]*B[1][0] + A[0][2]*B[2][0], A[0][0]*B[0][1] + A[0][1]*B[1][1] + A[0][2]*B[2][1], A[0][0]*B[0][2] + A[0][1]*B[1][2] + A[0][2]*B[2][2]],
            [A[1][0]*B[0][0] + A[1][1]*B[1][0] + A[1][2]*B[2][0], A[1][0]*B[0][1] + A[1][1]*B[1][1] + A[1][2]*B[2][1], A[1][0]*B[0][2] + A[1][1]*B[1][2] + A[1][2]*B[2][2]],
            [A[2][0]*B[0][0] + A[2][1]*B[1][0] + A[2][2]*B[2][0], A[2][0]*B[0][1] + A[2][1]*B[1][1] + A[2][2]*B[2][1], A[2][0]*B[0][2] + A[2][1]*B[1][2] + A[2][2]*B[2][2]],
        ]);
    }
}