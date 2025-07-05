import Dots_and_boxes from "../Dots_and_boxes.js";

/**
 * Try to stringify anything for clear error messages.
 * If JSON.stringify fails, fall back to String().
 * @memberof Dots_and_boxes.test
 * @function stringify
 * @param {*} obj Any value to stringify.
 * @returns {string} JSON string with leading newline, or fallback string.
 */
const stringify = function (obj) {
    try {
        return "\n" + JSON.stringify(obj);
    } catch (ignore) {
        return "\n" + String(obj);
    }
};

describe("Dots_and_boxes immutability tests", function () {
    it(
        "create_board returns an immutable new board every time",
        function () {
            const board1 = Dots_and_boxes.create_board(3, 3);
            const board2 = Dots_and_boxes.create_board(3, 3);

            board1.h_edges[0][0] = 1;

            if (board2.h_edges[0][0] !== 0) {
                throw new Error(
                    "Expected board2.h_edges[0][0] to remain 0, but got:" +
                    stringify(board2.h_edges[0][0])
                );
            }
        }
    );

    it(
        "make_move does not mutate the original input board",
        function () {
            const board = Dots_and_boxes.create_board(3, 3);
            const original = JSON.parse(JSON.stringify(board));

            Dots_and_boxes.make_move(1, "H", 0, 0, board);

            if (JSON.stringify(board) !== JSON.stringify(original)) {
                throw new Error(
                    "make_move mutated the original board. Before:" +
                    stringify(original) +
                    "\nAfter:" +
                    stringify(board)
                );
            }
        }
    );

    it(
        "claim_box_if_enclosed does not mutate original owners matrix",
        function () {
            const board = Dots_and_boxes.create_board(2, 2);
            const originalOwners = JSON.parse(JSON.stringify(board.owners));

            const h1 = Dots_and_boxes.update_h_edges(
                board.h_edges,
                0,
                0,
                1,
                true
            );
            const h2 = Dots_and_boxes.update_h_edges(
                h1,
                1,
                0,
                1,
                true
            );
            const v1 = Dots_and_boxes.update_v_edges(
                board.v_edges,
                0,
                0,
                1,
                true
            );
            const v2 = Dots_and_boxes.update_v_edges(
                v1,
                0,
                1,
                1,
                true
            );

            Dots_and_boxes.claim_box_if_enclosed(
                {h_edges: h2, v_edges: v2, owners: board.owners},
                0,
                0,
                1
            );

            if (JSON.stringify(board.owners) !== JSON.stringify(
                originalOwners
            )) {
                throw new Error(
                    "claim_box_if_enclosed mutated original owners matrix. " +
                    "Before:" +
                    stringify(originalOwners) +
                    "\nAfter:" +
                    stringify(board.owners)
                );
            }
        }
    );

    it(
        "process_all_candidate_boxes returns a new board without mutating " +
        "inputs",
        function () {
            const board = Dots_and_boxes.create_board(2, 2);
            const originalBoard = JSON.parse(JSON.stringify(board));

            const h1 = Dots_and_boxes.update_h_edges(
                board.h_edges,
                0,
                0,
                1,
                true
            );
            const h2 = Dots_and_boxes.update_h_edges(
                h1,
                1,
                0,
                1,
                true
            );
            const v1 = Dots_and_boxes.update_v_edges(
                board.v_edges,
                0,
                0,
                1,
                true
            );
            const v2 = Dots_and_boxes.update_v_edges(
                v1,
                0,
                1,
                1,
                true
            );

            Dots_and_boxes.process_all_candidate_boxes(
                "H",
                0,
                0,
                1,
                h2,
                v2,
                board.owners
            );

            if (JSON.stringify(board) !== JSON.stringify(originalBoard)) {
                throw new Error(
                    "process_all_candidate_boxes mutated original board." +
                    "Before:" + stringify(originalBoard) +
                    "\nAfter:" +
                    stringify(board)
                );
            }
        }
    );
});
