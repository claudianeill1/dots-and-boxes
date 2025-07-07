import Dots_and_boxes from "./Dots_and_boxes.js";

// Global match-win tracker (used by showGameOver())
let playerWins = { "1": 0, "2": 0, ties: 0 };

// Other globals for managing game state and settings
let numBoxes; // number of boxes per side (gridSize)
let dotRows; // rows of dots = numBoxes + 1
let dotCols; // cols of dots = numBoxes + 1
let gameState; // current board representation
let currentPlayer; // whose turn it is (1 or 2)
let gameOver = false; // flag for end of game
let p1Name = "Player 1"; // default player names
let p2Name = "Player 2";
let lastP1Name = ""; // previous names for reset logic
let lastP2Name = "";
let p1Color = "red"; // default colour keywords
let p2Color = "blue";
let p1Emoji = "";
let p2Emoji = "";
let p1BoxRgba; // semi-transparent fills for boxes
let p2BoxRgba;
let focusTrapHandler;
let lastFocused = null;

// Theme definitions
const themeMap = {
  "cats-dogs": {emojis: ["🐱","🐶"]},
  "fairy-gremlin": {emojis: ["🧚🏼","🧌"]},
  "fire-water": {emojis: ["🔥","💧"]}
};

// Gather all necessary DOM elements for later use
function cacheDOM() {
  return {
    boardTable: window.document.getElementById("board"),
    turnNameEl: window.document.getElementById("turn-name"),
    movesCountEl: window.document.getElementById("moves-count"),
    player1ScoreEl: window.document.getElementById("player1-score"),
    player2ScoreEl: window.document.getElementById("player2-score"),
    player1CountEl: window.document.getElementById("player1-count"),
    player2CountEl: window.document.getElementById("player2-count"),
    fillLeftEl: window.document.getElementById("fill-left"),
    fillRightEl: window.document.getElementById("fill-right"),
    gridSizeSlider: window.document.getElementById("grid-size-slider"),
    gridSizeLabel: window.document.getElementById("grid-size-label"),
    setupOverlay: window.document.getElementById("start-overlay"),
    helpOverlay: window.document.getElementById("help-overlay"),
    gameOverOverlay: window.document.getElementById("game-over-overlay"),
    helpButton: window.document.getElementById("help-button"),
    closeHelpButton: window.document.getElementById("close-help-button"),
    startButton: window.document.getElementById("start-button"),
    newGameButton: window.document.getElementById("new-game-button"),
    themeSelect: window.document.getElementById("theme-select"),
    swapAssignBtn: window.document.getElementById("swap-assign"),
    player1NameInput: window.document.getElementById("player1-name"),
    player2NameInput: window.document.getElementById("player2-name"),
    player1WinsEl: window.document.getElementById("player1-wins"),
    player2WinsEl: window.document.getElementById("player2-wins"),
    tiesWinsEl: window.document.getElementById("ties-wins"),
    assignP1EmojiSpan: window.document.getElementById("assign-p1-emoji"),
    assignP2EmojiSpan: window.document.getElementById("assign-p2-emoji")
  };
}

// Begin UI setup once the DOM is loaded
window.addEventListener("DOMContentLoaded", onDomReady);

// Set up initial display and attach event listeners.
function onDomReady() {
  const {
    boardTable,
    gridSizeSlider,
    gridSizeLabel,
    themeSelect,
    swapAssignBtn,
    helpButton,
    closeHelpButton,
    startButton,
    newGameButton
  } = cacheDOM();

  // Slider
  updateSliderLabel(gridSizeSlider, gridSizeLabel);
  gridSizeSlider.addEventListener("input", onSliderInput);

  // Theme & Emoji swap
  themeSelect.addEventListener("change", onThemeChange);
  swapAssignBtn.addEventListener("click", onSwapAssignment);

  // Help overlay
  helpButton.addEventListener("click", onHelpOpen);
  closeHelpButton.addEventListener("click", onHelpClose);

  // Game start & reset
  startButton.addEventListener("click", onStartGame);
  newGameButton.addEventListener("click", onNewGame);

  // Edge interactions
  boardTable.addEventListener("pointerover", onEdgePointerOver);
  boardTable.addEventListener("pointerout", onEdgePointerOut);
  boardTable.addEventListener("focusin", onEdgeFocusIn);
  boardTable.addEventListener("focusout", onEdgeFocusOut);
  boardTable.addEventListener("pointerdown", onEdgePointerDown);
  boardTable.addEventListener("keydown", onBoardKeydown);

  // Initial theme & assignment display
  applyTheme(themeSelect.value);
  updateAssignmentUI();

  // Show settings overlay on first load
  onStartOpen();

  // Show help on first visit
  if (!localStorage.getItem("helpShownOnce")) {
    onHelpOpen();
  }
}


// Update the visible label for the grid-size slider.
function updateSliderLabel(slider, label) {
  label.textContent = `${slider.value} x ${slider.value}`;
  slider.setAttribute("aria-valuenow", slider.value);
}

// Respond to the grid-size slider being moved
function onSliderInput(e) {
  const slider = e.target;
  const {gridSizeLabel} = cacheDOM();
  updateSliderLabel(slider, gridSizeLabel);
}

// Apply the chosen theme to colours and emojis
function onThemeChange() {
  applyTheme(cacheDOM().themeSelect.value);
  updateAssignmentUI();
}

// Swap the two players' emojis and their highlight colours
function onSwapAssignment() {
  [p1Emoji, p2Emoji] = [p2Emoji, p1Emoji];
  [p1Color, p2Color] = [p2Color,  p1Color];
  [p1BoxRgba, p2BoxRgba] = [p2BoxRgba, p1BoxRgba];
  syncCSSVars();
  updateAssignmentUI();
}

// Reveal the help dialog.
function onHelpOpen() {
  const {helpOverlay, helpButton} = cacheDOM();
  helpOverlay.classList.remove("hidden");
  helpOverlay.querySelector("#close-help-button").focus();
  lastFocused = helpButton;
  trapFocus(helpOverlay);
}

// Hide the help dialog
function onHelpClose() {
  const {helpOverlay, helpButton} = cacheDOM();
  releaseFocus(helpOverlay);
  helpOverlay.classList.add("hidden");
  helpButton.focus();
  localStorage.setItem("helpShownOnce", "true");
}

// Trap tab/shift+tab focus inside the given dialog element
function trapFocus(dialog) {
  const focusable = dialog.querySelectorAll(
    `button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  focusTrapHandler = function(e) {
    if (e.key !== "Tab") {
      return;
    }
    if (e.shiftKey) {
      // If Shift+Tab on first, move to last
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // If Tab on last, move to first
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  dialog.addEventListener("keydown", focusTrapHandler);
}

// Release the focus trap from the given dialog
function releaseFocus(dialog) {
  dialog.removeEventListener("keydown", focusTrapHandler);
  focusTrapHandler = null;
}

// Show the settings overlay, focus its first input, and trap tab inside it
function onStartOpen() {
  const {setupOverlay, player1NameInput} = cacheDOM();
  setupOverlay.classList.remove("hidden");
  player1NameInput.focus();
  trapFocus(setupOverlay);
}

// Hide the settings overlay and release its focus trap
function onStartClose() {
  const {setupOverlay} = cacheDOM();
  releaseFocus(setupOverlay);
  setupOverlay.classList.add("hidden");
}

// Begin a new game according to current settings
function onStartGame() {
  const {
    player1NameInput,
    player2NameInput,
    themeSelect
  } = cacheDOM();

  // Read names, reset tallies if changed
  const newP1 = player1NameInput.value.trim() || "Player 1";
  const newP2 = player2NameInput.value.trim() || "Player 2";
  if (newP1 !== lastP1Name || newP2 !== lastP2Name) {
    playerWins = { "1": 0, "2": 0, ties: 0 };
  }
  p1Name = newP1;
  lastP1Name = newP1;

  p2Name = newP2;
  lastP2Name = newP2;

  // Apply the chosen theme
  applyTheme(themeSelect.value);

  // Close settings overlay and release its focus trap
  onStartClose();

  // Start the game
  initGame();
}

function onEdgePointerOver(e) {
  const edge = e.target.closest(".edge-h, .edge-v");
  if (!edge || gameOver || edge.classList.contains("claimed")) {
    return;
  }
  edge.style.backgroundColor = (currentPlayer === 1 ? p1Color : p2Color);
  edge.style.opacity = 0.5;
}

function onEdgePointerOut(e) {
  const edge = e.target.closest(".edge-h, .edge-v");
  if (!edge || edge.classList.contains("claimed")) {
    return;
  }
  edge.style.opacity = 0;
}

function onEdgeFocusIn(e) {
  const edge = e.target.closest(".edge-h, .edge-v");
  if (!edge || gameOver || edge.classList.contains("claimed")) {
    return;
  }
  edge.style.backgroundColor = (currentPlayer === 1 ? p1Color : p2Color);
  edge.style.opacity = 0.5;
}

function onEdgeFocusOut(e) {
  const edge = e.target.closest(".edge-h, .edge-v");
  if (!edge || edge.classList.contains("claimed")) {
    return;
  }
  edge.style.opacity = 0;
}

function onEdgePointerDown(e) {
  const edge = e.target.closest(".edge-h, .edge-v");
  if (!edge || gameOver || edge.classList.contains("claimed")) {
    return;
  }
  handleEdgeClick(
    edge.dataset.dir,
    Number(edge.dataset.row),
    Number(edge.dataset.col),
    edge
  );
}

// Return to the setup overlay for another match
function onNewGame() {
  const { gameOverOverlay, startButton } = cacheDOM();
  // Release the game-over focus trap
  releaseFocus(gameOverOverlay);
  // Hide the overlay
  gameOverOverlay.classList.add("hidden");
  // Return focus to “Begin Game”
  startButton.focus();
  // Re-open the settings overlay via your helper (which also traps)
  onStartOpen();
}

// Apply theme settings into CSS variables and JS state
function applyTheme(key) {
  document.documentElement.className = `theme-${key}`;
  const styles = getComputedStyle(document.documentElement);
  p1Color = styles.getPropertyValue("--theme-p1-color").trim();
  p2Color = styles.getPropertyValue("--theme-p2-color").trim();
  p1BoxRgba = convertColorNameToRgba(p1Color, 0.2);
  p2BoxRgba = convertColorNameToRgba(p2Color, 0.2);
  [p1Emoji, p2Emoji] = themeMap[key].emojis;
  syncCSSVars();
}

// Synchroise JS colour and emoji into CSS custom-properties
function syncCSSVars() {
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty("--player1-color", p1Color);
  rootStyle.setProperty("--player2-color", p2Color);
  rootStyle.setProperty("--dot-emoji", `"${p1Emoji}"`);
}

// Update the assignment display with current emojis
function updateAssignmentUI() {
  const {assignP1EmojiSpan, assignP2EmojiSpan} = cacheDOM();
  assignP1EmojiSpan.textContent = p1Emoji;
  assignP2EmojiSpan.textContent = p2Emoji;

  window.document.getElementById("player1-icon").textContent = p1Emoji;
  window.document.getElementById("player2-icon").textContent = p2Emoji;
}

// Initialise a fresh game board and focus the first avaliable edge
function initGame() {
  const {
    boardTable,
    turnNameEl,
    movesCountEl,
    gridSizeSlider
  } = cacheDOM();

  gameOver = false;
  numBoxes = parseInt(gridSizeSlider.value, 10);
  dotRows = numBoxes + 1;
  dotCols = numBoxes + 1;
  document.documentElement.style.setProperty("--grid-rows", dotRows);
  document.documentElement.style.setProperty("--grid-cols", dotCols);
  gameState = Dots_and_boxes.create_board(dotCols, dotRows);
  currentPlayer = 1;

  turnNameEl.textContent = p1Name;
  buildGrid(boardTable);
  updateScoreDisplay();

  const totalEdges = dotRows * (dotCols - 1) + (dotRows - 1) * dotCols;
  movesCountEl.textContent = String(totalEdges);

  const firstEdge = boardTable.querySelector(
    ".edge-h:not(.claimed),.edge-v:not(.claimed)");
  if (firstEdge) {
    firstEdge.focus();
  }
}

// Construct the grid of dots and edges in the DOM
function buildGrid(boardTable) {
  boardTable.innerHTML = "";

  // For each row index…
  R.range(0, dotRows).forEach(function (r) {
    const tr = document.createElement("tr");

    // …and each column index
    R.range(0, dotCols).forEach(function (c) {
      const td = document.createElement("td");
      td.className = "cell";

      // Dot
      const dot = document.createElement("div");
      dot.className = "dot";
      td.appendChild(dot);

      // Horizontal edge (if not at end of row)
      if (c < dotCols - 1) {
        const hEdge = document.createElement("div");
        hEdge.className = "edge-h";
        hEdge.tabIndex = 0;
        hEdge.dataset.dir = "H";
        hEdge.dataset.row = r;
        hEdge.dataset.col = c;
        td.appendChild(hEdge);
      }

      // Vertical edge (if not at bottom of grid)
      if (r < dotRows - 1) {
        const vEdge = document.createElement("div");
        vEdge.className = "edge-v";
        vEdge.tabIndex = 0;
        vEdge.dataset.dir = "V";
        vEdge.dataset.row = r;
        vEdge.dataset.col = c;
        td.appendChild(vEdge);
      }
      tr.appendChild(td);
    });
    boardTable.appendChild(tr);
  });
}

// Handle keyboard navigation and claiming on edges
function onBoardKeydown(e) {
  const edge = e.target.closest(".edge-h, .edge-v");
  if (!edge || gameOver) {
    return;
  }

  // Claim with appropriate key
  if ((currentPlayer === 1 && e.key === " ") ||
      (currentPlayer === 2 && e.key === "Enter")) {
    e.preventDefault();
    return handleEdgeClick(
      edge.dataset.dir, Number(edge.dataset.row), Number(edge.dataset.col),
      edge);
  }

  // Move focus according to controls
  const navKeysP1 = /^[WASDwasd]$/;
  const navKeysP2 = /^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/;

  if ((currentPlayer === 1 && navKeysP1.test(e.key)) ||
      (currentPlayer === 2 && navKeysP2.test(e.key))) {
    e.preventDefault();
    moveFocus(e.key, Number(edge.dataset.row), Number(edge.dataset.col),
    edge.dataset.dir);
  }
}

// Claim an edge, fill any completed boxes, update scores, switch turns
function handleEdgeClick(dir, row, col, edgeDiv) {
  // bail out if game already over or edge is no longer free
  if (gameOver || !Dots_and_boxes.is_edge_free(dir, row, col, gameState)) {
    return;
  }

  // let the game logic process the move
  const result = Dots_and_boxes.make_move(
    currentPlayer, dir, row, col, gameState);
  if (!result) {
    return;
  }

  // update the underlying board state
  gameState = result.board;

  // visually claim the edge
  edgeDiv.classList.add("claimed", `player-${currentPlayer}`);
  edgeDiv.style.backgroundColor = (currentPlayer === 1 ? p1Color : p2Color);
  edgeDiv.setAttribute("aria-disabled", "true");
  edgeDiv.tabIndex = -1;
  edgeDiv.style.opacity = 1;
  edgeDiv.style.pointerEvents = "none";

  // decrement the moves-left counter by one
  const movesLeftEl = cacheDOM().movesCountEl;
  const prev = Number(movesLeftEl.textContent) || 0;
  movesLeftEl.textContent = String(prev - 1);

  // repaint any boxes that have been completed
  paintClaimedBoxes();

  // update sidebar scores
  updateScoreDisplay();

  // switch turn and update the “next player” display
  currentPlayer = result.next_player;
  cacheDOM().turnNameEl.textContent = (currentPlayer === 1 ? p1Name : p2Name);

  // if the game is over, show the overlay with the correct message
  if (Dots_and_boxes.is_ended(gameState)) {
    gameOver = true;
    showGameOver();
  }
}

// Fill in any boxes that have just been completed
function paintClaimedBoxes() {
  document.querySelectorAll(".claimed-box, .claimed-box-emoji")
          .forEach(function(el) { el.remove(); });

  // for each box in the game state…
  gameState.owners.forEach(function(rowOwners, r) {
    rowOwners.forEach(function(owner, c) {
      if (!owner) {
        return;
      }

      // find the corresponding table cell
      const cell = cacheDOM().boardTable.rows[r].cells[c];

      // add the coloured fill
      const fill = document.createElement("div");
      fill.className = "claimed-box";
      fill.style.backgroundColor = (owner === 1 ? p1BoxRgba : p2BoxRgba);
      cell.appendChild(fill);

      // overlay the emoji, sized to ~60% of the smaller dimension
      const emojiOverlay = document.createElement("div");
      emojiOverlay.className = "claimed-box-emoji";
      emojiOverlay.textContent = (owner === 1 ? p1Emoji : p2Emoji);

      const { width, height } = cell.getBoundingClientRect();
      const size = Math.min(width, height) * 0.6;
      emojiOverlay.style.fontSize = `${size}px`;

      cell.appendChild(emojiOverlay);
    });
  });
}

// Update scores display and progress bar widths
function updateScoreDisplay() {
  const scores = Dots_and_boxes.get_score(gameState);
  const DOM = cacheDOM();

  DOM.player1ScoreEl.textContent = `${p1Name}: ${scores.player1}`;
  DOM.player2ScoreEl.textContent = `${p2Name}: ${scores.player2}`;

  const totalClaimed = scores.player1 + scores.player2;
  const claimedLeft = (totalClaimed
    ? (scores.player1 / totalClaimed) * 100
    : 50
  );

  DOM.fillLeftEl.style.width  = `${claimedLeft}%`;
  DOM.fillRightEl.style.width = `${100 - claimedLeft}%`;
}

// Show the end-of-game overlays and update tallies
function showGameOver() {
  const {
    gameOverOverlay,
    newGameButton,
    player1WinsEl,
    player2WinsEl,
    tiesWinsEl
  } = cacheDOM();

  // Update the overlay’s <h2 id="game-over-title">…
  const winner = Dots_and_boxes.winner(gameState);
  const titleText = (winner === 0
    ? "Game over — It's a tie!"
    : winner === 1
      ? `Game over — ${p1Name} Wins!`
      : `Game over — ${p2Name} Wins!`
    );
  document.getElementById("game-over-title").textContent = titleText;

  // Update the tallies
  if (winner === 0) {
    playerWins.ties += 1;
  } else {
    playerWins[winner.toString() ]+= 1;
  }

  player1WinsEl.textContent = `${p1Name} Wins: ${playerWins["1"]}`;
  player2WinsEl.textContent = `${p2Name} Wins: ${playerWins["2"]}`;
  tiesWinsEl.textContent = `Ties: ${playerWins.ties}`;

  // Show the overlay, trap focus, focus the New Game button
  gameOverOverlay.classList.remove("hidden");
  newGameButton.focus();
  trapFocus(gameOverOverlay);
}

// Move keyboard focus according to pressed key and current player
function moveFocus(key, row, col, dir) {
  const orient = dir.toLowerCase();  // "h" or "v"

  // Determine the maximum index for this orientation
  // For horizontal edges: max index = numBoxes - 1
  // For vertical edges: max index = numBoxes
  const maxIndex = (orient === "h"
    ? numBoxes
    : numBoxes + 1
  );

  // Map WASD to arrow names for player 1
  let arrowKey;
  if (key.length === 1) {
    const keyToArrow = {
        W: "ArrowUp",
        A: "ArrowLeft",
        S: "ArrowDown",
        D: "ArrowRight"
    };
    arrowKey = keyToArrow[key.toUpperCase()];
  } else {
    arrowKey = key;
  }

  let nextEl = null;

  if (arrowKey === "ArrowLeft") {
    const range = R.reverse(R.range(0, col));
    nextEl = R.find(
      R.identity,
      range.map((nc) =>
        document.querySelector(
          `.edge-${orient}[data-row="${row}"][data-col="${nc}"]`)
      )
    );
  }
  else if (arrowKey === "ArrowRight") {
    const colsToCheck = R.range(col + 1, maxIndex);
    nextEl = R.find(
      R.identity,
      colsToCheck.map(function (nc) {
        return document.querySelector(
          ".edge-" + orient +
          "[data-row=\"" + row + "\"]" +
          "[data-col=\"" + nc + "\"]"
        );
      })
    );
  }
  else if (arrowKey === "ArrowDown") {
    nextEl = (orient === "h"
      ? document.querySelector(
        `.edge-v[data-row="${row}"][data-col="${col}"]`)
      : document.querySelector(
        `.edge-h[data-row="${
          row + 1}"][data-col="${Math.min(col, numBoxes - 1)}"]`));
  }
  else if (arrowKey === "ArrowUp") {
    nextEl = (orient === "h"
      ? document.querySelector(
        `.edge-v[data-row="${row - 1}"][data-col="${col}"]`)
      : document.querySelector(
        `.edge-h[data-row="${row}"][data-col="${Math.min(
          col, numBoxes - 1)}"]`));
  }
  if (nextEl) {
    nextEl.focus();
  }
}

// Convert a CSS colour name or hex code to an rgba() string
function convertColorNameToRgba(name, alpha) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = name;
  const parsed = ctx.fillStyle; // normalised to #rrggbb or rgb()

  let r;
  let g;
  let b;
  if (parsed.startsWith("#")) {
    const bigint = parseInt(parsed.slice(1), 16);
    r = Math.floor(bigint / 65536) % 256;
    g = Math.floor(bigint / 256) % 256;
    b = bigint % 256;
  } else {
    [r, g, b] = parsed.match(/\d+/g).map(Number);
  }
  return `rgba(${r},${g},${b},${alpha})`;
}