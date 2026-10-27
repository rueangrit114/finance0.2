"use client";
import { useMemo, useState } from "react";
import { THEMES } from "@/lib/themes";

export default function ThemePicker({
  current, onPick, onClose,
}: { current: string; onPick: (id: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? THEMES.filter((t) => t.name.toLowerCase().includes(s)) : THEMES;
  }, [q]);
  return (
    <div className="modal-bg" onClick={onClose} role="dialog" aria-modal="true" aria-label="เลือกธีม">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>เลือกธีม ({list.length}/{THEMES.length})</h3>
          <button className="icon-btn" onClick={onClose} aria-label="ปิด">✕</button>
        </div>
        <input className="search" placeholder="ค้นหา เช่น Ocean, Light, Vivid…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="theme-grid">
          {list.map((t) => (
            <button
              key={t.id}
              className={`theme-tile ${t.id === current ? "on" : ""}`}
              onClick={() => onPick(t.id)}
              title={t.name}
            >
              <span className="sw" style={{ background: `linear-gradient(90deg, ${t.swatch[0]} 0 40%, ${t.swatch[1]} 40% 70%, ${t.swatch[2]} 70%)` }} />
              <span className="nm">{t.name}</span>
            </button>
          ))}
          {list.length === 0 && <p className="muted">ไม่พบธีม</p>}
        </div>
      </div>
    </div>
  );
}
