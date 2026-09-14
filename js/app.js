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
    setupTrophies: document.getElementById("setup-trophies"),
    startPuzzleBtn: document.getElementById("start-puzzle-btn"),
    puzzleBackBtn: document.getElementById("puzzle-back-btn"),
    puzzleTitle: document.getElementById("puzzle-title"),
    puzzleProgress: document.getElementById("puzzle-progress"),
    puzzleTimer: document.getElementById("puzzle-timer"),
    puzzlePreviewBtn: document.getElementById("puzzle-preview-btn"),
    zoomResetBtn: document.getElementById("puzzle-zoom-reset-btn"),
    boardWrap: document.getElementById("board-wrap"),
    board: document.getElementById("board"),
    boardInner: document.getElementById("board-inner"),
    boardGuideImg: document.getElementById("board-guide-img"),
    trayWrap: document.getElementById("tray-wrap"),
    tray: document.getElementById("tray"),
    loadingOverlay: document.getElementById("loading-overlay"),
    loadingText: document.getElementById("loading-text"),
    winOverlay: document.getElementById("win-overlay"),
    winText: document.getElementById("win-text"),
    winTime: document.getElementById("win-time"),
    winTrophies: document.getElementById("win-trophies"),
    winReplayBtn: document.getElementById("win-replay-btn"),
    winGalleryBtn: document.getElementById("win-gallery-btn"),
    dragLayer: document.getElementById("drag-layer"),
  };

  let selectedImage = null;
  let selectedPieceCount = null;
  let game = null; // aktueller Puzzle-Zustand
  const MAX_ZOOM = 4;

  // ---------- Bestzeiten (localStorage) ----------
  const TIMES_KEY = "puzzleSpassBestTimes";

  function loadTimes() {
    try {
      return JSON.parse(localStorage.getItem(TIMES_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  function saveTimes(times) {
    try {
      localStorage.setItem(TIMES_KEY, JSON.stringify(times));
    } catch (err) {
      // z.B. Privatmodus ohne Storage-Zugriff - Zeiten dann einfach nicht speichern
    }
  }

  // Speichert die Zeit als neue Bestzeit, falls es keine gibt oder sie besser ist.
  // Gibt zurueck, ob es eine neue Bestzeit ist.
  function recordTime(imageId, pieceCount, ms) {
    const times = loadTimes();
    if (!times[imageId]) times[imageId] = {};
    const prev = times[imageId][pieceCount];
    const isNewBest = prev == null || ms < prev;
    if (isNewBest) {
      times[imageId][pieceCount] = ms;
      saveTimes(times);
    }
    return isNewBest;
  }

  function isFullySolved(imageId) {
    const times = loadTimes();
    return !!(times[imageId] && times[imageId][600] != null);
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  function markSolvedThumb(imgEl, imageId) {
    imgEl.classList.toggle("solved-complete", isFullySolved(imageId));
  }

  // Baut die Trophaeen-Zeilen (🏆 Teilezahl - Zeit) fuer ein Motiv, nur fuer
  // tatsaechlich geloeste Teilezahlen. Wird sowohl im Erfolgs-Overlay als
  // auch in der Motiv-/Teile-Auswahl verwendet.
  function trophyRowsHtml(imageId, currentCount) {
    const times = loadTimes()[imageId] || {};
    return PIECE_COUNT_OPTIONS
      .filter((count) => times[count] != null)
      .map((count) => {
        const current = count === currentCount ? " is-current" : "";
        return `<div class="win-trophy-row${current}">
          <span>🏆</span>
          <span class="trophy-count">${count} Teile</span>
          <span class="trophy-time">${formatTime(times[count])}</span>
        </div>`;
      })
      .join("");
  }

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
      markSolvedThumb(card.querySelector("img"), item.id);
    });
  }

  function openSetup(item) {
    selectedImage = item;
    selectedPieceCount = null;
    els.setupTitle.textContent = item.title;
    els.setupPreviewImg.src = item.full;
    els.setupPreviewImg.alt = item.title;
    markSolvedThumb(els.setupPreviewImg, item.id);
    els.startPuzzleBtn.disabled = true;

    const rows = trophyRowsHtml(item.id, null);
    els.setupTrophies.querySelectorAll(".win-trophy-row").forEach((r) => r.remove());
    els.setupTrophies.insertAdjacentHTML("beforeend", rows);
    els.setupTrophies.hidden = rows.length === 0;

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

  els.setupBackBtn.addEventListener("click", () => {
    renderGallery();
    showView(els.viewGallery);
  });
  els.puzzleBackBtn.addEventListener("click", () => {
    teardownGame();
    renderGallery();
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
        // Ansicht zuerst aktivieren (Ladeoverlay verdeckt sie ohnehin noch),
        // damit board-wrap beim Bauen bereits eine echte Groesse hat -
        // sonst liefert computeBaseFit() wegen display:none 0x0.
        showView(els.viewPuzzle);
        buildGame(item, img, pieceCount);
        els.loadingOverlay.hidden = true;
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

  // Das Spielfeld (.board) nutzt IMMER die komplette verfuegbare Flaeche von
  // board-wrap - nicht nur eine 16:9-Box darin. Bei Zoom=1 wird das Bild per
  // Transform auf board-inner passend hineingerechnet (Letterbox, wie ein
  // Videoplayer); je weiter man reinzoomt, desto mehr fuellt der Bildinhalt
  // diese ohnehin schon volle Flaeche aus - so wird beim Zoomen der ganze
  // Bildschirm genutzt, statt nur eine kleine, aussen fixierte 16:9-Box.
  function sizeBoardViewport() {
    const wrap = els.boardWrap;
    const cs = getComputedStyle(wrap);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const w = Math.max(0, wrap.clientWidth - padX);
    const h = Math.max(0, wrap.clientHeight - padY);
    els.board.style.width = w + "px";
    els.board.style.height = h + "px";
    return { w, h };
  }

  // Ermittelt den Skalierungsfaktor, mit dem das Bild bei Zoom=1 komplett
  // (mit Letterbox-Raendern) in die aktuelle Spielfeld-Flaeche passt.
  function computeBaseFit() {
    const { w, h } = sizeBoardViewport();
    game.outerW = w;
    game.outerH = h;
    game.baseScale = Math.min(w / game.imgW, h / game.imgH) || 1;
  }

  // Haelt den sichtbaren Bildinhalt zentriert, solange er (in einer Achse)
  // kleiner als die verfuegbare Flaeche ist (Letterbox), und begrenzt das
  // Verschieben (Pan) sobald er sie durch Zoom ueberragt.
  function centerOrClampPan() {
    const effScale = game.baseScale * game.zoom;
    const contentW = game.imgW * effScale;
    const contentH = game.imgH * effScale;
    if (contentW <= game.outerW) {
      game.panX = (game.outerW - contentW) / 2;
    } else {
      game.panX = Math.min(0, Math.max(game.outerW - contentW, game.panX));
    }
    if (contentH <= game.outerH) {
      game.panY = (game.outerH - contentH) / 2;
    } else {
      game.panY = Math.min(0, Math.max(game.outerH - contentH, game.panY));
    }
  }

  // ---------- Timer ----------
  function startTimer() {
    game.startTime = Date.now();
    updateTimerDisplay();
    game.timerInterval = setInterval(updateTimerDisplay, 1000);
  }

  function stopTimer() {
    if (game && game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }
  }

  function updateTimerDisplay() {
    if (!game) return;
    els.puzzleTimer.textContent = formatTime(Date.now() - game.startTime);
  }

  function teardownGame() {
    if (!game) return;
    stopTimer();
    boardResizeObserver.disconnect();
    els.tray.innerHTML = "";
    // Board-Kinder (ausser Guide-Bild) entfernen
    [...els.board.querySelectorAll(".piece-canvas")].forEach(el => el.remove());
    game = null;
    els.zoomResetBtn.hidden = true;
  }

  function buildGame(item, img, pieceCount) {
    teardownGame();

    const aspect = img.naturalWidth / img.naturalHeight;
    const { rows, cols } = PuzzleEngine.computeGrid(pieceCount, aspect);
    const built = PuzzleEngine.buildPieces(img, rows, cols);

    els.boardGuideImg.src = item.full;
    els.puzzleTitle.textContent = `${item.title}`;

    const pieces = built.pieces.map((p, idx) => ({
      ...p,
      id: idx,
      state: "tray",
      groupId: idx, // Gruppenzugehoerigkeit; "locked" ist die reservierte ID der fertig geloesten Gruppe
      curX: null, curY: null, // aktuelle Bild-Px-Position, solange auf dem Spielfeld platziert
    }));
    const pieceByRowCol = new Map();
    pieces.forEach((p) => pieceByRowCol.set(`${p.row},${p.col}`, p));

    game = {
      item, pieces, pieceByRowCol,
      imgW: built.imgW, imgH: built.imgH,
      cellW: built.cellW, cellH: built.cellH,
      total: pieces.length,
      locked: 0,
      guideVisible: false,
      zoom: 1, panX: 0, panY: 0,
      baseScale: 1, outerW: 0, outerH: 0,
    };
    els.boardGuideImg.style.width = built.imgW + "px";
    els.boardGuideImg.style.height = built.imgH + "px";
    computeBaseFit();
    centerOrClampPan();
    applyBoardTransform();
    els.zoomResetBtn.hidden = true;
    startTimer();

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

    boardResizeObserver.observe(els.boardWrap);
  }

  function updateProgress() {
    els.puzzleProgress.textContent = `${game.locked} / ${game.total} Teile`;
  }

  function relayoutBoard() {
    if (!game) return;
    // Bei Groessen-/Ausrichtungsaenderung Zoom zuruecksetzen, damit die
    // Ansicht nicht verzerrt oder ausserhalb des sichtbaren Bereichs landet.
    game.zoom = 1;
    computeBaseFit();
    centerOrClampPan();
    applyBoardTransform();
    game.pieces.forEach(piece => {
      if (piece.curX != null) {
        renderPieceOnBoard(piece, piece.curX, piece.curY);
      }
    });
  }

  // Positioniert ein Puzzleteil im Spielfeld an einer Bild-Koordinate
  // (imgX/imgY, in unskalierten Bild-Px). Skalierung/Zoom/Pan uebernimmt
  // allein der Transform von #board-inner - das Teil selbst braucht seine
  // rohe Bildgroesse/-position, egal ob eingerastet oder frei abgelegt.
  function renderPieceOnBoard(piece, imgX, imgY) {
    const canvas = piece.canvas;
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = piece.boxW + "px";
    canvas.style.height = piece.boxH + "px";
    canvas.style.transform = `translate(${imgX}px, ${imgY}px)`;
  }

  // ---------- Zoom & Pan im Spielfeld ----------
  // Effektiver Massstab Bild-Px -> Bildschirm-Px (Basis-Einpassung * Zoom).
  function effectiveScale() {
    return game.baseScale * game.zoom;
  }

  function applyBoardTransform() {
    if (!game) return;
    els.boardInner.style.transform = `translate(${game.panX}px, ${game.panY}px) scale(${effectiveScale()})`;
    const zoomedIn = game.zoom > 1.01;
    els.zoomResetBtn.hidden = !zoomedIn;
  }

  function setZoomAroundPoint(newZoom, clientX, clientY) {
    const rect = els.board.getBoundingClientRect();
    const clamped = Math.min(MAX_ZOOM, Math.max(1, newZoom));
    const oldScale = effectiveScale();
    const localX = (clientX - rect.left - game.panX) / oldScale;
    const localY = (clientY - rect.top - game.panY) / oldScale;
    game.zoom = clamped;
    const newScale = effectiveScale();
    game.panX = (clientX - rect.left) - localX * newScale;
    game.panY = (clientY - rect.top) - localY * newScale;
    centerOrClampPan();
    applyBoardTransform();
  }

  function resetZoom() {
    if (!game) return;
    game.zoom = 1;
    centerOrClampPan();
    applyBoardTransform();
  }

  els.zoomResetBtn.addEventListener("click", resetZoom);

  els.board.addEventListener("wheel", (e) => {
    if (!game) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0015);
    setZoomAroundPoint(game.zoom * factor, e.clientX, e.clientY);
  }, { passive: false });

  els.board.addEventListener("dblclick", resetZoom);

  // Pinch-Zoom / Ein-Finger-Pan (nur ausserhalb von Puzzleteilen, sonst Konflikt mit Drag)
  const boardPointers = new Map();
  let pinchState = null;
  let panState = null;

  function isOnPiece(target) {
    return !!(target && target.closest && target.closest(".piece-canvas"));
  }

  els.board.addEventListener("pointerdown", (e) => {
    if (!game || isOnPiece(e.target)) return;
    boardPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (boardPointers.size === 1 && game.zoom > 1.01) {
      panState = { startX: e.clientX, startY: e.clientY, startPanX: game.panX, startPanY: game.panY };
    } else if (boardPointers.size === 2) {
      panState = null;
      const pts = [...boardPointers.values()];
      pinchState = {
        startDist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        startZoom: game.zoom,
        startPanX: game.panX, startPanY: game.panY,
        startMidX: (pts[0].x + pts[1].x) / 2, startMidY: (pts[0].y + pts[1].y) / 2,
      };
    }
  });

  window.addEventListener("pointermove", (e) => {
    if (!game || !boardPointers.has(e.pointerId)) return;
    boardPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (boardPointers.size === 2 && pinchState) {
      e.preventDefault();
      const pts = [...boardPointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const midX = (pts[0].x + pts[1].x) / 2, midY = (pts[0].y + pts[1].y) / 2;
      const newZoom = Math.min(MAX_ZOOM, Math.max(1, pinchState.startZoom * (dist / pinchState.startDist)));
      const rect = els.board.getBoundingClientRect();
      const oldScale = game.baseScale * pinchState.startZoom;
      const localX = (pinchState.startMidX - rect.left - pinchState.startPanX) / oldScale;
      const localY = (pinchState.startMidY - rect.top - pinchState.startPanY) / oldScale;
      game.zoom = newZoom;
      const newScale = game.baseScale * newZoom;
      game.panX = (midX - rect.left) - localX * newScale;
      game.panY = (midY - rect.top) - localY * newScale;
      centerOrClampPan();
      applyBoardTransform();
    } else if (boardPointers.size === 1 && panState) {
      e.preventDefault();
      game.panX = panState.startPanX + (e.clientX - panState.startX);
      game.panY = panState.startPanY + (e.clientY - panState.startY);
      centerOrClampPan();
      applyBoardTransform();
    }
  }, { passive: false });

  function releaseBoardPointer(e) {
    if (!boardPointers.has(e.pointerId)) return;
    boardPointers.delete(e.pointerId);
    pinchState = null;
    panState = null;
    if (game && boardPointers.size === 1 && game.zoom > 1.01) {
      const [remaining] = boardPointers.values();
      panState = { startX: remaining.x, startY: remaining.y, startPanX: game.panX, startPanY: game.panY };
    }
  }
  window.addEventListener("pointerup", releaseBoardPointer);
  window.addEventListener("pointercancel", releaseBoardPointer);

  // ---------- Drag & Drop ----------
  function isOverBoard(clientX, clientY) {
    const r = els.board.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }

  // ---------- Gruppen: zusammenpassende Teile verbinden sich unabhaengig
  // von ihrer Position auf dem Spielfeld und werden gemeinsam verschoben.
  // "locked" ist die reservierte Gruppen-ID der fertig geloesten Teile.
  function getGroupPieces(groupId) {
    return game.pieces.filter((p) => p.groupId === groupId);
  }

  function getNeighborPiece(piece, dr, dc) {
    return game.pieceByRowCol.get(`${piece.row + dr},${piece.col + dc}`) || null;
  }

  function neighborsOf(piece) {
    return [
      getNeighborPiece(piece, -1, 0),
      getNeighborPiece(piece, 1, 0),
      getNeighborPiece(piece, 0, -1),
      getNeighborPiece(piece, 0, 1),
    ].filter(Boolean);
  }

  // Prueft fuer die gerade bewegten Teile, ob ein Nachbar aus einer anderen
  // Gruppe jetzt an der richtigen relativen Position liegt, und dockt in dem
  // Fall die ganze (bewegte) Gruppe exakt daran an. Wiederholt sich, falls
  // dadurch weitere Verbindungen moeglich werden.
  function settleGroup(movedPieces) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const p of movedPieces) {
        for (const n of neighborsOf(p)) {
          if (n.groupId === p.groupId || n.curX == null) continue;
          const expectedX = n.curX + (p.boardX - n.boardX);
          const expectedY = n.curY + (p.boardY - n.boardY);
          if (Math.abs(p.curX - expectedX) < game.cellW * 0.4 &&
              Math.abs(p.curY - expectedY) < game.cellH * 0.4) {
            const dx = expectedX - p.curX;
            const dy = expectedY - p.curY;
            const newGroupId = n.groupId;
            getGroupPieces(p.groupId).forEach((m) => {
              m.curX += dx;
              m.curY += dy;
              m.groupId = newGroupId;
            });
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
    }
  }

  // Nach einer Bewegung: prueft die finale Zielposition, verbindet mit
  // Nachbarn (settleGroup) und schreibt das Ergebnis in DOM/State.
  // Gibt zurueck, ob die (ggf. gewachsene) Gruppe komplett fertig sitzt.
  function settleAndFinalize(anchorPiece, movedPieces) {
    const tolX = game.cellW * 0.4;
    const tolY = game.cellH * 0.4;
    if (Math.abs(anchorPiece.curX - anchorPiece.boardX) < tolX &&
        Math.abs(anchorPiece.curY - anchorPiece.boardY) < tolY) {
      const fixDx = anchorPiece.boardX - anchorPiece.curX;
      const fixDy = anchorPiece.boardY - anchorPiece.curY;
      getGroupPieces(anchorPiece.groupId).forEach((m) => {
        m.curX += fixDx;
        m.curY += fixDy;
        m.groupId = "locked";
      });
    }

    settleGroup(movedPieces);

    const isLocked = anchorPiece.groupId === "locked";
    getGroupPieces(anchorPiece.groupId).forEach((m) => {
      renderPieceOnBoard(m, m.curX, m.curY);
      if (isLocked) {
        if (m.state !== "locked") {
          m.state = "locked";
          m.canvas.classList.add("locked");
          m.canvas.style.pointerEvents = "none";
        }
      } else {
        m.state = "placed";
      }
      if (m.canvas.parentElement !== els.boardInner) {
        els.boardInner.appendChild(m.canvas);
      }
    });
    return isLocked;
  }

  function checkWin() {
    game.locked = game.pieces.filter((p) => p.state === "locked").length;
    updateProgress();
    if (game.locked >= game.total) {
      game.elapsedMs = Date.now() - game.startTime;
      stopTimer();
      setTimeout(showWin, 450);
    }
  }

  function attachDragHandlers(piece) {
    const canvas = piece.canvas;
    let mode = "idle"; // idle | pending | dragging
    let startX = 0, startY = 0;
    let source = "tray";
    let originalW = 0, originalH = 0; // Groesse beim Aufnehmen (nur fuer Tray-Herkunft relevant)
    let grabFracX = 0.5, grabFracY = 0.5; // Griffpunkt als Anteil der Teile-Breite/Hoehe
    let curGrabDX = 0, curGrabDY = 0; // aktueller Griffpunkt in Px (aendert sich mit der Groesse)
    let overBoard = false;
    let groupMembers = []; // [{piece, offX, offY}] Bild-Px-Versatz der Gruppe relativ zum Anker

    function onPointerDown(e) {
      if (piece.state === "locked") return;
      if (e.button !== undefined && e.button !== 0) return;
      mode = "pending";
      source = piece.state === "tray" ? "tray" : "board";
      startX = e.clientX;
      startY = e.clientY;
      const rect = canvas.getBoundingClientRect();
      originalW = rect.width;
      originalH = rect.height;
      curGrabDX = e.clientX - rect.left;
      curGrabDY = e.clientY - rect.top;
      grabFracX = curGrabDX / (rect.width || 1);
      grabFracY = curGrabDY / (rect.height || 1);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    }

    function beginDrag(e) {
      mode = "dragging";
      canvas.setPointerCapture(e.pointerId);

      if (source === "board") {
        const anchorX = piece.curX, anchorY = piece.curY;
        groupMembers = getGroupPieces(piece.groupId).map((m) => ({
          piece: m, offX: m.curX - anchorX, offY: m.curY - anchorY,
        }));
      } else {
        groupMembers = [{ piece, offX: 0, offY: 0 }];
      }

      const scaleNow = effectiveScale();
      const boardRect = els.board.getBoundingClientRect();
      groupMembers.forEach(({ piece: p }) => {
        const c = p.canvas;
        const oldParent = c.parentElement;
        let w, h, left, top;
        if (p === piece) {
          const rect = c.getBoundingClientRect();
          w = rect.width; h = rect.height; left = rect.left; top = rect.top;
        } else {
          w = p.boxW * scaleNow;
          h = p.boxH * scaleNow;
          left = boardRect.left + p.curX * scaleNow + game.panX;
          top = boardRect.top + p.curY * scaleNow + game.panY;
        }
        c.classList.add("dragging");
        c.style.width = w + "px";
        c.style.height = h + "px";
        c.style.transform = "";
        c.style.left = left + "px";
        c.style.top = top + "px";
        els.dragLayer.appendChild(c);
        if (oldParent && oldParent.classList.contains("tray-slot")) oldParent.remove();
      });

      overBoard = false;
      moveDragTo(e.clientX, e.clientY);
    }

    // Waehrend des Ziehens automatisch auf Board-Groesse skalieren, sobald ein
    // frisch aus der Reihe gegriffenes Teil ueber das Spielfeld bewegt wird -
    // macht das genaue Platzieren moeglich. Bereits platzierte (ggf. mehrteilige)
    // Gruppen bleiben durchgehend in Board-Groesse.
    function moveDragTo(clientX, clientY) {
      const nowOverBoard = isOverBoard(clientX, clientY);
      if (source === "tray" && nowOverBoard !== overBoard) {
        overBoard = nowOverBoard;
        let w, h;
        if (overBoard) {
          const s = effectiveScale();
          w = piece.boxW * s;
          h = piece.boxH * s;
        } else {
          w = originalW;
          h = originalH;
        }
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        curGrabDX = grabFracX * w;
        curGrabDY = grabFracY * h;
      }
      const anchorLeft = clientX - curGrabDX;
      const anchorTop = clientY - curGrabDY;
      canvas.style.left = anchorLeft + "px";
      canvas.style.top = anchorTop + "px";

      if (groupMembers.length > 1) {
        const s = effectiveScale();
        groupMembers.forEach(({ piece: p, offX, offY }) => {
          if (p === piece) return;
          p.canvas.style.left = (anchorLeft + offX * s) + "px";
          p.canvas.style.top = (anchorTop + offY * s) + "px";
        });
      }
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
      groupMembers.forEach(({ piece: p }) => p.canvas.classList.remove("dragging"));
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}

      const boardRect = els.board.getBoundingClientRect();
      const pointerInBoard = isOverBoard(e.clientX, e.clientY);

      if (pointerInBoard) {
        const pieceLeftClient = e.clientX - curGrabDX;
        const pieceTopClient = e.clientY - curGrabDY;
        // Bildschirm- zu Bild-Koordinaten, unter Beruecksichtigung von Zoom/Pan des Boards
        const scale = effectiveScale();
        const imgX = (pieceLeftClient - boardRect.left - game.panX) / scale;
        const imgY = (pieceTopClient - boardRect.top - game.panY) / scale;

        if (source === "tray") {
          piece.groupId = piece.id;
          piece.curX = imgX;
          piece.curY = imgY;
          settleAndFinalize(piece, [piece]);
        } else {
          const movedPieces = groupMembers.map((gm) => gm.piece);
          const dx = imgX - piece.curX;
          const dy = imgY - piece.curY;
          movedPieces.forEach((p) => { p.curX += dx; p.curY += dy; });
          settleAndFinalize(piece, movedPieces);
        }
        checkWin();
        return;
      }

      // Ausserhalb des Spielfelds abgelegt
      if (groupMembers.length > 1) {
        // Eine mehrteilige Gruppe passt nicht in die Reihe -> an alte Position zurueck
        groupMembers.forEach(({ piece: p, offX, offY }) => {
          renderPieceOnBoard(p, piece.curX + offX, piece.curY + offY);
          els.boardInner.appendChild(p.canvas);
        });
      } else {
        returnToTray(piece);
      }
    }

    canvas.addEventListener("pointerdown", onPointerDown);
  }

  function returnToTray(piece) {
    piece.groupId = piece.id;
    piece.curX = null;
    piece.curY = null;
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
    const imageId = game.item.id;
    const isNewBest = recordTime(imageId, selectedPieceCount, game.elapsedMs);

    els.winText.textContent = `${game.item.title} mit ${game.total} Teilen geloest!`;
    els.winTime.textContent = isNewBest
      ? `Deine Zeit: ${formatTime(game.elapsedMs)} (neue Bestzeit!)`
      : `Deine Zeit: ${formatTime(game.elapsedMs)}`;

    const rows = trophyRowsHtml(imageId, selectedPieceCount);
    els.winTrophies.innerHTML = rows;
    els.winTrophies.hidden = rows.length === 0;

    els.winOverlay.hidden = false;
  }
  els.winReplayBtn.addEventListener("click", () => {
    els.winOverlay.hidden = true;
    startPuzzle(selectedImage, selectedPieceCount);
  });
  els.winGalleryBtn.addEventListener("click", () => {
    els.winOverlay.hidden = true;
    teardownGame();
    renderGallery();
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
