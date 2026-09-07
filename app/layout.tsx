import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "윷놀이 & 열역학 제2법칙 시뮬레이터",
  description: "3D 윷 던지기를 통한 엔트로피 시각화",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-stone-950 text-stone-100 antialiased">{children}</body>
    </html>
  );
}
