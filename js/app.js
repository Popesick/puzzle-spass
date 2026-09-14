// UI- und Spiellogik: Ansichten wechseln, Galerie/Teileauswahl rendern,
// Drag & Drop (Maus + Touch via Pointer Events), Snapping, Responsive-Layout.

(() => {
  const els = {
    galleryGrid: document.getElementById("gallery-grid"),
    viewGallery: document.getElementById("view-gallery"),
    viewSetup: document.getElementById("view-setup"),
    viewPuzzle: document.getElementById("view-puzzle"),
    setupBackBtn: document.getElementById("setup-back-btn"),
    setupTitle: document.getElementById("setup-title"),
    setupPreviewImg: document.getElementById("setup-preview-img"),
    pieceCountOptions: document.getElementById("piece-count-options"),
    startPuzzleBtn: document.getElementById("start-puzzle-btn"),
    puzzleBackBtn: document.getElementById("puzzle-back-btn"),
    puzzleTitle: document.getElementById("puzzle-title"),
    puzzleProgress: document.getElementById("puzzle-progress"),
    puzzlePreviewBtn: document.getElementById("puzzle-preview-btn"),
    boardWrap: document.getElementById("board-wrap"),
    board: document.getElementById("board"),
    boardGuideImg: document.getElementById("board-guide-img"),
    trayWrap: document.getElementById("tray-wrap"),
    tray: document.getElementById("tray"),
    loadingOverlay: document.getElementById("loading-overlay"),
    loadingText: document.getElementById("loading-text"),
    winOverlay: document.getElementById("win-overlay"),
    winText: document.getElementById("win-text"),
    winReplayBtn: document.getElementById("win-replay-btn"),
    winGalleryBtn: document.getElementById("win-gallery-btn"),
    dragLayer: document.getElementById("drag-layer"),
  };

  let selectedImage = null;
  let selectedPieceCount = null;
  let game = null; // aktueller Puzzle-Zustand

  function showView(view) {
    [els.viewGallery, els.viewSetup, els.viewPuzzle].forEach(v => v.classList.remove("view--active"));
    view.classList.add("view--active");
  }

  // ---------- Galerie ----------
  function renderGallery() {
    els.galleryGrid.innerHTML = "";
    PUZZLE_GALLERY.forEach(item => {
      const card = document.createElement("button");
      card.className = "gallery-card";
      card.innerHTML = `
        <img src="${item.thumb}" alt="${item.title}" loading="lazy" />
        <div class="gallery-card-info">
          <div class="gallery-card-title">${item.title}</div>
          <span class="gallery-card-category">${item.category}</span>
        </div>`;
      card.addEventListener("click", () => openSetup(item));
      els.galleryGrid.appendChild(card);
    });
  }

  function openSetup(item) {
    selectedImage = item;
    selectedPieceCount = null;
    els.setupTitle.textContent = item.title;
    els.setupPreviewImg.src = item.full;
    els.setupPreviewImg.alt = item.title;
    els.startPuzzleBtn.disabled = true;

    els.pieceCountOptions.innerHTML = "";
    PIECE_COUNT_OPTIONS.forEach(count => {
      const btn = document.createElement("button");
      btn.className = "piece-count-btn";
      btn.innerHTML = `${count}<span>Teile</span>`;
      btn.addEventListener("click", () => {
        selectedPieceCount = count;
        [...els.pieceCountOptions.children].forEach(c => c.classList.remove("selected"));
        btn.classList.add("selected");
        els.startPuzzleBtn.disabled = false;
      });
      els.pieceCountOptions.appendChild(btn);
    });

    showView(els.viewSetup);
  }

  els.setupBackBtn.addEventListener("click", () => showView(els.viewGallery));
  els.puzzleBackBtn.addEventListener("click", () => {
    teardownGame();
    showView(els.viewGallery);
  });

  els.startPuzzleBtn.addEventListener("click", () => {
    if (!selectedImage || !selectedPieceCount) return;
    startPuzzle(selectedImage, selectedPieceCount);
  });

  // ---------- Puzzle-Start ----------
  function startPuzzle(item, pieceCount) {
    els.loadingText.textContent = "Puzzle wird vorbereitet...";
    els.loadingOverlay.hidden = false;

    const img = new Image();
    img.onload = () => {
      // kurze Verzoegerung, damit der Spinner sicher gerendert wird bevor die
      // (synchrone, ggf. rechenintensive) Teile-Erzeugung den Thread blockiert
      setTimeout(() => {
        buildGame(item, img, pieceCount);
        els.loadingOverlay.hidden = true;
        showView(els.viewPuzzle);
      }, 30);
    };
    img.onerror = () => {
      els.loadingOverlay.hidden = true;
      alert("Bild konnte nicht geladen werden.");
    };
    img.src = item.full;
  }

  const boardResizeObserver = new ResizeObserver(() => {
    if (game) relayoutBoard();
  });

  function teardownGame() {
    if (!game) return;
    boardResizeObserver.disconnect();
    els.tray.innerHTML = "";
    // Board-Kinder (ausser Guide-Bild) entfernen
    [...els.board.querySelectorAll(".piece-canvas")].forEach(el => el.remove());
    game = null;
  }

  function buildGame(item, img, pieceCount) {
    teardownGame();

    const aspect = img.naturalWidth / img.naturalHeight;
    const { rows, cols } = PuzzleEngine.computeGrid(pieceCount, aspect);
    const built = PuzzleEngine.buildPieces(img, rows, cols);

    els.board.style.aspectRatio = `${built.imgW} / ${built.imgH}`;
    els.boardGuideImg.src = item.full;
    els.puzzleTitle.textContent = `${item.title}`;

    const pieces = built.pieces.map((p, idx) => ({
      ...p,
      id: idx,
      state: "tray",
    }));

    game = {
      item, pieces,
      imgW: built.imgW, imgH: built.imgH,
      cellW: built.cellW, cellH: built.cellH,
      total: pieces.length,
      locked: 0,
      guideVisible: false,
    };

    updateProgress();

    const shuffled = PuzzleEngine.shuffle(pieces);
    shuffled.forEach(piece => {
      const canvas = piece.canvas;
      canvas.classList.add("piece-canvas");
      const slot = document.createElement("div");
      slot.className = "tray-slot";
      slot.appendChild(canvas);
      els.tray.appendChild(slot);
      attachDragHandlers(piece);
    });

    boardResizeObserver.observe(els.board);
  }

  function updateProgress() {
    els.puzzleProgress.textContent = `${game.locked} / ${game.total} Teile`;
  }

  function relayoutBoard() {
    if (!game) return;
    const scale = boardScale();
    game.pieces.forEach(piece => {
      if (piece.state === "locked") {
        positionPieceOnBoard(piece, scale);
      }
    });
  }

  function boardScale() {
    const rect = els.board.getBoundingClientRect();
    return rect.width / game.imgW;
  }

  function positionPieceOnBoard(piece, scale) {
    const canvas = piece.canvas;
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = piece.boxW * scale + "px";
    canvas.style.height = piece.boxH * scale + "px";
    canvas.style.transform = `translate(${piece.boardX * scale}px, ${piece.boardY * scale}px)`;
  }

  // ---------- Drag & Drop ----------
  function attachDragHandlers(piece) {
    const canvas = piece.canvas;
    let mode = "idle"; // idle | pending | dragging | scrolling
    let startX = 0, startY = 0;
    let grabDX = 0, grabDY = 0; // Griffpunkt relativ zur Element-Ecke (CSS-Px)
    let source = "tray";

    function onPointerDown(e) {
      if (piece.state === "locked") return;
      if (e.button !== undefined && e.button !== 0) return;
      mode = "pending";
      source = piece.state === "tray" ? "tray" : "board";
      startX = e.clientX;
      startY = e.clientY;
      const rect = canvas.getBoundingClientRect();
      grabDX = e.clientX - rect.left;
      grabDY = e.clientY - rect.top;
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    }

    function beginDrag(e) {
      mode = "dragging";
      canvas.setPointerCapture(e.pointerId);
      const rect = canvas.getBoundingClientRect();
      const oldSlot = canvas.parentElement;
      canvas.classList.add("dragging");
      // feste Bildschirmgroesse fuers Ziehen beibehalten
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      canvas.style.transform = "";
      canvas.style.left = rect.left + "px";
      canvas.style.top = rect.top + "px";
      els.dragLayer.appendChild(canvas);
      if (oldSlot && oldSlot.classList.contains("tray-slot")) oldSlot.remove();
      moveDragTo(e.clientX, e.clientY);
    }

    function moveDragTo(clientX, clientY) {
      canvas.style.left = (clientX - grabDX) + "px";
      canvas.style.top = (clientY - grabDY) + "px";
    }

    function onPointerMove(e) {
      if (mode === "pending") {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.hypot(dx, dy) < 6) return;
        const verticalDominant = Math.abs(dy) >= Math.abs(dx);
        if (source === "board" || verticalDominant) {
          e.preventDefault();
          beginDrag(e);
        } else {
          // horizontale Geste in der Reihe -> natives Scrollen zulassen
          endTracking();
        }
        return;
      }
      if (mode === "dragging") {
        e.preventDefault();
        moveDragTo(e.clientX, e.clientY);
      }
    }

    function onPointerUp(e) {
      if (mode === "dragging") {
        finishDrag(e);
      }
      endTracking();
    }

    function endTracking() {
      mode = "idle";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    }

    function finishDrag(e) {
      canvas.classList.remove("dragging");
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}

      const boardRect = els.board.getBoundingClientRect();
      const scale = boardScale();
      const pointerInBoard =
        e.clientX >= boardRect.left && e.clientX <= boardRect.right &&
        e.clientY >= boardRect.top && e.clientY <= boardRect.bottom;

      if (pointerInBoard) {
        const pieceLeftClient = e.clientX - grabDX;
        const pieceTopClient = e.clientY - grabDY;
        const imgX = (pieceLeftClient - boardRect.left) / scale;
        const imgY = (pieceTopClient - boardRect.top) / scale;
        const tolX = game.cellW * 0.4;
        const tolY = game.cellH * 0.4;
        const matches = Math.abs(imgX - piece.boardX) < tolX && Math.abs(imgY - piece.boardY) < tolY;

        if (matches) {
          lockPiece(piece, scale);
          return;
        }
      }
      returnToTray(piece);
    }

    canvas.addEventListener("pointerdown", onPointerDown);
  }

  function lockPiece(piece, scale) {
    const canvas = piece.canvas;
    const oldSlot = canvas.parentElement;
    piece.state = "locked";
    els.board.appendChild(canvas);
    if (oldSlot && oldSlot.classList.contains("tray-slot")) oldSlot.remove();
    positionPieceOnBoard(piece, scale);
    canvas.classList.add("locked");
    canvas.style.pointerEvents = "none";
    void canvas.offsetWidth; // reflow, damit die Animation neu startet
    canvas.classList.add("snap-anim");
    canvas.addEventListener("animationend", () => canvas.classList.remove("snap-anim"), { once: true });

    game.locked++;
    updateProgress();
    if (game.locked >= game.total) {
      setTimeout(showWin, 450);
    }
  }

  function returnToTray(piece) {
    const canvas = piece.canvas;
    piece.state = "tray";
    canvas.style.transform = "";
    canvas.style.left = "";
    canvas.style.top = "";
    canvas.style.width = "";
    canvas.style.height = "";
    const slot = document.createElement("div");
    slot.className = "tray-slot";
    slot.appendChild(canvas);
    els.tray.appendChild(slot);
  }

  // ---------- Vorschau-Taste ----------
  els.puzzlePreviewBtn.addEventListener("click", () => {
    if (!game) return;
    game.guideVisible = !game.guideVisible;
    els.boardGuideImg.style.opacity = game.guideVisible ? "0.55" : "0.16";
  });

  // ---------- Gewonnen ----------
  function showWin() {
    els.winText.textContent = `${game.item.title} mit ${game.total} Teilen geloest!`;
    els.winOverlay.hidden = false;
  }
  els.winReplayBtn.addEventListener("click", () => {
    els.winOverlay.hidden = true;
    startPuzzle(selectedImage, selectedPieceCount);
  });
  els.winGalleryBtn.addEventListener("click", () => {
    els.winOverlay.hidden = true;
    teardownGame();
    showView(els.viewGallery);
  });

  // ---------- Init ----------
  renderGallery();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
