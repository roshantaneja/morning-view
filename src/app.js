import React, { useState, useEffect, useRef } from 'react';
import { Text, Box, useStdout } from 'ink';
import { Canvas } from './canvas.js';
import { fetchDataBundle } from './data.js';
import { loadCreation } from './loader.js';

const h = React.createElement;

function formatTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function formatDate() {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()}`;
}

function overlayText(canvas, x, y, text, fg, bg) {
  for (let i = 0; i < text.length; i++) {
    if (x + i >= 0 && x + i < canvas.width) {
      canvas.setCell(x + i, y, text[i], fg, bg);
    }
  }
}

function canvasIsBlank(canvas) {
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const cell = canvas.getCell(x, y);
      if (cell.bg != null || cell.char !== ' ') return false;
    }
  }
  return true;
}

function renderOverlays(canvas, creation) {
  const pad = 2;
  const time = formatTime();
  const date = formatDate();

  overlayText(canvas, canvas.width - time.length - pad, pad, time, '#888888');
  overlayText(canvas, canvas.width - date.length - pad, pad + 1, date, '#666666');

  if (creation) {
    const title = creation.title || '';
    const desc = creation.description || '';
    if (title) {
      overlayText(canvas, pad, canvas.height - pad - (desc ? 2 : 1), title, '#888888');
    }
    if (desc) {
      const maxLen = canvas.width - pad * 2;
      const truncated = desc.length > maxLen ? desc.slice(0, maxLen - 1) + '…' : desc;
      overlayText(canvas, pad, canvas.height - pad - 1, truncated, '#666666');
    }
  }
}

export default function App() {
  const { stdout } = useStdout();
  const [rows, setRows] = useState([]);
  const [ready, setReady] = useState(false);
  const canvasRef = useRef(null);
  const creationRef = useRef(null);
  const dataRef = useRef(null);
  const frameRef = useRef({ count: 0, elapsed: 0, dt: 0, lastTime: 0 });
  const stateRef = useRef(null);
  const updateDrawsRef = useRef(true);

  useEffect(() => {
    let animationTimer = null;
    let clockTimer = null;
    let cancelled = false;

    async function init() {
      const cols = stdout.columns || 80;
      const termRows = stdout.rows || 24;
      const canvas = new Canvas(cols, termRows);
      canvasRef.current = canvas;

      const [data, creation] = await Promise.all([
        fetchDataBundle(),
        loadCreation(),
      ]);
      if (cancelled) return;

      dataRef.current = data;
      creationRef.current = creation;
      const fpsMax = data.config?.display?.fpsMax || 5;
      // Global animation "liveliness" dial from config.json (default 1).
      // Scales both the frame rate (more redraws/sec, up to fpsMax) and the
      // animation clock (frame.dt/elapsed), so time-based motion also speeds
      // up. Clamped to a sane range so it can't peg the Pi's CPU.
      const speed = Math.max(0.25, Math.min(data.config?.display?.speed || 1, 4));

      function renderFrame() {
        const canvas = canvasRef.current;
        const creation = creationRef.current;
        const data = dataRef.current;
        if (!canvas) return;

        canvas.clear();

        if (creation) {
          try {
            if (frameRef.current.count === 0) {
              if (creation.setup) {
                stateRef.current = creation.setup(canvas, data);
              }
              creation.render(canvas, data, stateRef.current);
            } else if (creation.update) {
              const now = Date.now();
              const realDt = frameRef.current.lastTime
                ? (now - frameRef.current.lastTime) / 1000
                : 0;
              frameRef.current.lastTime = now;
              frameRef.current.dt = realDt * speed;
              frameRef.current.elapsed += frameRef.current.dt;
              creation.update(canvas, data, frameRef.current, stateRef.current);
              // A well-formed update() redraws the whole frame. Some creations
              // only advance state in update() and draw in render(); left alone
              // those go blank after frame 0. Detect that once and fall back to
              // calling render() every frame so the piece never vanishes.
              if (!updateDrawsRef.current) {
                creation.render(canvas, data, stateRef.current);
              } else if (creation.render && canvasIsBlank(canvas)) {
                updateDrawsRef.current = false;
                creation.render(canvas, data, stateRef.current);
              }
            } else {
              creation.render(canvas, data, stateRef.current);
            }
          } catch (err) {
            canvas.clear();
            canvas.drawText(2, 2, 'Creation error:', '#ff4444');
            canvas.drawText(2, 3, err.message.slice(0, canvas.width - 4), '#ff8888');
          }
        } else {
          const msg = 'No creation found';
          canvas.drawText(canvas.centerX(msg), canvas.centerY(1), msg, '#666666');
        }

        renderOverlays(canvas, creation);
        setRows(canvas.toAnsiRows());
        frameRef.current.count++;
      }

      renderFrame();
      setReady(true);

      const fps = creation?.fps
        ? Math.min(Math.max(creation.fps * speed, 1), fpsMax)
        : 0;

      if (fps > 0 && creation?.update) {
        animationTimer = setInterval(renderFrame, Math.round(1000 / fps));
      }

      clockTimer = setInterval(renderFrame, 60000);
    }

    init();

    return () => {
      cancelled = true;
      if (animationTimer) clearInterval(animationTimer);
      if (clockTimer) clearInterval(clockTimer);
      if (creationRef.current?.teardown) {
        try { creationRef.current.teardown(); } catch {}
      }
    };
  }, []);

  if (!ready) {
    return h(Text, { dimColor: true }, 'Loading morning view...');
  }

  return h(Box, { flexDirection: 'column' },
    rows.map((row, i) => h(Text, { key: i }, row))
  );
}
