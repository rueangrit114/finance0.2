import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { FAMILY_USER_ID, DEFAULT_CATEGORIES } from "@/lib/config";

// รันบน Edge Runtime ของ Cloudflare
export const runtime = "edge";

interface Parsed {
  amount: number;
  type: "income" | "expense";
  category: string;
  note: string;
}

const SYSTEM_PROMPT = `คุณคือตัวแยกข้อมูลบัญชีรายรับรายจ่ายภาษาไทย
แปลงข้อความของผู้ใช้เป็น JSON หนึ่งรายการเท่านั้น ห้ามมีคำอธิบายอื่น
- amount: ตัวเลขบวก หน่วยบาท (เช่น "30,000" = 30000, "5 พัน" = 5000, "2k" = 2000)
- type: "income" ถ้าได้เงินเข้า (เงินเดือน โบนัส ขายของ ได้รับ) นอกนั้น "expense"
- category: เลือกจากรายการนี้ให้ใกล้เคียงที่สุด: ${DEFAULT_CATEGORIES.join(", ")}
  (ถ้าไม่เข้ากับอะไรเลยให้ใช้ "อื่นๆ")
- note: คำอธิบายสั้นๆ ไม่เกิน 5 คำ ไม่ต้องใส่ตัวเลข เช่น "กินข้าว", "เงินเดือน"
ถ้าข้อความไม่ใช่การบันทึกเงิน หรือไม่มีจำนวนเงิน ให้ใส่ amount เป็น 0`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    amount: { type: "NUMBER" },
    type: { type: "STRING", enum: ["income", "expense"] },
    category: { type: "STRING" },
    note: { type: "STRING" },
  },
  required: ["amount", "type", "category", "note"],
  propertyOrdering: ["amount", "type", "category", "note"],
};

async function askGemini(message: string): Promise<Parsed> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: message }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json", // บังคับตอบเป็น JSON
          responseSchema: RESPONSE_SCHEMA,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const obj = JSON.parse(text) as Partial<Parsed>;

  return {
    amount: Number(obj.amount) || 0,
    type: obj.type === "income" ? "income" : "expense",
    category: String(obj.category || "อื่นๆ").trim() || "อื่นๆ",
    note: String(obj.note || "").trim(),
  };
}

const fmt = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });

export async function POST(req: Request) {
  let message = "";
  try {
    const body = (await req.json()) as { message?: string };
    message = (body.message ?? "").toString().trim().slice(0, 500);
  } catch {
    return NextResponse.json({ ok: false, reply: "ข้อมูลที่ส่งมาไม่ถูกต้องค่ะ" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ ok: false, reply: "พิมพ์ข้อความก่อนนะคะ" }, { status: 400 });
  }

  try {
    // 1) ส่งให้ Gemini แยกเป็น JSON
    const tx = await askGemini(message);
    if (!(tx.amount > 0)) {
      return NextResponse.json({
        ok: false,
        reply: "ยังไม่เจอจำนวนเงินเลยค่ะ ลองพิมพ์เช่น “กินข้าว 60 บาท” หรือ “ได้เงินเดือน 30,000” นะคะ",
      });
    }

    // 2) insert ลง Supabase
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: FAMILY_USER_ID,
        type: tx.type,
        amount: tx.amount,
        category: tx.category,
        note: tx.note || null,
      })
      .select()
      .single();
    if (error) throw new Error(`Supabase: ${error.message}`);

    // 3) ตอบยืนยัน
    const label =
      tx.type === "income"
        ? `รายรับ ${tx.note || tx.category}`
        : tx.note.startsWith("ค่า") ? tx.note : `ค่า${tx.note || tx.category}`;
    return NextResponse.json({
      ok: true,
      reply: `บันทึก ${label} จำนวน ${fmt(tx.amount)} บาท เรียบร้อยแล้วค่ะ!`,
      transaction: data,
    });
  } catch (e) {
    console.error("chat error", e);
    return NextResponse.json(
      { ok: false, reply: "ขออภัยค่ะ ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้งนะคะ" },
      { status: 500 }
    );
  }
}
