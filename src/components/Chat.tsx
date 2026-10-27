"use client";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = ["กินข้าวไป 60 บาท", "ได้เงินเดือน 30,000", "ค่าแท็กซี่ 150", "ซื้อกาแฟ 85"];

export default function Chat({ onSaved }: { onSaved: () => void }) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    { id: "hello", role: "bot", text: "สวัสดีค่ะ 👋 พิมพ์รายรับรายจ่ายได้เลย เช่น “กินข้าวไป 60 บาท” หรือ “ได้เงินเดือน 30,000” เดี๋ยวบันทึกให้ค่ะ" },
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  async function send(raw: string) {
    const message = raw.trim();
    if (!message || busy) return;
    setText("");
    setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as { ok: boolean; reply: string };
      setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "bot", text: data.reply }]);
      if (data.ok) onSaved();
    } catch {
      setMsgs((m) => [...m, { id: crypto.randomUUID(), role: "bot", text: "เชื่อมต่อไม่ได้ค่ะ ลองใหม่อีกครั้งนะคะ" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card chat" aria-label="แชทบอทบันทึกบัญชี">
      <header className="chat-head">
        <span className="bot-avatar" aria-hidden>🤖</span>
        <div>
          <strong>น้องบัญชี</strong>
          <small>บอกรายรับรายจ่ายได้เลย</small>
        </div>
      </header>
      <div className="chat-log" role="log" aria-live="polite">
        {msgs.map((m) => (
          <div key={m.id} className={`bubble ${m.role}`}>{m.text}</div>
        ))}
        {busy && <div className="bubble bot typing"><i /><i /><i /></div>}
        <div ref={end} />
      </div>
      <div className="chips">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => send(s)} disabled={busy}>{s}</button>
        ))}
      </div>
      <form className="chat-form" onSubmit={(e) => { e.preventDefault(); send(text); }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="เช่น กินข้าวไป 60 บาท"
          aria-label="ข้อความ"
          maxLength={500}
          enterKeyHint="send"
        />
        <button type="submit" disabled={busy || !text.trim()} aria-label="ส่ง">➤</button>
      </form>
    </section>
  );
}
