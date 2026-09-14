// Reine Berechnungs-Engine: Grid-Aufteilung + Jigsaw-Formen per Canvas.
// Enthaelt keine DOM-/UI-Logik (siehe app.js).

const PuzzleEngine = (() => {

  // Findet rows/cols, deren Produkt moeglichst nah an targetCount liegt
  // und deren Seitenverhaeltnis zum Bildseitenverhaeltnis passt.
  function computeGrid(targetCount, aspect) {
    let best = null;
    const maxRows = Math.ceil(Math.sqrt(targetCount * aspect)) + 4;
    for (let rows = 1; rows <= maxRows; rows++) {
      const cols = Math.max(1, Math.round(targetCount / rows));
      const total = rows * cols;
      const ratio = cols / rows;
      const countDiff = Math.abs(total - targetCount) / targetCount;
      const ratioDiff = Math.abs(ratio - aspect) / aspect;
      const score = countDiff * 3 + ratioDiff;
      if (!best || score < best.score) {
        best = { rows, cols, score };
      }
    }
    return { rows: best.rows, cols: best.cols };
  }

  function generateEdges(rows, cols) {
    const vEdge = []; // vEdge[r][c], c = 1..cols-1 (zwischen Spalte c-1 und c)
    const hEdge = []; // hEdge[r][c], r = 1..rows-1 (zwischen Zeile r-1 und r)
    for (let r = 0; r < rows; r++) {
      vEdge.push(new Array(cols).fill(0));
      for (let c = 1; c < cols; c++) {
        vEdge[r][c] = Math.random() < 0.5 ? 1 : -1;
      }
    }
    for (let r = 0; r < rows; r++) {
      hEdge.push(new Array(cols).fill(0));
    }
    for (let r = 1; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        hEdge[r][c] = Math.random() < 0.5 ? 1 : -1;
      }
    }
    return { vEdge, hEdge };
  }

  // Das Schnittmuster (welche Kante wo einen Zahn hat) haengt nur von rows/cols
  // ab, nicht vom Bildinhalt. Wir erzeugen es pro Rasterformat genau einmal und
  // verwenden es fuer alle Motive mit gleicher Teileanzahl wieder - wie eine
  // echte Stanzform, die auf verschiedene Motive angewendet wird.
  const edgePatternCache = new Map();
  function getEdgePattern(rows, cols) {
    const key = `${rows}x${cols}`;
    if (!edgePatternCache.has(key)) {
      edgePatternCache.set(key, generateEdges(rows, cols));
    }
    return edgePatternCache.get(key);
  }

  // Zeichnet eine Kante mit optionalem Puzzle-"Zahn" (bezierbasierte Ausbuchtung).
  function drawEdge(ctx, x0, y0, x1, y1, tabDir, tabSize) {
    if (tabDir === 0) {
      ctx.lineTo(x1, y1);
      return;
    }
    const dx = x1 - x0;
    const dy = y1 - y0;
    const nx = -dy / Math.hypot(dx, dy);
    const ny = dx / Math.hypot(dx, dy);
    const s = tabSize * tabDir;
    const pt = (t, off) => ({
      x: x0 + dx * t + nx * off,
      y: y0 + dy * t + ny * off,
    });
    const p1 = pt(0.35, 0);
    const c1 = pt(0.35, s * 0.9);
    const c2 = pt(0.40, s * 1.4);
    const mid = pt(0.5, s * 1.4);
    const c3 = pt(0.60, s * 1.4);
    const c4 = pt(0.65, s * 0.9);
    const p2 = pt(0.65, 0);
    ctx.lineTo(p1.x, p1.y);
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, mid.x, mid.y);
    ctx.bezierCurveTo(c3.x, c3.y, c4.x, c4.y, p2.x, p2.y);
    ctx.lineTo(x1, y1);
  }

  function tracePiecePath(ctx, margin, cellW, cellH, tabs) {
    const left = margin, top = margin, right = margin + cellW, bottom = margin + cellH;
    ctx.beginPath();
    ctx.moveTo(left, top);
    drawEdge(ctx, left, top, right, top, tabs.top, tabs.tabSize);       // oben
    drawEdge(ctx, right, top, right, bottom, tabs.right, tabs.tabSize); // rechts
    drawEdge(ctx, right, bottom, left, bottom, tabs.bottom, tabs.tabSize); // unten
    drawEdge(ctx, left, bottom, left, top, tabs.left, tabs.tabSize);    // links
    ctx.closePath();
  }

  // Baut alle Puzzleteile aus dem geladenen Bild.
  // Gibt Array von { row, col, canvas, boxW, boxH, boardX, boardY } zurueck.
  function buildPieces(image, rows, cols) {
    const imgW = image.naturalWidth;
    const imgH = image.naturalHeight;
    const cellW = imgW / cols;
    const cellH = imgH / rows;
    const tabSize = Math.min(cellW, cellH) * 0.22;
    const margin = tabSize * 1.7;
    const boxW = cellW + margin * 2;
    const boxH = cellH + margin * 2;

    const { vEdge, hEdge } = getEdgePattern(rows, cols);
    const pieces = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Jede Kante wird von zwei Nachbarn aus jeweils entgegengesetzter
        // Richtung nachgezeichnet. "bottom"/"right" nutzen den Kantenwert wie
        // generiert (kanonische Richtung); "top"/"left" muessen ihn negieren,
        // sonst woelben sich beide Nachbarn an derselben Kante nach innen und
        // es entsteht eine sichtbare Luecke statt einer ineinandergreifenden Naht.
        const tabs = {
          top: row === 0 ? 0 : -hEdge[row][col],
          bottom: row === rows - 1 ? 0 : hEdge[row + 1][col],
          left: col === 0 ? 0 : -vEdge[row][col],
          right: col === cols - 1 ? 0 : vEdge[row][col + 1],
          tabSize,
        };

        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(boxW);
        canvas.height = Math.ceil(boxH);
        const ctx = canvas.getContext("2d");

        tracePiecePath(ctx, margin, cellW, cellH, tabs);
        ctx.save();
        ctx.clip();
        const srcX = col * cellW - margin;
        const srcY = row * cellH - margin;
        ctx.drawImage(image, -srcX, -srcY, imgW, imgH);
        ctx.restore();

        // Feine Kontur fuer bessere Lesbarkeit der Teile
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.stroke();

        pieces.push({
          row, col,
          canvas,
          boxW, boxH,
          boardX: col * cellW - margin,
          boardY: row * cellH - margin,
        });
      }
    }

    return { pieces, imgW, imgH, cellW, cellH, margin };
  }

  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return { computeGrid, buildPieces, shuffle };
})();
