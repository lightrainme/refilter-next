import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "../components/Footer";
import LayoutWrapper from "../components/LayoutWrapper";
import ServiceWorkerRegister from "../components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "진짜 Re뷰만 모으는 Refilter",
  description: "진짜 리뷰만 골라보세요. Refilter가 진짜를 필터링 해드립니다",
  icons: {
    icon: [
      { url: "/icons/icon-512x512.png", type: "image/png" },
    ],
    apple: { url: "/icons/icon-512x512.png" },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ 캐시 무효화를 위한 버전 쿼리 추가 (매번 빌드 시 갱신)
  const manifestVersion = new Date().getTime();

  return (
    <html lang="ko" suppressHydrationWarning>
      {/* ✅ head 영역에 manifest 링크 추가 */}
      <head>
        <link rel="manifest" href={`/manifest-beta.json?v=${manifestVersion}`} />
        <meta name="theme-color" content="#5d1e79" />
        <link rel="apple-touch-icon" href="/icons/android-chrome-512x512.png" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-screen h-screen bg-gray-100`}
      >
        <LayoutWrapper>{children}</LayoutWrapper>
        <Footer />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}