import Dots_and_boxes from "../Dots_and_boxes.js";

/*
 * Try to stringify anything for error messages.
 * If JSON.stringify fails, just call String().
 */
function stringify(obj) {
    try {
        return "\n" + JSON.stringify(obj);
    } catch (ignore) {
        return "\n" + String(obj);
    }
}

describe("Dots_and_boxes utility functions", function () {
    it(
        "is_ended returns false for new board and true when no edges remain",
        function () {
            const board = Dots_and_boxes.create_board(2, 2);
            if (Dots_and_boxes.is_ended(board)) {
                throw new Error(
                    "Expected is_ended to be false for a new board"
                );
            }
            /* Fill all edges */
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
            const finished = {
                h_edges: h2,
                v_edges: v2,
                owners: board.owners
            };
            if (!Dots_and_boxes.is_ended(finished)) {
                throw new Error(
                    "Expected is_ended to be true when no edges remain"
                );
            }
        }
    );

    it(
        "get_surrounding_edges returns the correct adjacent edge coordinates",
        function () {
            const coords = Dots_and_boxes.get_surrounding_edges(2, 3);

            if (
                !Array.isArray(coords.top) ||
                coords.top[0] !== 2 ||
                coords.top[1] !== 3
            ) {
                throw new Error(
                    "Expected top edge [2,3] but got:" +
                    stringify(coords.top)
                );
            }
            if (coords.bottom[0] !== 3 || coords.bottom[1] !== 3) {
                throw new Error(
                    "Expected bottom edge [3,3] but got:" +
                    stringify(coords.bottom)
                );
            }
            if (coords.left[0] !== 2 || coords.left[1] !== 3) {
                throw new Error(
                    "Expected left edge [2,3] but got:" +
                    stringify(coords.left)
                );
            }
            if (coords.right[0] !== 2 || coords.right[1] !== 4) {
                throw new Error(
                    "Expected right edge [2,4] but got:" +
                    stringify(coords.right)
                );
            }
        }
    );

    it(
        "is_enclosed correctly identifies when a box is fully enclosed",
        function () {
            const board = Dots_and_boxes.create_board(2, 2);
            /* Draw three edges only */
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
            if (Dots_and_boxes.is_enclosed(h2, v1, 0, 0)) {
                throw new Error(
                    "Expected is_enclosed(false) when one edge is missing"
                );
            }
            /* Draw the final edge */
            const v2 = Dots_and_boxes.update_v_edges(
                v1,
                0,
                1,
                1,
                true
            );
            if (!Dots_and_boxes.is_enclosed(h2, v2, 0, 0)) {
                throw new Error(
                    "Expected is_enclosed(true) when all edges are drawn"
                );
            }
        }
    );

    it(
        "is_valid_box_position returns true only for in-bounds box coordinates",
        function () {
            const owners = [[0, 1], [2, 0]];
            if (!Dots_and_boxes.is_valid_box_position(owners, 0, 0)) {
                throw new Error(
                    "Expected (0,0) to be valid"
                );
            }
            if (Dots_and_boxes.is_valid_box_position(owners, -1, 0)) {
                throw new Error(
                    "Expected (-1,0) to be invalid"
                );
            }
            if (Dots_and_boxes.is_valid_box_position(owners, 0, 2)) {
                throw new Error(
                    "Expected (0,2) to be invalid"
                );
            }
            if (Dots_and_boxes.is_valid_box_position(owners, 2, 2)) {
                throw new Error(
                    "Expected (2,2) to be invalid"
                );
            }
        }
    );

    it(
        "is_already_claimed returns true only for claimed boxes and false" +
        "otherwise",
        function () {
            const owners = [[0, 1], [2, 0]];
            if (Dots_and_boxes.is_already_claimed(owners, 0, 0)) {
                throw new Error(
                    "Expected (0,0) to be unclaimed"
                );
            }
            if (!Dots_and_boxes.is_already_claimed(owners, 0, 1)) {
                throw new Error(
                    "Expected (0,1) to be claimed"
                );
            }
            /* Out-of-range should be false */
            if (Dots_and_boxes.is_already_claimed(owners, 5, 5)) {
                throw new Error(
                    "Expected out-of-range (5,5) to be unclaimed"
                );
            }
        }
    );

    it(
        "set_box_owner assigns ownership immutably",
        function () {
            const owners = [[0, 0], [0, 0]];
            const newOwners = Dots_and_boxes.set_box_owner(
                owners,
                1,
                1,
                2
            );
            if (newOwners[1][1] !== 2) {
                throw new Error(
                    "Expected newOwners[1][1] to be 2, got:" +
                    stringify(newOwners[1][1])
                );
            }
            if (owners[1][1] !== 0) {
                throw new Error(
                    "Expected original owners to remain unchanged"
                );
            }
        }
    );

    it(
        "get_candidate_boxes returns the correct boxes adjacent to an edge",
        function () {
            const hCands = Dots_and_boxes.get_candidate_boxes("H", 1, 2);
            if (
                hCands.length !== 2 ||
                hCands[0][0] !== 0 ||
                hCands[0][1] !== 2 ||
                hCands[1][0] !== 1 ||
                hCands[1][1] !== 2
            ) {
                throw new Error(
                    "Expected H candidates [[0,2],[1,2]] but got:" +
                    stringify(hCands)
                );
            }
            const vCands = Dots_and_boxes.get_candidate_boxes("V", 1, 2);
            if (
                vCands.length !== 2 || vCands[0][0] !== 1 ||
                vCands[0][1] !== 1 || vCands[1][0] !== 1 ||
                vCands[1][1] !== 2
            ) {
                throw new Error(
                    "Expected V candidates [[1,1],[1,2]] but got:" +
                    stringify(vCands)
                );
            }
        }
    );

    it(
        "attempt_claim_for_box only claims when box is fully enclosed",
        function () {
            const board = Dots_and_boxes.create_board(2, 2);
            const h2 = Dots_and_boxes.update_h_edges(
                Dots_and_boxes.update_h_edges(
                    board.h_edges,
                    0,
                    0,
                    1,
                    true
                ),
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
            const miss = Dots_and_boxes.attempt_claim_for_box(
                h2,
                v1,
                board.owners,
                0,
                0,
                1
            );
            if (miss.claimed) {
                throw new Error(
                    "Expected box not to be claimed when one edge missing"
                );
            }
            const v2 = Dots_and_boxes.update_v_edges(
                v1,
                0,
                1,
                1,
                true
            );
            const hit = Dots_and_boxes.attempt_claim_for_box(
                h2,
                v2,
                board.owners,
                0,
                0,
                2
            );
            if (!hit.claimed || hit.new_owners[0][0] !== 2) {
                throw new Error(
                    "Expected box to be claimed by player 2 if when enclosed"
                );
            }
        }
    );

    it(
        "apply_edge_to_board updates only the specified edge if matrix",
        function () {
            const board = Dots_and_boxes.create_board(3, 3);
            /* Horizontal update */
            const resH = Dots_and_boxes.apply_edge_to_board(
                "H",
                1,
                1,
                1,
                board.h_edges,
                board.v_edges
            );
            if (resH.new_H[1][1] !== 1) {
                throw new Error(
                    "Expected new_H[1][1] to be 1 but got:" +
                    stringify(resH.new_H[1][1])
                );
            }
            if (resH.new_V[1][1] !== board.v_edges[1][1]) {
                throw new Error(
                    "Expected new_V unchanged for H move"
                );
            }
            /* Vertical update */
            const resV = Dots_and_boxes.apply_edge_to_board(
                "V",
                0,
                2,
                2,
                board.h_edges,
                board.v_edges
            );
            if (resV.new_V[0][2] !== 2) {
                throw new Error(
                    "Expected new_V[0][2] to be 2 but got:" +
                    stringify(resV.new_V[0][2])
                );
            }
            if (resV.new_H[0][2] !== board.h_edges[0][2]) {
                throw new Error(
                    "Expected new_H unchanged for V move"
                );
            }
        }
    );
});