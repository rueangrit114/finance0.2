import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinanceChat · บันทึกรายรับรายจ่ายด้วยแชท",
  description: "พิมพ์คุยกับแชทบอทเพื่อบันทึกรายรับรายจ่าย พร้อมซองงบประมาณ",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f2a2c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
