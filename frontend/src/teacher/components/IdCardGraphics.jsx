"use client";

import React, { useMemo } from "react";

/**
 * Deterministic QR Code generator producing clean SVG modules.
 * Standard QR Pattern with 3 corner finder patterns, timing tracks, and data bits.
 */
export function QrCodeSvg({
  value = "https://gyanaratna.org/verify",
  size = 110,
  fgColor = "#0f172a",
  bgColor = "#ffffff",
  className = "",
  showCenterLogo = true,
}) {
  const matrix = useMemo(() => {
    const N = 25; // 25x25 modules (QR Model 2, Version 2)
    const grid = Array.from({ length: N }, () => Array(N).fill(false));

    // 1. Place 7x7 Finder Pattern at (r, c)
    const placeFinder = (startR, startC) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[startR + r][startC + c] = isOuter || isInner;
        }
      }
    };

    // Top-Left, Top-Right, Bottom-Left Finder patterns
    placeFinder(0, 0);
    placeFinder(0, N - 7);
    placeFinder(N - 7, 0);

    // Separators around finders
    const isReserved = (r, c) => {
      if (r <= 7 && c <= 7) return true; // Top-left + separator
      if (r <= 7 && c >= N - 8) return true; // Top-right + separator
      if (r >= N - 8 && c <= 7) return true; // Bottom-left + separator
      if (r === 6 || c === 6) return true; // Timing tracks
      if (showCenterLogo && r >= 10 && r <= 14 && c >= 10 && c <= 14) return true; // Center emblem area
      return false;
    };

    // 2. Timing patterns on row 6 and col 6
    for (let i = 8; i < N - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // 3. Fill data modules deterministically using a robust polynomial hash
    let h1 = 0x811c9dc5;
    let h2 = 0x45d9f3b;
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      h1 = Math.imul(h1 ^ code, 0x01000193);
      h2 = Math.imul(h2 ^ (code * 31), 0x5bd1e995);
    }

    let state = (h1 ^ h2) >>> 0;
    const nextBit = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return (state & 0x4000) !== 0;
    };

    // Fill non-reserved modules
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!isReserved(r, c)) {
          grid[r][c] = nextBit();
        }
      }
    }

    // Alignment pattern around (18, 18) if not overlapping
    for (let r = 16; r <= 20; r++) {
      for (let c = 16; c <= 20; c++) {
        if (r < N && c < N && !isReserved(r, c)) {
          const isEdge = r === 16 || r === 20 || c === 16 || c === 20;
          const isCenter = r === 18 && c === 18;
          grid[r][c] = isEdge || isCenter;
        }
      }
    }

    return grid;
  }, [value, showCenterLogo]);

  const N = matrix.length;
  const cellSize = 100 / N;

  return (
    <div
      className={`inline-block p-1.5 rounded-lg bg-white shadow-xs border border-slate-200/80 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
      >
        <rect width="100" height="100" fill={bgColor} rx="3" />
        {matrix.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.05}
                height={cellSize + 0.05}
                fill={fgColor}
              />
            ) : null
          )
        )}
        {showCenterLogo && (
          <g transform="translate(38, 38)">
            <rect width="24" height="24" rx="4" fill="#ffffff" stroke={fgColor} strokeWidth="1.2" />
            <path
              d="M12 4 L19 8 L19 14 C19 18 12 21 12 21 C12 21 5 18 5 14 L5 8 Z"
              fill={fgColor}
            />
            <path d="M9 12 L11.5 14.5 L15.5 9.5" stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * Authentic SVG Barcode generator (Code-128 styling)
 */
export function BarcodeSvg({
  value = "GYAN-2026-8A-042",
  height = 42,
  width = "100%",
  className = "",
  showText = true,
  color = "#0f172a",
}) {
  const bars = useMemo(() => {
    const str = String(value).toUpperCase();
    const pattern = [];

    // Quiet zone start
    pattern.push({ width: 2, isBar: true });
    pattern.push({ width: 1, isBar: false });
    pattern.push({ width: 1, isBar: true });
    pattern.push({ width: 2, isBar: false });

    // Generate bar sequences based on character charcodes
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      const b1 = (code % 3) + 1;
      const s1 = ((code >> 2) % 3) + 1;
      const b2 = ((code >> 4) % 2) + 1;
      const s2 = ((code * 7) % 3) + 1;

      pattern.push({ width: b1, isBar: true });
      pattern.push({ width: s1, isBar: false });
      pattern.push({ width: b2, isBar: true });
      pattern.push({ width: s2, isBar: false });
    }

    // Stop guard
    pattern.push({ width: 2, isBar: true });
    pattern.push({ width: 1, isBar: false });
    pattern.push({ width: 3, isBar: true });
    pattern.push({ width: 1, isBar: false });

    return pattern;
  }, [value]);

  const totalUnits = bars.reduce((acc, b) => acc + b.width, 0);

  let curX = 0;
  const rects = bars
    .map((b, i) => {
      const x = curX;
      curX += b.width;
      if (!b.isBar) return null;
      return (
        <rect
          key={i}
          x={x}
          y="0"
          width={b.width}
          height={height - (showText ? 12 : 0)}
          fill={color}
        />
      );
    })
    .filter(Boolean);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalUnits} ${height - (showText ? 12 : 0)}`}
        style={{ width, height: height - (showText ? 12 : 0) }}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
      >
        {rects}
      </svg>
      {showText && (
        <span
          className="text-[9px] font-mono tracking-widest text-slate-600 mt-1 uppercase font-semibold"
          style={{ letterSpacing: "0.2em" }}
        >
          *{value}*
        </span>
      )}
    </div>
  );
}

/**
 * Holographic security seal badge
 */
export function HologramBadge({ size = 48, className = "" }) {
  return (
    <div
      className={`relative rounded-full flex items-center justify-center overflow-hidden border border-amber-300/60 shadow-inner select-none ${className}`}
      style={{
        width: size,
        height: size,
        background:
          "linear-gradient(135deg, #fef08a 0%, #cbd5e1 25%, #67e8f9 50%, #f472b6 75%, #facc15 100%)",
      }}
    >
      {/* Light sheen animation overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -rotate-45 pointer-events-none" />

      {/* Center Hologram Seal */}
      <div className="relative z-10 w-[78%] h-[78%] rounded-full bg-slate-900/10 backdrop-blur-[1px] border border-white/60 flex flex-col items-center justify-center p-1 text-center shadow-xs">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-900 fill-amber-500/40 stroke-amber-900" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className="text-[6px] font-black uppercase text-amber-950 tracking-tighter leading-none mt-0.5">
          SECURE
        </span>
      </div>
    </div>
  );
}

/**
 * Official circular university / institutional stamp
 */
export function OfficialStamp({ size = 68, className = "" }) {
  return (
    <div
      className={`relative rounded-full flex items-center justify-center select-none rotate-[-6deg] ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full text-rose-700">
        {/* Double circular border */}
        <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="2.2" strokeDasharray="3, 1.5" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" strokeWidth="1" />

        {/* Circular curved text path */}
        <path
          id="stampTextPath"
          d="M 50,50 m -35,0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0"
          fill="none"
        />
        <text className="text-[7.5px] font-black uppercase fill-current tracking-widest">
          <textPath href="#stampTextPath" startOffset="5%">
            • GYANARATNA VIDYAPEETH • VERIFIED &amp; APPROVED
          </textPath>
        </text>

        {/* Center Star and Date */}
        <polygon
          points="50,33 53,42 62,42 55,47 57,56 50,51 43,56 45,47 38,42 47,42"
          fill="currentColor"
          opacity="0.85"
        />
        <text x="50" y="66" textAnchor="middle" className="text-[6.5px] font-bold fill-current">
          2026-27
        </text>
      </svg>
    </div>
  );
}

/**
 * Cursive Principal / Authorized Signatory vector signature
 */
export function SignatureGraphic({ name = "Prof. S. Purohit", title = "Authorized Signatory / Dean", className = "" }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 160 40" className="w-28 h-7 text-indigo-950 overflow-visible">
        {/* Artistic cursive signature path */}
        <path
          d="M10 28 C 25 15, 30 8, 42 12 C 48 15, 52 26, 60 22 C 72 16, 75 8, 85 10 C 95 12, 102 32, 115 18 C 122 10, 135 14, 148 24 M35 24 Q 90 28 155 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="w-full border-t border-slate-400/80 pt-0.5 text-center">
        <span className="block text-[8px] font-bold text-slate-800 leading-tight uppercase tracking-wider">
          {name}
        </span>
        <span className="block text-[7px] text-slate-500 font-medium leading-none">
          {title}
        </span>
      </div>
    </div>
  );
}
