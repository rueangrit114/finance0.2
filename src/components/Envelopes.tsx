"use client";
import { useState } from "react";
import type { Envelope } from "@/lib/types";
import { baht } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase";
import { FAMILY_USER_ID } from "@/lib/config";

function status(ratio: number) {
  if (ratio >= 1) return { label: "เต็มแล้ว", color: "#ef6b6b" };
  if (ratio >= 0.8) return { label: "ใกล้เต็ม", color: "#ff9e64" };
  if (ratio >= 0.5) return { label: "ครึ่งทาง", color: "#f2b84b" };
  return { label: "ปกติ", color: "#5fd68a" };
}

export default function Envelopes({
  envelopes, spentByCat, onChanged,
}: { envelopes: Envelope[]; spentByCat: Record<string, number>; onChanged: () => void }) {
  const [edit, setEdit] = useState<Partial<Envelope> | null>(null);
  const [err, setErr] = useState("");

  async function save() {
    if (!edit?.name?.trim()) return setErr("ใส่ชื่อซองก่อนค่ะ");
    setErr("");
    const row = {
      user_id: FAMILY_USER_ID,
      name: edit.name.trim(),
      budget: Number(edit.budget) || 0,
      icon: edit.icon?.trim() || "💰",
    };
    const sb = supabaseBrowser();
    const { error } = edit.id
      ? await sb.from("envelopes").update(row).eq("id", edit.id)
      : await sb.from("envelopes").insert(row);
    if (error) return setErr(error.message);
    setEdit(null);
    onChanged();
  }

  async function remove(id: string) {
    if (!confirm("ลบซองนี้? (รายการธุรกรรมจะไม่ถูกลบ)")) return;
    await supabaseBrowser().from("envelopes").delete().eq("id", id);
    setEdit(null);
    onChanged();
  }

  return (
    <section className="card" aria-label="ซองงบประมาณ">
      <div className="card-head">
        <h2>ซองงบประมาณ <small className="muted">เดือนนี้</small></h2>
        <button className="btn ghost" onClick={() => setEdit({ name: "", budget: 1000, icon: "💰" })}>＋ เพิ่มซอง</button>
      </div>
      <div className="env-grid">
        {envelopes.map((e) => {
          const used = spentByCat[e.name] ?? 0;
          const ratio = e.budget > 0 ? used / e.budget : used > 0 ? 1 : 0;
          const st = status(ratio);
          return (
            <button key={e.id} className="env" onClick={() => setEdit(e)} aria-label={`แก้ไขซอง ${e.name}`}>
              <div className="env-top"><span className="env-ico">{e.icon}</span><b>{e.name}</b><span className="kebab">⋮</span></div>
              <div className="env-amt">{baht(used)}<small> / {baht(e.budget)}</small></div>
              <div className="bar"><i style={{ width: `${Math.min(100, ratio * 100)}%`, background: st.color }} /></div>
              <div className="env-st" style={{ color: st.color }}>{st.label} · {Math.round(ratio * 100)}%</div>
            </button>
          );
        })}
        {envelopes.length === 0 && <p className="muted">ยังไม่มีซอง กด “เพิ่มซอง” ได้เลย</p>}
      </div>

      {edit && (
        <div className="modal-bg" onClick={() => setEdit(null)} role="dialog" aria-modal="true">
          <div className="modal small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><h3>{edit.id ? "แก้ไขซอง" : "เพิ่มซอง"}</h3>
              <button className="icon-btn" onClick={() => setEdit(null)} aria-label="ปิด">✕</button></div>
            <label>ชื่อซอง (ต้องตรงกับหมวดรายจ่าย)
              <input value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label>
            <label>งบต่อเดือน (บาท)
              <input type="number" inputMode="decimal" value={edit.budget ?? 0} onChange={(e) => setEdit({ ...edit, budget: Number(e.target.value) })} /></label>
            <label>ไอคอน (อีโมจิ)
              <input value={edit.icon ?? ""} maxLength={4} onChange={(e) => setEdit({ ...edit, icon: e.target.value })} /></label>
            {err && <p className="err">{err}</p>}
            <div className="row">
              {edit.id && <button className="btn danger" onClick={() => remove(edit.id!)}>ลบ</button>}
              <button className="btn" onClick={save}>บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
