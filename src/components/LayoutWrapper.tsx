"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = pathname !== "/search";

  return (
    <>
      {showHeader && <Header />}
      <main className="flex-grow">{children}</main>
    </>
  );
}