import Dots_and_boxes from "../Dots_and_boxes.js";
import R from "../ramda.js";

describe("Dots_and_boxes.create_board", function () {
    it(
        "Default board: 9*9 dots = 9*8 h_edges, 8*9 v_edges, 8*8 owners, all 0",
        function () {
            const board = Dots_and_boxes.create_board();

            /*
             * Check that h_edges is an array of nine rows, each
             * containing exactly eight zeroes.
             */
            if (!Array.isArray(board.h_edges)) {
                throw new Error(
                    "Expected h_edges to be an array of rows, but got: "
                    + Object.prototype.toString.call(board.h_edges)
                );
            }
            if (board.h_edges.length !== 9) {
                throw new Error(
                    "Expected 9 rows in h_edges, but found "
                    + board.h_edges.length
                );
            }
            board.h_edges.forEach(function (row, row_idx) {
                if (!Array.isArray(row)) {
                    throw new Error(
                        "Expected h_edges[" + row_idx
                        + "] to be an array, but got: "
                        + Object.prototype.toString.call(row)
                    );
                }
                if (row.length !== 8) {
                    throw new Error(
                        "Expected 8 columns in h_edges[" + row_idx
                        + "], but found " + row.length
                    );
                }
            });

            /*
             * Check that v_edges is an array of eight rows, each
             * containing exactly nine zeroes.
             */
            if (!Array.isArray(board.v_edges)) {
                throw new Error(
                    "Expected v_edges to be an array of rows, but got: "
                    + Object.prototype.toString.call(board.v_edges)
                );
            }
            if (board.v_edges.length !== 8) {
                throw new Error(
                    "Expected 8 rows in v_edges, but found "
                    + board.v_edges.length
                );
            }
            board.v_edges.forEach(function (row, row_idx) {
                if (!Array.isArray(row)) {
                    throw new Error(
                        "Expected v_edges[" + row_idx
                        + "] to be an array, but got: "
                        + Object.prototype.toString.call(row)
                    );
                }
                if (row.length !== 9) {
                    throw new Error(
                        "Expected 9 columns in v_edges[" + row_idx
                        + "], but found " + row.length
                    );
                }
            });

            /*
             * Check that owners is an array of eight rows, each
             * containing exactly eight zeroes.
             */
            if (!Array.isArray(board.owners)) {
                throw new Error(
                    "Expected owners to be an array of rows, but got: "
                    + Object.prototype.toString.call(board.owners)
                );
            }
            if (board.owners.length !== 8) {
                throw new Error(
                    "Expected 8 rows in owners, but found "
                    + board.owners.length
                );
            }
            board.owners.forEach(function (row, row_idx) {
                if (!Array.isArray(row)) {
                    throw new Error(
                        "Expected owners[" + row_idx
                        + "] to be an array, but got: "
                        + Object.prototype.toString.call(row)
                    );
                }
                if (row.length !== 8) {
                    throw new Error(
                        "Expected 8 columns in owners[" + row_idx
                        + "], but found " + row.length
                    );
                }
            });

            /*
             * Finally, confirm every entry in the three matrices is zero.
             */
            const all_H = R.flatten(board.h_edges);
            const all_V = R.flatten(board.v_edges);
            const all_O = R.flatten(board.owners);
            if (!R.all(R.equals(0), all_H)) {
                throw new Error(
                    "Expected all entries in h_edges to be zero, "
                    + "but found a nonzero value"
                );
            }
            if (!R.all(R.equals(0), all_V)) {
                throw new Error(
                    "Expected all entries in v_edges to be zero, "
                    + "but found a nonzero value"
                );
            }
            if (!R.all(R.equals(0), all_O)) {
                throw new Error(
                    "Expected all entries in owners to be zero, "
                    + "but found a nonzero value"
                );
            }
        }
    );

    it(
        "Custom dimensions (width=5, height=4) → 4*4 h_edges, 3*5 v_edges,"
        + "3*4 owners, all zeros",
        function () {
            const width = 5;
            const height = 4;
            const board = Dots_and_boxes.create_board(width, height);

            /*
             * h_edges must have 4 rows, each with (width-1)=4 columns.
             */
            if (!Array.isArray(board.h_edges)) {
                throw new Error(
                    "Expected h_edges to be an array, but got: "
                    + Object.prototype.toString.call(board.h_edges)
                );
            }
            if (board.h_edges.length !== height) {
                throw new Error(
                    "Expected " + height + " rows in h_edges, "
                    + "but found " + board.h_edges.length
                );
            }
            board.h_edges.forEach(function (row, row_idx) {
                if (!Array.isArray(row)) {
                    throw new Error(
                        "Expected h_edges[" + row_idx
                        + "] to be an array, but got: "
                        + Object.prototype.toString.call(row)
                    );
                }
                if (row.length !== width - 1) {
                    throw new Error(
                        "Expected " + (width - 1)
                        + " columns in h_edges[" + row_idx
                        + "], but found " + row.length
                    );
                }
            });

            /*
             * v_edges must have (height-1)=3 rows, each with
             * width=5 columns.
             */
            if (!Array.isArray(board.v_edges)) {
                throw new Error(
                    "Expected v_edges to be an array, but got: "
                    + Object.prototype.toString.call(board.v_edges)
                );
            }
            if (board.v_edges.length !== height - 1) {
                throw new Error(
                    "Expected " + (height - 1) + " rows in v_edges, "
                    + "but found " + board.v_edges.length
                );
            }
            board.v_edges.forEach(function (row, row_idx) {
                if (!Array.isArray(row)) {
                    throw new Error(
                        "Expected v_edges[" + row_idx
                        + "] to be an array, but got: "
                        + Object.prototype.toString.call(row)
                    );
                }
                if (row.length !== width) {
                    throw new Error(
                        "Expected " + width
                        + " columns in v_edges[" + row_idx
                        + "], but found " + row.length
                    );
                }
            });

            /*
             * owners must have (height-1)=3 rows, each with
             * (width-1)=4 columns.
             */
            if (!Array.isArray(board.owners)) {
                throw new Error(
                    "Expected owners to be an array, but got: "
                    + Object.prototype.toString.call(board.owners)
                );
            }
            if (board.owners.length !== height - 1) {
                throw new Error(
                    "Expected " + (height - 1) + " rows in owners, "
                    + "but found " + board.owners.length
                );
            }
            board.owners.forEach(function (row, row_idx) {
                if (!Array.isArray(row)) {
                    throw new Error(
                        "Expected owners[" + row_idx
                        + "] to be an array, but got: "
                        + Object.prototype.toString.call(row)
                    );
                }
                if (row.length !== width - 1) {
                    throw new Error(
                        "Expected " + (width - 1)
                        + " columns in owners[" + row_idx
                        + "], but found " + row.length
                    );
                }
            });

            /*
             * Confirm every entry in our matrices is zero.
             */
            const all_H = R.flatten(board.h_edges);
            const all_V = R.flatten(board.v_edges);
            const all_O = R.flatten(board.owners);
            if (!R.all(R.equals(0), all_H)) {
                throw new Error(
                    "Expected all entries in h_edges to be zero, "
                    + "but found a nonzero value"
                );
            }
            if (!R.all(R.equals(0), all_V)) {
                throw new Error(
                    "Expected all entries in v_edges to be zero, "
                    + "but found a nonzero value"
                );
            }
            if (!R.all(R.equals(0), all_O)) {
                throw new Error(
                    "Expected all entries in owners to be zero, "
                    + "but found a nonzero value"
                );
            }
        }
    );

    it(
        "Small board (width = 2, height = 2) 2*1 h_edges, 1*2 v_edges, "
        + "1*1 owners, all 0",
        function () {
            const width = 2;
            const height = 2;
            const board = Dots_and_boxes.create_board(width, height);

            /*
             * h_edges must have 2 rows (height), each with 1 column (width-1).
             */
            if (!Array.isArray(board.h_edges)) {
                throw new Error(
                    "Expected h_edges to be an array, but got: "
                    + Object.prototype.toString.call(board.h_edges)
                );
            }
            if (board.h_edges.length !== 2) {
                throw new Error(
                    "Expected 2 rows in h_edges, but found "
                    + board.h_edges.length
                );
            }
            board.h_edges.forEach(function (row, row_idx) {
                if (!Array.isArray(row)) {
                    throw new Error(
                        "Expected h_edges[" + row_idx
                        + "] to be an array, but got: "
                        + Object.prototype.toString.call(row)
                    );
                }
                if (row.length !== 1) {
                    throw new Error(
                        "Expected 1 column in h_edges[" + row_idx
                        + "], but found " + row.length
                    );
                }
            });

            /*
             * v_edges must have 1 row (height-1), each with 2 columns (width).
             */
            if (!Array.isArray(board.v_edges)) {
                throw new Error(
                    "Expected v_edges to be an array, but got: "
                    + Object.prototype.toString.call(board.v_edges)
                );
            }
            if (board.v_edges.length !== 1) {
                throw new Error(
                    "Expected 1 row in v_edges, but found "
                    + board.v_edges.length
                );
            }
            board.v_edges.forEach(function (row, row_idx) {
                if (!Array.isArray(row)) {
                    throw new Error(
                        "Expected v_edges[" + row_idx
                        + "] to be an array, but got: "
                        + Object.prototype.toString.call(row)
                    );
                }
                if (row.length !== 2) {
                    throw new Error(
                        "Expected 2 columns in v_edges[" + row_idx
                        + "], but found " + row.length
                    );
                }
            });

            /*
             * owners must have 1 row (height-1), each with 1 column (width-1).
             */
            if (!Array.isArray(board.owners)) {
                throw new Error(
                    "Expected owners to be an array, but got: "
                    + Object.prototype.toString.call(board.owners)
                );
            }
            if (board.owners.length !== 1) {
                throw new Error(
                    "Expected 1 row in owners, but found "
                    + board.owners.length
                );
            }
            board.owners.forEach(function (row, row_idx) {
                if (!Array.isArray(row)) {
                    throw new Error(
                        "Expected owners[" + row_idx
                        + "] to be an array, but got: "
                        + Object.prototype.toString.call(row)
                    );
                }
                if (row.length !== 1) {
                    throw new Error(
                        "Expected 1 column in owners[" + row_idx
                        + "], but found " + row.length
                    );
                }
            });

            /*
             * Check that all entries are zero.
             */
            const all_H = R.flatten(board.h_edges);
            const all_V = R.flatten(board.v_edges);
            const all_O = R.flatten(board.owners);
            if (!R.all(R.equals(0), all_H)) {
                throw new Error(
                    "Expected all entries in h_edges to be zero, "
                    + "but found a nonzero value"
                );
            }
            if (!R.all(R.equals(0), all_V)) {
                throw new Error(
                    "Expected all entries in v_edges to be zero, "
                    + "but found a nonzero value"
                );
            }
            if (!R.all(R.equals(0), all_O)) {
                throw new Error(
                    "Expected all entries in owners to be zero, "
                    + "but found a nonzero value"
                );
            }
        }
    );

    it(
        "Tiny board (width=1, height=1) 1*0 h_edges, 0*1 v_edges, 0*0 owners, "
        + "all empty",
        function () {
            const width = 1;
            const height = 1;
            const board = Dots_and_boxes.create_board(width, height);

            /*
             * h_edges must have 1 row but zero columns (width-1 = 0).
             */
            if (!Array.isArray(board.h_edges)) {
                throw new Error(
                    "Expected h_edges to be an array, but got: "
                    + Object.prototype.toString.call(board.h_edges)
                );
            }
            if (board.h_edges.length !== 1) {
                throw new Error(
                    "Expected 1 row in h_edges, but found "
                    + board.h_edges.length
                );
            }
            if (!Array.isArray(board.h_edges[0])) {
                throw new Error(
                    "Expected h_edges[0] to be an array, but got: "
                    + Object.prototype.toString.call(board.h_edges[0])
                );
            }
            if (board.h_edges[0].length !== 0) {
                throw new Error(
                    "Expected 0 columns in h_edges[0], but found "
                    + board.h_edges[0].length
                );
            }

            /*
             * v_edges must have zero rows (height-1 = 0), so it is an empty
             * array.
             */
            if (!Array.isArray(board.v_edges)) {
                throw new Error(
                    "Expected v_edges to be an array, but got: "
                    + Object.prototype.toString.call(board.v_edges)
                );
            }
            if (board.v_edges.length !== 0) {
                throw new Error(
                    "Expected 0 rows in v_edges, but found "
                    + board.v_edges.length
                );
            }

            /*
             * owners must also have zero rows (height-1 = 0) and be empty.
             */
            if (!Array.isArray(board.owners)) {
                throw new Error(
                    "Expected owners to be an array, but got: "
                    + Object.prototype.toString.call(board.owners)
                );
            }
            if (board.owners.length !== 0) {
                throw new Error(
                    "Expected 0 rows in owners, but found "
                    + board.owners.length
                );
            }
        }
    );
});
