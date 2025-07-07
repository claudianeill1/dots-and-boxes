const R = window.R;
/**
 * Dots_and_boxes.js models and plays the Dots & Boxes game.
 * @namespace Dots_and_boxes
 * @author Claudia Neill
 * @version 2025
 */
const Dots_and_boxes = Object.create(null);

/**
 * The board state, with separate matrices for horizontal edges, vertical
 * edges, and boxes.
 * The board is usually square, made up of dots at each corner. Lines can be
 * drawn both vertically and horizontally, to surround a box.
 * @memberof Dots_and_boxes
 * @typedef {Object} Board
 * @property {number[][]} h_edges Horizontal edges matrix: [rows] x [cols - 1]
 * @property {number[][]} v_edges Vertical edges matrix: [rows - 1] x [cols]
 * @property {number[][]} owners Box-ownership matrix: [rows - 1] x [cols - 1]
 */

/**
 * A line is coloured depending on the player who placed it between two
 * vertical or horizontal dots.
 * @memberof Dots_and_boxes
 * @typedef {(1 | 2)} Line
 */

/**
 * A box is coloured depending on the player who placed the final line which
 * enclosed it.
 * @memberof Dots_and_boxes
 * @typedef {(1 | 2)} Box
 */

/**
 * Coordinates of the four edges surrounding a box.
 * @memberof Dots_and_boxes
 * @typedef {Object} Box_edges
 * @property {Tuple2} top A two-element array [row, col] for the edge above
 * the box.
 * @property {Tuple2} bottom A two-element array [row, col] for the edge
 * below the box.
 * @property {Tuple2} left A two-element array [row, col] for the edge to the
 * left of the box.
 * @property {Tuple2} right A two-element array [row, col] for the edge to
 * the right of the box.
 */

/**
 * A simple row/column coordinate
 * @memberof Dots_and_boxes
 * @typedef {Object} Coord
 * @property {number} row Zero-based row index
 * @property {number} col Zero-based column index
 */

/**
 * Options for making a move
 * @memberof Dots_and_boxes
 * @typedef {Object} Move_options
 * @property {1|2} player Who is playing
 * @property {"H"|"V"} dir "H" for horizontal line, "V" for vertical line
 * @property {number} row Row in the edge matrix
 * @property {number} col Column in the edge matrix
 */

/**
 * Result of a move: new board and the next player
 * @memberof Dots_and_boxes
 * @typedef {Object} Move_result
 * @property {Dots_and_boxes.Board} board Updated board state
 * @property {1|2} next_player Who's turn is next
 */

/**
 * @memberof Dots_and_boxes
 * @typedef {number[]} Tuple2
 * A two-element array [row, col] of indices.
 */

/**
 * @typedef {Object} Free_edge
 * @property {"H"|"V"} dir   "H" for horizontal, "V" for vertical.
 * @property {number} row  Row index in the chosen edge matrix.
 * @property {number} col  Column index in the chosen edge matrix.
 */

/**
 * Create a new empty board; defaults to 9x9 dots (8x8 boxes)
 * Optionally with a specified width and height
 *
 * @example
 * const board = Dots_and_boxes.create_board(5, 5);
 * console.log(board.h_edges.length); // 5
 * console.log(board.v_edges.length); // 4
 * console.log(board.owners.length);  // 4
 *
 * @memberof Dots_and_boxes
 * @function create_board
 * @param {number} [width = 9] Number of dots across
 * @param {number} [height = 9] Number of dots down
 * @returns {Dots_and_boxes.Board} An empty board for a new game
 */
Dots_and_boxes.create_board = (width = 9, height = 9) => ({
    h_edges: R.times(() => R.repeat(0, width - 1), height),
    v_edges: R.times(() => R.repeat(0, width), height - 1),
    owners: R.times(() => R.repeat(0, width - 1), height - 1)
});

/**
 * This helper function takes a board’s horizontal‐edge matrix (h_edges),
 * and for each possible horizontal slot returns either the coordinates
 * [rowIndex, colIndex] if that slot is still empty, or "-1" if claimed.
 * @memberof Dots_and_boxes
 * @function label_free_h_edges
 * @param {Dots_and_boxes.Board} board The board to label horizontal edges.
 * @returns {Array.<Array.<(Tuple2|number)>>} A 2D array (same shape as
 * board.h_edges) where each cell is either a two-element Tuple2 ([row, col])
 * or -1.
 */
Dots_and_boxes.label_free_h_edges = function (board) {
    return R.addIndex(R.map)(function (row, row_idx) {
        return R.addIndex(R.map)(function (cell, col_idx) {
            return (
                cell === 0
                ? [row_idx, col_idx] // if true returns coordinate pair
                : -1 // if false returns -1
            );
        })(row);
    })(board.h_edges);
};

/**
 * This helper function takes a board’s vertical-edge matrix (v_edges),
 * and for each possible vertical slot returns either the coordinates
 * [rowIndex, colIndex] if that slot is still empty, or "-1" if claimed.
 * @memberof Dots_and_boxes
 * @function label_free_v_edges
 * @param {Dots_and_boxes.Board} board — The board to label vertical edges.
 * @returns {Array.<Array.<(Tuple2|number)>>} A 2D array (same shape as
 * board.v_edges) where each cell is either a two-element Tuple2 ([row, col])
 * or -1.
 */
Dots_and_boxes.label_free_v_edges = function (board) {
    return R.addIndex(R.map)(function (row, row_idx) {
        return R.addIndex(R.map)(function (cell, col_idx) {
            return (
                cell === 0
                ? [row_idx, col_idx] // if true returns coordinate pair
                : -1 // if false returns -1
            );
        })(row);
    })(board.v_edges);
};

/**
 * Returns an array of all free line positions (both horizontal and vertical).
 * @memberof Dots_and_boxes
 * @function free_edges
 * @param {Dots_and_boxes.Board} board The board to check for free edge slots.
 * @returns {Free_edge[]} Array of free-edge objects.
 */
Dots_and_boxes.free_edges = function (board) {
  // label, unnest, filter, and tag all free horizontal edges
    const free_horizontal = R.pipe(
        Dots_and_boxes.label_free_h_edges, // 2D
        R.unnest, // 1D
        R.filter(Array.isArray), // 1D, only those [r,c] pairs
        R.map(function (coords) {
            return {dir: "H", row: coords[0], col: coords[1]};
        })
    )(board);

  // label, unnest, filter, and tag all free vertical edges
    const free_vertical = R.pipe(
        Dots_and_boxes.label_free_v_edges, // 2D
        R.unnest, // 1D
        R.filter(Array.isArray), // 1D, only those [r,c] pairs
        R.map(function (coords) {
            return {dir: "V", row: coords[0], col: coords[1]};
        })
    )(board);

    // Concatenate both lists into one array of free‐edge objects
    return R.concat(free_horizontal, free_vertical);
};

/**
 * Has the game ended? No edges left mean it is complete.
 * @memberof Dots_and_boxes
 * @function is_ended
 * @param {Dots_and_boxes.Board} board
 * @returns {boolean} Whether the game has ended.
 */

Dots_and_boxes.is_ended = function (board) {
    return Dots_and_boxes.free_edges(board).length === 0;
};

/**
 * Returns the current score (number of completed boxes) for each player.
 * @memberof Dots_and_boxes
 * @function get_score
 * @param {Dots_and_boxes.Board} board The board to tally.
 * @returns {{player1: number, player2: number}} Object with counts of boxes
 * per player.
 */
Dots_and_boxes.get_score = function (board) {
    // Flatten the owners matrix into a single array of 0, 1, or 2
    const all_owners = R.flatten(board.owners);
    return {
        player1: R.count(R.equals(1), all_owners),
        player2: R.count(R.equals(2), all_owners)
    };
};

/**
 * Who's winning? 0 for a tie, 1 or 2 for the leading player.
 * @memberof Dots_and_boxes
 * @function winner
 * @param {Dots_and_boxes.Board} board The board to evaluate.
 * @returns {(0 | 1 | 2)}
 */
Dots_and_boxes.winner = function (board) {
    const scores = Dots_and_boxes.get_score(board);
    if (scores.player1 > scores.player2) {
        return 1;
    }
    if (scores.player2 > scores.player1) {
        return 2;
    }
    return 0;
};

/**
 * Total edges drawn by a player
 * @memberof Dots_and_boxes
 * @function count_player_edges
 * @param {Dots_and_boxes.Board} board
 * @param {(1|2)} player Which player’s edges to count.
 * @returns {number} The total number of edges drawn by that player.
 */
Dots_and_boxes.count_player_edges = function (board, player) {
    // Flatten both edge matrices into a single array of numbers
    const all_edges = R.concat(
        R.flatten(board.h_edges),
        R.flatten(board.v_edges)
    );
    return R.count(R.equals(player), all_edges);
};

/**
 * Counts how many boxes a given player owns.
 * @memberof Dots_and_boxes
 * @function count_player_boxes
 * @param {Dots_and_boxes.Board} board
 * @param {(1|2)} player Which player’s boxes to count.
 * @returns {number} The total number of boxes owned by that player.
 */
Dots_and_boxes.count_player_boxes = function (board, player) {
    // get_score returns { player1: n1, player2: n2 }
    const scores = Dots_and_boxes.get_score(board);
    return (
        player === 1
        ? scores.player1
        : scores.player2
    );
};


/**
 * For a box at (row, col), returns the four (matrix‐indices) positions
 * of its surrounding edges.
 * @memberof Dots_and_boxes
 * @function get_surrounding_edges
 * @param {number} row The zero‐based row index of the box (in owners).
 * @param {number} col The zero‐based column index of the box (in owners).
 * @returns {Box_edges}
 */
Dots_and_boxes.get_surrounding_edges = function (row, col) {
    // Compute each edge’s row/col in its respective matrix:
    const top_edge_row = row;
    const top_edge_col = col;

    const bottom_edge_row = row + 1;
    const bottom_edge_col = col;

    const left_edge_row = row;
    const left_edge_col = col;

    const right_edge_row = row;
    const right_edge_col = col + 1;

    return {
        top: [top_edge_row, top_edge_col],
        bottom: [bottom_edge_row, bottom_edge_col],
        left: [left_edge_row, left_edge_col],
        right: [right_edge_row, right_edge_col]
    };
};

/**
 * Checks if all four edges around a box are drawn (nonzero).
 * @memberof Dots_and_boxes
 * @function is_enclosed
 * @param {number[][]} h_edges The horizontal edges matrix.
 * @param {number[][]} v_edges The vertical edges matrix.
 * @param {number} row The box’s row index.
 * @param {number} col The box’s column index.
 * @returns {boolean} True if top, bottom, left, and right edges not 0.
 */
Dots_and_boxes.is_enclosed = function (h_edges, v_edges, row, col) {
    // Compute the four edge‐indices using get_surrounding_edges:
    const coords = Dots_and_boxes.get_surrounding_edges(row, col);
    const top_row = coords.top[0];
    const top_col = coords.top[1];
    const bottom_row = coords.bottom[0];
    const bottom_col = coords.bottom[1];
    const left_row = coords.left[0];
    const left_col = coords.left[1];
    const right_row = coords.right[0];
    const right_col = coords.right[1];

    const top_row_arr = h_edges[top_row] || [];
    const bottom_row_arr = h_edges[bottom_row] || [];
    const left_row_arr = v_edges[left_row] || [];
    const right_row_arr = v_edges[right_row] || [];

    const top_edge = top_row_arr[top_col] || 0;
    const bottom_edge = bottom_row_arr[bottom_col] || 0;
    const left_edge = left_row_arr[left_col] || 0;
    const right_edge = right_row_arr[right_col] || 0;

    // Return true only if none of them is zero:
    return (
        top_edge !== 0 &&
        bottom_edge !== 0 &&
        left_edge !== 0 &&
        right_edge !== 0
    );
};

/**
 * Determines if the coordinates (row, col) point to a real box
 * inside the owners matrix (i.e., not outside the grid).
 * @memberof Dots_and_boxes
 * @function is_valid_box_position
 * @param {number[][]} owners The 2D owners array, where each entry is 0
 * (unclaimed), 1, or 2.
 * @param {number} row Row index of the box we want to check.
 * @param {number} col Column index of the box we want to check.
 * @returns {boolean} True if (row, col) is within the bounds of the owners
 * matrix; false otherwise.
 */
Dots_and_boxes.is_valid_box_position = function (owners, row, col) {
    const total_rows = owners.length;
    const total_cols = owners[0]?.length || 0;
    return row >= 0 && row < total_rows && col >= 0 && col < total_cols;
};

/**
 * Checks whether the box at (row, col) is already owned by a player.
 * @memberof Dots_and_boxes
 * @function is_already_claimed
 * @param {number[][]} owners The owners matrix.
 * @param {number} row The box’s row index.
 * @param {number} col The box’s column index.
 * @returns {boolean} True if owners[row][col] ≠ 0, false otherwise.
 */
Dots_and_boxes.is_already_claimed = function (owners, row, col) {
  // Check (row, col) is within the owners matrix
    const num_rows = owners.length;
    const num_cols = owners[0]?.length || 0;

    if (row < 0 || row >= num_rows || col < 0 || col >= num_cols) {
        return false; // Out of range, so it’s not “claimed”
    }
    return owners[row][col] !== 0;
};

/**
 * Determines if a box can be claimed: it must be in range, unclaimed,
 * and fully enclosed by nonzero edges.
 * @memberof Dots_and_boxes
 * @function is_box_claimable
 * @param {Dots_and_boxes.Board} board The current board.
 * @param {number} row The box’s row index.
 * @param {number} col The box’s column index.
 * @returns {boolean} True if the box at (row, col) exists, is unclaimed, and
 * is enclosed.
 */
Dots_and_boxes.is_box_claimable = function (board, row, col) {
    const {h_edges, v_edges, owners} = board;

    // 1) Must be within the owners matrix bounds
    if (!Dots_and_boxes.is_valid_box_position(owners, row, col)) {
        return false;
    }

    // 2) Must not already be claimed
    if (Dots_and_boxes.is_already_claimed(owners, row, col)) {
        return false;
    }
    // 3) Must be fully enclosed by four nonzero edges
    return Dots_and_boxes.is_enclosed(h_edges, v_edges, row, col);
};

/**
 * Returns a new owners matrix with the box at (row, col) set to player.
 * @memberof Dots_and_boxes
 * @function set_box_owner
 * @param {number[][]} owners The original owners matrix.
 * @param {number} row The box’s row index.
 * @param {number} col The box’s column index.
 * @param {(1|2)} player The player number to assign.
 * @returns {number[][]} A brand-new owners matrix with
 * owners[row][col] = player.
 */
Dots_and_boxes.set_box_owner = function (owners, row, col, player) {
    return R.adjust(
        row,
        function (old_row) {
            // Clone old_row but place player at index col
            return R.adjust(col, R.always(player), old_row);
        },
        owners
    );
};

/**
 * Attempts to claim the box at (row, col) if it is in-range, unclaimed, and
 * enclosed. Returns a new owners matrix if claimed and a flag indicating
 * success.
 * @memberof Dots_and_boxes
 * @function claim_box_if_enclosed
 * @param {Dots_and_boxes.Board} board The current board state.
 * @param {number} row The box’s row index.
 * @param {number} col The box’s column index.
 * @param {(1|2)} player The player to claim the box for.
 * @returns {{ new_owners: number[][], claimed: boolean }}
 * - new_owners: If claimed, a cloned owners matrix with
 *   owners[row][col] = player; otherwise the original owners matrix.
 * - claimed: True if this box was just claimed; false otherwise.
 */
Dots_and_boxes.claim_box_if_enclosed = function (board, row, col, player) {
    const {owners} = board;
    // If any of the claimable checks fail, do nothing
    if (!Dots_and_boxes.is_box_claimable(board, row, col)) {
        return {
            new_owners: owners,
            claimed: false
        };
    }

    // Otherwise, produce a brand-new owners matrix with that box set to player
    const new_owners = Dots_and_boxes.set_box_owner(owners, row, col, player);
    return {
        new_owners: new_owners,
        claimed: true
    };
};

/**
 * Determines who should move next based on whether the last move claimed
 * at least one box.
 * @memberof Dots_and_boxes
 * @function next_player
 * @param {(1|2)} last_player The player who just made a move.
 * @param {boolean} box_claimed True if that move claimed ≥1 box;
 * false otherwise.
 * @returns {(1|2)} If box_claimed is true, the same last_player goes again;
 * otherwise, the other player.
 */
Dots_and_boxes.next_player = function (last_player, box_claimed) {
    if (box_claimed) {
        return last_player;
    }
    return (
        last_player === 1
        ? 2
        : 1
    );
};

/**
 * Checks if a given edge position is still available (value === 0).
 *
 * @example
 * const board = Dots_and_boxes.create_board(3, 3);
 * console.log(Dots_and_boxes.is_edge_free("H", 1, 1, board)); // true
 *
 * @memberof Dots_and_boxes
 * @function is_edge_free
 * @param {"H"|"V"} dir "H" for horizontal, "V" for vertical.
 * @param {number} row Row index in the chosen edge matrix.
 * @param {number} col Column index in the chosen edge matrix.
 * @param {Dots_and_boxes.Board} board Current board state.
 * @returns {boolean} True if the edge is free (0), false otherwise.
 */
Dots_and_boxes.is_edge_free = function (dir, row, col, board) {
    const edges = (
        dir === "H"
        ? board.h_edges
        : board.v_edges
    );
  // explicit bounds check
    if (
        row < 0 || row >= edges.length ||
        col < 0 || col >= edges[0].length
    ) {
        return false;
    }
    return edges[row][col] === 0;
};

/**
 * Immutably updates a single cell in the horizontal‐edges matrix.
 * @memberof Dots_and_boxes
 * @function update_h_edges
 * @param {number[][]} h_edges Original horizontal edges matrix.
 * @param {number} row Row index to update.
 * @param {number} col Column index to update.
 * @param {(1|2)} player Player number to place (1 or 2).
 * @param {boolean} should_update True only if dir === "H".
 * @returns {number[][]} A new horizontal‐edges matrix with that one cell set
 * to player, or the original matrix if should_update is false.
 */
Dots_and_boxes.update_h_edges = function (
    h_edges,
    row,
    col,
    player,
    should_update
) {
    if (!should_update) {
        return h_edges;
    }
    return R.adjust(
        row,
        function (old_row) {
            return R.adjust(col, R.always(player), old_row);
        },
        h_edges
    );
};

/**
 * Immutably updates a single cell in the vertical‐edges matrix.
 * @memberof Dots_and_boxes
 * @function update_v_edges
 * @param {number[][]} v_edges Original vertical edges matrix.
 * @param {number} row Row index to update.
 * @param {number} col Column index to update.
 * @param {(1|2)} player Player number to place (1 or 2).
 * @param {boolean} should_update True only if dir === "V".
 * @returns {number[][]} A new vertical‐edges matrix with that one cell set to
 * player, or the original matrix if should_update is false.
 */
Dots_and_boxes.update_v_edges = function (
    v_edges,
    row,
    col,
    player,
    should_update
) {
    if (!should_update) {
        return v_edges;
    }
    return R.adjust(
        row,
        function (old_row) {
            return R.adjust(col, R.always(player), old_row);
        },
        v_edges
    );
};

/**
 * Return “H”‐ or “V”‐adjacent box coordinates for a given edge.
 * @memberof Dots_and_boxes
 * @function get_candidate_boxes
 * @param {"H"|"V"} dir "H" for horizontal, "V" for vertical.
 * @param {number} row Edge’s row index.
 * @param {number} col Edge’s column index.
 * @returns {Tuple2[]}  Exactly two [row, col] pairs.
 * - If dir === "H": [ [row − 1, col], [row, col] ] -> box above & below.
 * - If dir === "V": [ [row, col − 1], [row, col] ] -> box left & right.
 */
Dots_and_boxes.get_candidate_boxes = function (dir, row, col) {
    if (dir === "H") {
        return [
            [row - 1, col],  // box above the horizontal edge
            [row, col]   // box below the horizontal edge
        ];
    }
  // dir === "V"
    return [
        [row, col - 1], // box to the left of the vertical edge
        [row, col] // box to the right of the vertical edge
    ];
};

/**
 * Attempts to claim a single box at (box_row, box_col) if fully enclosed.
 * @memberof Dots_and_boxes
 * @function attempt_claim_for_box
 * @param {number[][]} h_edges Updated horizontal edges matrix.
 * @param {number[][]} v_edges Updated vertical edges matrix.
 * @param {number[][]} owners Current owners matrix before claiming.
 * @param {number} box_row Candidate box’s row index.
 * @param {number} box_col Candidate box’s column index.
 * @param {(1|2)} player The player who just drew the edge.
 * @returns {{ new_owners: number[][], claimed: boolean }}
 * - new_owners: a new owners matrix (with that box claimed if eligible).
 * - claimed: true if the box was claimed; false otherwise.
 */
Dots_and_boxes.attempt_claim_for_box = function (
    h_edges,
    v_edges,
    owners,
    box_row,
    box_col,
    player
) {
    return Dots_and_boxes.claim_box_if_enclosed(
        {h_edges, v_edges, owners},
        box_row,
        box_col,
        player
    );
};

/**
 * Process both adjacent boxes for a newly placed edge (dir,row,col),
 * claim any that are now fully enclosed, and return:
 * - new_owners: updated owners matrix
 * - boxes_closed: how many boxes were claimed in total (0, 1, or 2)
 * @memberof Dots_and_boxes
 * @function process_all_candidate_boxes
 * @param {"H"|"V"} dir "H" for horizontal, "V" for vertical
 * @param {number} row Edge’s row index
 * @param {number} col Edge’s column index
 * @param {1|2} player Who placed that edge
 * @param {number[][]} new_h Updated horizontal edges after placement
 * @param {number[][]} new_v Updated vertical edges after placement
 * @param {number[][]} owners Current owners matrix (before claiming)
 * @returns {{ new_owners: number[][], boxes_closed: number }}
 */
Dots_and_boxes.process_all_candidate_boxes = function (
    dir,
    row,
    col,
    player,
    new_h,
    new_v,
    owners
) {
    let result_owners = owners;
    let boxes_closed = 0;

    // Break out the candidate list so we can keep under 80 chars
    const candidates = Dots_and_boxes.get_candidate_boxes(
        dir,
        row,
        col
    );
    candidates.forEach(function (coords) {
        const box_row = coords[0];
        const box_col = coords[1];

        const response = Dots_and_boxes.attempt_claim_for_box(
            new_h,
            new_v,
            result_owners,
            box_row,
            box_col,
            player
        );
        const new_owners = response.new_owners;
        const claimed = response.claimed;

        if (claimed) {
            result_owners = new_owners;
            boxes_closed += 1;
        }
    });

    return {
        new_owners: result_owners,
        boxes_closed: boxes_closed
    };
};

/**
 * Immutably apply exactly one new edge placement to both h_edges and v_edges.
 * Chooses which matrix to update based on "dir".
 * @memberof Dots_and_boxes
 * @function apply_edge_to_board
 * @param {"H"|"V"} dir "H" for horizontal, "V" for vertical.
 * @param {number} row Row index in whichever matrix.
 * @param {number} col Column index in whichever matrix.
 * @param {(1|2)} player Which player is placing the edge.
 * @param {number[][]} h_edges Current horizontal edges matrix.
 * @param {number[][]} v_edges Current vertical edges matrix.
 * @returns {{ new_H: number[][], new_V: number[][] }}
 * - new_H: updated horizontal edges (if dir === "H"), else same as original
 *   h_edges
 * - new_V: updated vertical edges (if dir === "V"), else same as original
 *   v_edges
 */
Dots_and_boxes.apply_edge_to_board = function (
    dir,
    row,
    col,
    player,
    h_edges,
    v_edges
) {
  // If it’s an "H" move, update h_edges; otherwise leave it alone
    const new_H = Dots_and_boxes.update_h_edges(
        h_edges,
        row,
        col,
        player,
        dir === "H"
    );
  // If it’s a "V" move, update v_edges; otherwise leave it alone
    const new_V = Dots_and_boxes.update_v_edges(
        v_edges,
        row,
        col,
        player,
        dir === "V"
    );

    return {new_H, new_V};
};

/**
 * Draws one line for "player" at (dir, row, col), claims any enclosed boxes,
 * and returns both the updated board and who moves next.
 * Internally:
 * 1. Verifies the game isn’t ended and the chosen edge is free.
 * 2. Marks that edge (H or V).
 * 3. Claims any enclosed boxes.
 * 4. Increments scores.
 * 5. Returns the ID of the player who moves next.
 *
 * @example
 * const board = Dots_and_boxes.create_board(3, 3);
 * const result = Dots_and_boxes.make_move(1, "H", 0, 0, board);
 * console.log(result.next_player); // 2
 *
 * @memberof Dots_and_boxes
 * @function make_move
 * @param {(1|2)} player Which player (1 or 2) is making this move.
 * @param {"H"|"V"} dir "H" to draw a horizontal edge; "V" to draw a
 * vertical edge.
 * @param {number} row The row index in the chosen edge matrix.
 * @param {number} col The column index in the chosen edge matrix.
 * @param {Dots_and_boxes.Board} board The current board state.
 * @returns {{ board: Dots_and_boxes.Board, next_player: (1|2) } | undefined}
 * - If the move is illegal (game ended or edge already drawn), returns
 *   undefined.
 * - Otherwise returns an object containing:
 *   • "board": new board object with updated h_edges, v_edges, owners.
 *   • "next_player": if ≥1 box was claimed, same "player"; otherwise, the
 *     other player.
 */
Dots_and_boxes.make_move = function (player, dir, row, col, board) {
  // Step 1: Validate the move
    if (
        Dots_and_boxes.is_ended(board) ||
        !Dots_and_boxes.is_edge_free(dir, row, col, board)
    ) {
        return undefined;
    }

  // Step 2: Place the edge onto the board
    const {new_H, new_V} = Dots_and_boxes.apply_edge_to_board(
        dir,
        row,
        col,
        player,
        board.h_edges,
        board.v_edges
    );

  // Step 3: Claim any boxes that became enclosed
    const result = Dots_and_boxes.process_all_candidate_boxes(
        dir,
        row,
        col,
        player,
        new_H,
        new_V,
        board.owners
    );
    const new_owners = result.new_owners;
    const boxes_closed = result.boxes_closed;

  // Step 4: Decide who moves next
    const next_player = Dots_and_boxes.next_player(
        player,
        boxes_closed > 0
    );

  // Step 5: Return the updated board + next player
    return {
        board: {
            h_edges: new_H,
            v_edges: new_V,
            owners: new_owners
        },
        next_player: next_player
    };
};

export default Object.freeze(Dots_and_boxes);