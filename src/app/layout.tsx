import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "../components/Footer";
import LayoutWrapper from "../components/LayoutWrapper";

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
    icon: "favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased w-screen h-screen bg-gray-100`}>
        <LayoutWrapper>{children}</LayoutWrapper>
        <Footer />
      </body>
    </html>
  );
}
