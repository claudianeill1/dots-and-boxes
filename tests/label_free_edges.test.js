import Dots_and_boxes from "../Dots_and_boxes.js";

/**
 * Try to stringify anything for error messages.
 * If JSON.stringify fails (e.g. circular), just call String().
 * @memberof Dots_and_boxes.test
 * @function stringify
 * @param {*} obj Any value to stringify.
 * @returns {string} JSON string with a leading newline, or fallback string.
 */
const stringify = function (obj) {
    try {
        return "\n" + JSON.stringify(obj);
    } catch (ignore) {
        return "\n" + String(obj);
    }
};

/**
 * Check that a 2D array has exactly expected_rows and expected_cols.
 * Throws if:
 * - It’s not an array,
 * - It doesn’t have expected_rows rows,
 * - Any row isn’t an array of expected_cols columns.
 * @memberof Dots_and_boxes.test
 * @function assert_shape
 * @param {Array} arr The 2D array to check.
 * @param {number} expectedRows Number of rows expected.
 * @param {number} expectedCols Number of cols per row expected.
 * @param {string} name Context name for error messages.
 * @throws {Error} When arr fails any check.
 */
const assert_shape = function (arr, expected_rows, expected_cols, name) {
    if (!Array.isArray(arr)) {
        throw new Error(
            name + " is not an array: " + stringify(arr)
        );
    }
    if (arr.length !== expected_rows) {
        throw new Error(
            name + " should have " + expected_rows +
            " rows, but has " + arr.length + ": " +
            stringify(arr)
        );
    }
    arr.forEach(function (row, r) {
        if (!Array.isArray(row)) {
            throw new Error(
                name + "[" + r + "] is not an array: " +
                stringify(row)
            );
        }
        if (row.length !== expected_cols) {
            throw new Error(
                name + "[" + r + "] should have " +
                expected_cols + " columns, but has " +
                row.length + ": " + stringify(arr)
            );
        }
    });
};

/**
 * Check that each free label is its own [row,col]. Throws if not.
 * So labels[r][c] must be [r,c].
 * @memberof Dots_and_boxes.test
 * @function assert_coordinate_labels
 * @param {Array.<Array.<[number,number]>>} labels 2D array of pairs.
 * @param {string} name Context name for error messages.
 * @throws {Error} When any labels[r][c] ≠ [r,c].
 */
const assert_coordinate_labels = function (labels, name) {
    labels.forEach(function (row, r) {
        row.forEach(function (cell, c) {
            if (!Array.isArray(cell) || cell[0] !== r || cell[1] !== c) {
                throw new Error(
                    name + "[" + r + "][" + c + "] should be [" +
                    r + "," + c + "], but got: " +
                    stringify(cell)
                );
            }
        });
    });
};

/**
 * Check that certain spots in labels are -1 (occupied). Throws if not.
 * @memberof Dots_and_boxes.test
 * @function assert_occupied
 * @param {Array.<Array.<[number,number] | -1>>} labels 2D labels array.
 * @param {Array.<[number,number]>} coords List of [row,col] to check.
 * @param {string} name Context for error messages.
 * @throws {Error} When any labels[r][c] isn't -1.
 */
const assert_occupied = function (labels, coords, name) {
    coords.forEach(function (pair) {
        const r = pair[0];
        const c = pair[1];
        if (labels[r][c] !== -1) {
            throw new Error(
                name + "[" + r + "][" + c +
                "] should be -1 (occupied), but got: " +
                stringify(labels[r][c])
            );
        }
    });
};

/**
 * Count how many free edges of each direction are in freeList.
 * freeList items have {dir, row, col}. dir must be "H" or "V".
 * Throws if:
 * - freeList isn’t an array,
 * - any dir isn’t "H" or "V",
 * - the counts don’t match expected_h, expected_v.
 * @memberof Dots_and_boxes.test
 * @function assertFreeCounts
 * @param {Array.<{dir:string,row:number,col:number}>} free_list Lists free.
 * @param {number} expectedH Expected # of "H" edges.
 * @param {number} expectedV Expected # of "V" edges.
 * @param {string} name Context name for errors.
 * @throws {Error} If conditions fail.
 */
const assert_free_counts = function (free_list, expected_H, expected_V, name) {
    if (!Array.isArray(free_list)) {
        throw new Error(
            name + " free_edges is not an array: " +
            stringify(free_list)
        );
    }
    let count_H = 0;
    let count_V = 0;
    free_list.forEach(function (eo) {
        if (eo.dir === "H") {
            count_H += 1;
        } else if (eo.dir === "V") {
            count_V += 1;
        } else {
            throw new Error(
                name + " free_edges contains invalid dir: " +
                stringify(eo)
            );
        }
    });
    if (count_H !== expected_H || count_V !== expected_V) {
        throw new Error(
            name + " expected H=" + expected_H +
            " V=" + expected_V + ", but got H=" + count_H +
            " V=" + count_V
        );
    }
};

/**
 * Tests label_free_h_edges, label_free_v_edges, and free_edges.
 * 1. On a new 3*3 board (2*2 boxes):
 *    - h_edges is 3 rows * 2 cols, free labels = [r,c].
 *    - v_edges is 2 rows * 3 cols, free labels = [r,c].
 *    - free_edges lists 12 entries (6 H + 6 V).
 * 2. After drawing H(1,0):
 *    - label_free_h_edges is -1 at [1,0], others unchanged.
 *    - free_edges drops that one H (now 11 entries).
 * 3. After drawing V(0,2):
 *    - label_free_v_edges is -1 at [0,2], others unchanged.
 *    - free_edges drops that one V (now 11 entries).
 * 4. On 2*2 board (1*1 box):
 *    - Drawing H(0,0), H(1,0), V(0,0), V(0,1) closes box.
 *    - free_edges must then be empty (0 entries).
 * 5. Degenerate boards:
 *    a) 1*1: h_edges = [ [] ], v_edges = [ ], free_edges = [ ].
 *    b) 2*1: h_edges = [ [0] ], v_edges = [ ], free_edges = [
 *       {dir:"H",row:0,col:0} ].
 *    c) 1*2: h_edges = [ [], [] ], v_edges = [ [0] ], free_edges = [
 *       {dir:"V",row:0,col:0} ].
 * Error messages show exactly what’s wrong so you can debug quickly.
 */
describe(
    "Dots_and_boxes.label_free_h_edges / label_free_v_edges / free_edges",
    function () {
        it(
            "Empty 3*3 board → h_labels 3*2, v_labels 2*3," +
            " free_edges 12 slots",
            function () {
                let board = Dots_and_boxes.create_board(3, 3);

                // Horizontal labels: expect a 3×2 matrix of [row,col]
                let h_lab = Dots_and_boxes.label_free_h_edges(board);
                assert_shape(h_lab, 3, 2, "label_free_h_edges");
                assert_coordinate_labels(h_lab, "label_free_h_edges");

                // Vertical labels: expect a 2×3 matrix of [row,col]
                let v_lab = Dots_and_boxes.label_free_v_edges(board);
                assert_shape(v_lab, 2, 3, "label_free_v_edges");
                assert_coordinate_labels(v_lab, "label_free_v_edges");

                // free_edges: 6 horizontal + 6 vertical = 12
                let free_all = Dots_and_boxes.free_edges(board);
                assert_free_counts(free_all, 6, 6, "free_edges");
            }
        );

        it(
            "After drawing H(1,0) on 3*3, that slot is -1 and free_edges" +
            " drops one H",
            function () {
                let board = Dots_and_boxes.create_board(3, 3);
                // Draw horizontal at row=1, col=0
                let h1 = Dots_and_boxes.update_h_edges(
                    board.h_edges,
                    1,
                    0,
                    1,
                    true
                );
                let nb = {
                    h_edges: h1,
                    v_edges: board.v_edges,
                    owners: board.owners
                };

                // Now label_free_h_edges should be -1 at [1,0]
                let h_lab = Dots_and_boxes.label_free_h_edges(nb);
                assert_occupied(h_lab, [[1, 0]], "label_free_h_edges");

                // Check [1,1] still [1,1]
                if (
                    !Array.isArray(h_lab[1][1]) ||
                    h_lab[1][1][0] !== 1 ||
                    h_lab[1][1][1] !== 1
                ) {
                    throw new Error(
                        "label_free_h_edges[1][1] should be [1,1], but" +
                        " got: " + stringify(h_lab[1][1])
                    );
                }

                // free_edges now: 5 H + 6 V = 11
                let free_now = Dots_and_boxes.free_edges(nb);
                assert_free_counts(free_now, 5, 6, "free_edges");
            }
        );

        it(
            "After drawing V(0,2) on 3*3, that slot is -1 and free_edges" +
            " drops one V",
            function () {
                let board = Dots_and_boxes.create_board(3, 3);
                // Draw vertical at row=0, col=2
                let v1 = Dots_and_boxes.update_v_edges(
                    board.v_edges,
                    0,
                    2,
                    2,
                    true
                );
                let nb = {
                    h_edges: board.h_edges,
                    v_edges: v1,
                    owners: board.owners
                };

                // Now label_free_v_edges should be -1 at [0,2]
                let v_lab = Dots_and_boxes.label_free_v_edges(nb);
                assert_occupied(v_lab, [[0, 2]], "label_free_v_edges");

                // Check [0,1] still [0,1]
                if (
                    !Array.isArray(v_lab[0][1]) ||
                    v_lab[0][1][0] !== 0 ||
                    v_lab[0][1][1] !== 1
                ) {
                    throw new Error(
                        "label_free_v_edges[0][1] should be [0,1], but" +
                        " got: " + stringify(v_lab[0][1])
                    );
                }

                // free_edges now: 6 H + 5 V = 11
                let free_now = Dots_and_boxes.free_edges(nb);
                assert_free_counts(free_now, 6, 5, "free_edges");
            }
        );

        it(
            "After closing the only box on 2*2, free_edges is empty",
            function () {
                let board = Dots_and_boxes.create_board(2, 2);
                // Draw edges H(0,0), H(1,0), V(0,0), V(0,1)
                let h1 = Dots_and_boxes.update_h_edges(
                    board.h_edges,
                    0,
                    0,
                    1,
                    true
                );
                let h2 = Dots_and_boxes.update_h_edges(
                    h1,
                    1,
                    0,
                    1,
                    true
                );
                let v1 = Dots_and_boxes.update_v_edges(
                    board.v_edges,
                    0,
                    0,
                    1,
                    true
                );
                let v2 = Dots_and_boxes.update_v_edges(
                    v1,
                    0,
                    1,
                    1,
                    true
                );
                let nb = {
                    h_edges: h2,
                    v_edges: v2,
                    owners: board.owners
                };

                // free_edges must be empty now
                let free_now = Dots_and_boxes.free_edges(nb);
                assert_free_counts(free_now, 0, 0, "free_edges");
            }
        );

        it(
            "Degenerate boards (1*1, 2*1, 1*2) handle empty rows/columns",
            function () {
                // Case 1: 1*1
                let b11 = Dots_and_boxes.create_board(1, 1);
                let h_lab11 = Dots_and_boxes.label_free_h_edges(b11);
                if (
                    !Array.isArray(h_lab11) ||
                    h_lab11.length !== 1 ||
                    !Array.isArray(h_lab11[0]) ||
                    h_lab11[0].length !== 0
                ) {
                    throw new Error(
                        "1*1 label_free_h_edges should be [ [] ], but got: " +
                        stringify(h_lab11)
                    );
                }
                let v_lab11 = Dots_and_boxes.label_free_v_edges(b11);
                if (!Array.isArray(v_lab11) || v_lab11.length !== 0) {
                    throw new Error(
                        "1*1 label_free_v_edges should be [], but got: " +
                        stringify(v_lab11)
                    );
                }
                let free11 = Dots_and_boxes.free_edges(b11);
                if (!Array.isArray(free11) || free11.length !== 0) {
                    throw new Error(
                        "1*1 free_edges should be [], but got length " +
                        free11.length
                    );
                }

                // Case 2: 2*1
                let b21 = Dots_and_boxes.create_board(2, 1);
                let h_lab21 = Dots_and_boxes.label_free_h_edges(b21);
                if (
                    !Array.isArray(h_lab21) ||
                    h_lab21.length !== 1 ||
                    !Array.isArray(h_lab21[0]) ||
                    h_lab21[0].length !== 1 ||
                    h_lab21[0][0][0] !== 0 ||
                    h_lab21[0][0][1] !== 0
                ) {
                    throw new Error(
                        "2*1 label_free_h_edges should be [[0,0]], but got: " +
                        stringify(h_lab21)
                    );
                }
                let v_lab21 = Dots_and_boxes.label_free_v_edges(b21);
                if (!Array.isArray(v_lab21) || v_lab21.length !== 0) {
                    throw new Error(
                        "2*1 label_free_v_edges should be [], but got: " +
                        stringify(v_lab21)
                    );
                }
                let free21 = Dots_and_boxes.free_edges(b21);
                if (
                    !Array.isArray(free21) ||
                    free21.length !== 1 ||
                    free21[0].dir !== "H" ||
                    free21[0].row !== 0 ||
                    free21[0].col !== 0
                ) {
                    throw new Error(
                        "2*1 free_edges should be [{dir:'H',row:0,col:0}]," +
                        " but got: " + stringify(free21)
                    );
                }

                // Case 3: 1*2
                let b12 = Dots_and_boxes.create_board(1, 2);
                let h_lab12 = Dots_and_boxes.label_free_h_edges(b12);
                if (
                    !Array.isArray(h_lab12) ||
                    h_lab12.length !== 2 ||
                    !Array.isArray(h_lab12[0]) ||
                    h_lab12[0].length !== 0 ||
                    !Array.isArray(h_lab12[1]) ||
                    h_lab12[1].length !== 0
                ) {
                    throw new Error(
                        "1*2 label_free_h_edges should be [[],[]], but got: " +
                        stringify(h_lab12)
                    );
                }
                let v_lab12 = Dots_and_boxes.label_free_v_edges(b12);
                if (
                    !Array.isArray(v_lab12) ||
                    v_lab12.length !== 1 ||
                    !Array.isArray(v_lab12[0]) ||
                    v_lab12[0].length !== 1 ||
                    v_lab12[0][0][0] !== 0 ||
                    v_lab12[0][0][1] !== 0
                ) {
                    throw new Error(
                        "1*2 label_free_v_edges should be [[[0,0]]], but got: "
                        + stringify(v_lab12)
                    );
                }
                let free12 = Dots_and_boxes.free_edges(b12);
                if (
                    !Array.isArray(free12) ||
                    free12.length !== 1 ||
                    free12[0].dir !== "V" ||
                    free12[0].row !== 0 ||
                    free12[0].col !== 0
                ) {
                    throw new Error(
                        "1*2 free_edges should be [{dir:'V',row:0,col:0}], but"
                        + " got: " + stringify(free12)
                    );
                }
            }
        );
    }
);
