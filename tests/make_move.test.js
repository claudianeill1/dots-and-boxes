import Dots_and_boxes from "../Dots_and_boxes.js";
import R from "../ramda.js";

/**
 * Try to stringify anything for error messages.
 * If JSON.stringify fails (e.g. circular), fall back to String().
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
 * Count how many non-zero entries there are in a flattened 2D array.
 * (Used to confirm edges or boxes have been placed.)
 * @memberof Dots_and_boxes.test
 * @function count_non_zero
 * @param {Array.<Array.<number>>} matrix 2D array of numbers.
 * @returns {number} Count of all entries ≠ 0.
 */
const count_non_zero = function (matrix) {
    return R.pipe(
        R.flatten,
        R.reject(R.equals(0)),
        R.length
    )(matrix);
};

/**
 * Tests for make_move, turn logic, box-claiming, and scoring.
 * 1. is_edge_free + update_h_edges/update_v_edges
 *    - Place one edge, ensure free -> occupied.
 * 2. is_box_claimable + claim_box_if_enclosed + process_all_candidate_boxes
 *    - On 2×2 board, draw three edges: box not claimable.
 *    - Draw fourth edge: box becomes claimable -> owners updated.
 * 3. next_player
 *    - If box_claimed=false, turn switches.
 *    - If box_claimed=true, same player goes again.
 * 4. make_move orchestration
 *    - Step through four moves on a 2×2 board:
 *      • Three moves do not close box -> next_player flips each time.
 *      • Fourth move closes box -> owners updated, nextPlayer stays same.
 * 5. get_score, winner, count_player_edges, count_player_boxes
 *    - Manually assign some owners and edges, confirm scores and counts.
 * 6. Edge cases:
 *    - make_move on an already-ended board returns undefined.
 *    - make_move on an occupied slot returns undefined.
 */
describe("Dots_and_boxes.make_move / scoring logic", function () {
    it(
        "is_edge_free + update_h_edges/update_v_edges flips from free -> occ",
        function () {
            // Create a 3×3 board (2×2 boxes).
            const board = Dots_and_boxes.create_board(3, 3);

            // Initially, H(1,1) must be free.
            if (!Dots_and_boxes.is_edge_free("H", 1, 1, board)) {
                throw new Error("Expected H(1,1) to be free initially");
            }

            // Place horizontal edge at (1,1) for player1.
            const new_H = Dots_and_boxes.update_h_edges(
                board.h_edges,
                1,
                1,
                1,
                true
            );
            // Construct partial board with updated h_edges.
            const board1 = {
                h_edges: new_H,
                v_edges: board.v_edges,
                owners: board.owners
            };

            // Now H(1,1) must be occupied (no longer free).
            if (Dots_and_boxes.is_edge_free("H", 1, 1, board1)) {
                throw new Error("Expected H(1,1) to be occupied now");
            }

            // Test a vertical edge similarly on a fresh board.
            const board2 = Dots_and_boxes.create_board(3, 3);
            if (!Dots_and_boxes.is_edge_free("V", 0, 2, board2)) {
                throw new Error("Expected V(0,2) to be free initially");
            }
            const new_V = Dots_and_boxes.update_v_edges(
                board2.v_edges,
                0,
                2,
                2,
                true
            );
            const board3 = {
                h_edges: board2.h_edges,
                v_edges: new_V,
                owners: board2.owners
            };
            if (Dots_and_boxes.is_edge_free("V", 0, 2, board3)) {
                throw new Error("Expected V(0,2) to be occupied now");
            }
        }
    );

    it(
        "is_box_claimable + claim_box_if_enclosed + "
        + "process_all_candidate_boxes",
        function () {
            // On a 2×2 board, there’s exactly one box at owners[0][0].
            const board = Dots_and_boxes.create_board(2, 2);

            // Draw three edges around the box: H(0,0), H(1,0), V(0,0).
            const h0 = Dots_and_boxes.update_h_edges(
                board.h_edges,
                0,
                0,
                1,
                true
            );
            const h1 = Dots_and_boxes.update_h_edges(
                h0,
                1,
                0,
                1,
                true
            );
            const v0 = Dots_and_boxes.update_v_edges(
                board.v_edges,
                0,
                0,
                1,
                true
            );
            const partial = {
                h_edges: h1,
                v_edges: v0,
                owners: board.owners
            };

            // The box at (0,0) should NOT be claimable yet.
            if (Dots_and_boxes.is_box_claimable(partial, 0, 0)) {
                throw new Error(
                    "Box (0,0) should NOT be claimable after 3 edges"
                );
            }

            // Draw the fourth edge: V(0,1). That closes the box.
            const v1 = Dots_and_boxes.update_v_edges(
                v0,
                0,
                1,
                1,
                true
            );
            const almost = {
                h_edges: h1,
                v_edges: v1,
                owners: board.owners
            };

            // Now the box must be claimable.
            if (!Dots_and_boxes.is_box_claimable(almost, 0, 0)) {
                throw new Error(
                    "Box (0,0) should be claimable after 4 edges"
                );
            }

            // Claim it via claim_box_if_enclosed.
            const result = Dots_and_boxes.claim_box_if_enclosed(
                {h_edges: h1, v_edges: v1, owners: board.owners},
                0,
                0,
                1
            );
            // Expect new_owners = [[1]].
            if (
                result.new_owners.length !== 1 ||
                result.new_owners[0].length !== 1 ||
                result.new_owners[0][0] !== 1
            ) {
                throw new Error(
                    "claim_box_if_enclosed did not set owners[0][0]=1:" +
                    stringify(result.new_owners)
                );
            }

            // process_all_candidate_boxes should also claim that one box.
            const processed = Dots_and_boxes.process_all_candidate_boxes(
                "H", // direction is arbitrary once edges are there
                0,
                0,
                1,
                h1,
                v1,
                board.owners
            );
            if (
                processed.new_owners.length !== 1 ||
                processed.new_owners[0][0] !== 1 ||
                processed.boxes_closed !== 1
            ) {
                throw new Error(
                    "process_all_candidate_boxes did not claim box: " +
                    stringify(processed)
                );
            }
        }
    );

    it(
        "next_player: same player if box_claimed, else switch",
        function () {
            // If box_claimed = false, player should flip.
            if (Dots_and_boxes.next_player(1, false) !== 2) {
                throw new Error("Expected 1->2 when no box claimed");
            }
            if (Dots_and_boxes.next_player(2, false) !== 1) {
                throw new Error("Expected 2->1 when no box claimed");
            }

            // If box_claimed = true, same player goes again.
            if (Dots_and_boxes.next_player(1, true) !== 1) {
                throw new Error("Expected 1->1 when box claimed");
            }
            if (Dots_and_boxes.next_player(2, true) !== 2) {
                throw new Error("Expected 2->2 when box claimed");
            }
        }
    );

    it(
        "make_move orchestration: edges, box-claim, nextPlayer logic",
        function () {
            // Start a fresh 2×2 board (one box). Player 1 goes first.
            const board = Dots_and_boxes.create_board(2, 2);

            // Move 1: player1 draws H(0,0). Does NOT close box.
            const turn1 = Dots_and_boxes.make_move(1, "H", 0, 0, board);
            // Expect exactly one horizontal edge placed.
            if (
                count_non_zero(turn1.board.h_edges) !== 1 ||
                count_non_zero(turn1.board.v_edges) !== 0
            ) {
                throw new Error(
                    "After H(0,0), edges not placed correctly: " +
                    stringify(turn1.board)
                );
            }
            // Next player must be 2.
            if (turn1.next_player !== 2) {
                throw new Error(
                    "Expected next_player=2 after H(0,0), got " +
                    turn1.next_player
                );
            }

            // Move 2: player2 draws V(0,0). Still does NOT close box.
            const turn2 = Dots_and_boxes.make_move(
                2,
                "V",
                0,
                0,
                turn1.board
            );
            if (
                count_non_zero(turn2.board.h_edges) !== 1 ||
                count_non_zero(turn2.board.v_edges) !== 1
            ) {
                throw new Error(
                    "After V(0,0), edges not placed correctly: " +
                    stringify(turn2.board)
                );
            }
            if (turn2.next_player !== 1) {
                throw new Error(
                    "Expected next_player=1 after V(0,0), got " +
                    turn2.next_player
                );
            }

            // Move 3: player1 draws H(1,0). Still not closing box.
            const turn3 = Dots_and_boxes.make_move(
                1,
                "H",
                1,
                0,
                turn2.board
            );
            if (
                count_non_zero(turn3.board.h_edges) !== 2 ||
                count_non_zero(turn3.board.v_edges) !== 1
            ) {
                throw new Error(
                    "After H(1,0), edges not placed correctly: " +
                    stringify(turn3.board)
                );
            }
            if (turn3.next_player !== 2) {
                throw new Error(
                    "Expected next_player=2 after H(1,0), got " +
                    turn3.next_player
                );
            }

            // Move 4: player2 draws V(0,1). That closes the single box.
            const turn4 = Dots_and_boxes.make_move(
                2,
                "V",
                0,
                1,
                turn3.board
            );
            // Now there should be exactly 2 horiz + 2 vert edges.
            if (
                count_non_zero(turn4.board.h_edges) !== 2 ||
                count_non_zero(turn4.board.v_edges) !== 2
            ) {
                throw new Error(
                    "After V(0,1), edges count is wrong: " +
                    stringify(turn4.board)
                );
            }
            // The only box (owners[0][0]) must be claimed by player2.
            if (
                turn4.board.owners.length !== 1 ||
                turn4.board.owners[0][0] !== 2
            ) {
                throw new Error(
                    "After closing box, owners not updated: " +
                    stringify(turn4.board.owners)
                );
            }
            // Because player2 claimed a box, nextPlayer remains 2.
            if (turn4.next_player !== 2) {
                throw new Error(
                    "Expected nextPlayer=2 (same) after closing box, got " +
                    turn4.next_player
                );
            }
        }
    );

    it(
        "get_score, winner, count_player_edges, count_player_boxes",
        function () {
            // Build a 3×3 board where owner (0,0)=1 and (1,1)=2.
            const board = Dots_and_boxes.create_board(3, 3);
            const manual_owners = [
                [1, 0],
                [0, 2]
            ];
            const test_board = {
                h_edges: board.h_edges,
                v_edges: board.v_edges,
                owners: manual_owners
            };

            // get_score should return {player1:1, player2:1}.
            const scores = Dots_and_boxes.get_score(test_board);
            if (scores.player1 !== 1 || scores.player2 !== 1) {
                throw new Error(
                    "get_score incorrect: " + stringify(scores)
                );
            }

            // winner() should be 0 (tie).
            if (Dots_and_boxes.winner(test_board) !== 0) {
                throw new Error(
                    "winner() should be 0 for a tie, got " +
                    Dots_and_boxes.winner(test_board)
                );
            }

            // If we give player1 one more box: (0,1)=1.
            const manual_owners2 = [
                [1, 1],
                [0, 2]
            ];
            const test_board2 = {
                h_edges: board.h_edges,
                v_edges: board.v_edges,
                owners: manual_owners2
            };
            const scores2 = Dots_and_boxes.get_score(test_board2);
            if (scores2.player1 !== 2 || scores2.player2 !== 1) {
                throw new Error(
                    "get_score incorrect after extra box: " +
                    stringify(scores2)
                );
            }
            // Now winner() should be 1.
            if (Dots_and_boxes.winner(test_board2) !== 1) {
                throw new Error(
                    "winner() should be 1 when player1 leads, but got " +
                    Dots_and_boxes.winner(test_board2)
                );
            }

            // count_player_edges: place a few edges.
            const hA = Dots_and_boxes.update_h_edges(
                board.h_edges,
                0,
                0,
                1,
                true
            );
            const hB = Dots_and_boxes.update_h_edges(
                hA,
                1,
                0,
                2,
                true
            );
            const vA = Dots_and_boxes.update_v_edges(
                board.v_edges,
                0,
                1,
                1,
                true
            );
            const vB = Dots_and_boxes.update_v_edges(
                vA,
                1,
                1,
                2,
                true
            );
            const custom_board = {
                h_edges: hB,
                v_edges: vB,
                owners: board.owners
            };

            if (Dots_and_boxes.count_player_edges(custom_board, 1) !== 2) {
                throw new Error(
                    "Expected player1 to have 2 edges, got " +
                    Dots_and_boxes.count_player_edges(custom_board, 1)
                );
            }
            if (Dots_and_boxes.count_player_edges(custom_board, 2) !== 2) {
                throw new Error(
                    "Expected player2 to have 2 edges, got " +
                    Dots_and_boxes.count_player_edges(custom_board, 2)
                );
            }

            // count_player_boxes: use testBoard2 (p1=2 boxes, p2=1 box).
            const cb1 = Dots_and_boxes.count_player_boxes(test_board2, 1);
            const cb2 = Dots_and_boxes.count_player_boxes(test_board2, 2);
            if (cb1 !== 2 || cb2 !== 1) {
                throw new Error(
                    "count_player_boxes incorrect: p1=" + cb1 + ", p2=" + cb2
                );
            }
        }
    );

    it(
        "Edge cases: make_move on ended board or occupied slot returns "
        + "undefined",
        function () {
            // Build a 2×2 board and immediately close its only box.
            const board = Dots_and_boxes.create_board(2, 2);
            const h0 = Dots_and_boxes.update_h_edges(
                board.h_edges,
                0,
                0,
                1,
                true
            );
            const h1 = Dots_and_boxes.update_h_edges(
                h0,
                1,
                0,
                1,
                true
            );
            const v0 = Dots_and_boxes.update_v_edges(
                board.v_edges,
                0,
                0,
                1,
                true
            );
            const v1 = Dots_and_boxes.update_v_edges(
                v0,
                0,
                1,
                1,
                true
            );
            const closed = {
                h_edges: h1,
                v_edges: v1,
                owners: [[1]]
            };

            // Now the only free_edges length is zero → game ended.
            if (!Dots_and_boxes.is_ended(closed)) {
                throw new Error("Expected board to be ended");
            }
            // Attempting any move on an ended board must return undefined.
            const illegal = Dots_and_boxes.make_move(
                1,
                "H",
                0,
                0,
                closed
            );
            if (illegal !== undefined) {
                throw new Error(
                    "Expected make_move on ended board to return undefined"
                );
            }

            // Also test an occupied edge: try to draw H(0,0) again.
            const board2 = Dots_and_boxes.create_board(2, 2);
            const first_move = Dots_and_boxes.make_move(
                1,
                "H",
                0,
                0,
                board2
            );
            // Now H(0,0) is occupied. A second move there must return
            // undefined.
            const illegal2 = Dots_and_boxes.make_move(
                2,
                "H",
                0,
                0,
                first_move.board
            );
            if (illegal2 !== undefined) {
                throw new Error(
                    "Expected make_move on occupied edge to return undefined"
                );
            }
        }
    );
});
