"use client";

import { useState } from "react";        // React 상태관리를 위한 Hooks
import { FiMenu } from "react-icons/fi"; // 모바일에서 사용할 햄버거 메뉴 아이콘

/**
 * Sidebar 컴포넌트
 * - categories: [{ name: "전자제품", children: [{ name: "노트북" }, ...] }]
 * - 태블릿/모바일에서는 숨겨지고 햄버거 버튼으로 열림
 * - 노트북/PC에서는 항상 보이는 UI
 */

type Category = {
  name: string;
  children?: { name: string }[];
};

interface SidebarProps {
categories: Category[];
}

export default function Sidebar({ categories }: SidebarProps) {
  // 모바일·태블릿에서 사이드바 열기/닫기 제어
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* =============================
          📱 모바일/태블릿 햄버거 버튼
          - md:hidden : 화면 폭이 md(768px↑) 이상이면 숨김
          - 즉, md 미만(모바일/태블릿)에서만 보임
      ============================== */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded bg-white shadow"
        onClick={() => setOpen(!open)} // 클릭하면 사이드바 on/off
      >
        <FiMenu size={24} />
      </button>

      {/* =============================
          🧱 사이드바 컨테이너
          - 모바일: open ? 보임 : 화면 밖
          - PC: 항상 보임(md:translate-x-0)
          - transform + transition : 부드러운 슬라이드 애니메이션
      ============================== */}
      <aside
        className={`
          fixed top-0 left-0 h-100vh bg-white shadow-lg border-r
          transform transition-transform duration-300 ease-in-out
          w-64 z-40
          {/* 모바일에서 토글 */}
          ${open ? "translate-x-0" : "-translate-x-full"}

          {/* md 이상에서는 항상 보임 */}
          md:translate-x-0 md:static
        `}
      >
        {/* =============================
            🔖 사이드바 헤더
        ============================== */}
        <div className="p-4 text-xl font-bold border-b">
          Refilter Articles
        </div>

        {/* =============================
            📚 카테고리 리스트 영역
        ============================== */}
        <nav className="p-4 space-y-3">
          {/* 카테고리가 없는 경우 */}
          {categories.length === 0 && (
            <p className="text-gray-500 text-sm">카테고리가 없습니다.</p>
          )}

          {/* 대분류 + 하위 카테고리를 출력 */}
          {categories.map((cat) => (
            <div key={cat.name} className="space-y-1">
              {/* 1️⃣ 대분류 */}
              <p className="font-semibold">{cat.name}</p>

              {/* 2️⃣ 하위 카테고리 (children) */}
              <ul className="pl-4 space-y-1 text-gray-700 text-sm">
                {cat.children?.map((child) => (
                  <li
                    key={child.name}
                    className="hover:text-indigo-600 cursor-pointer"
                  >
                    {child.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* =============================
          🌙 모바일/태블릿 오버레이
          - 사이드바가 열렸을 때 배경을 반투명하게
          - 클릭하면 사이드바 닫힘
      ============================== */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}