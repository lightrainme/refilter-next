// eslint.config.mjs

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

// 기존 ESLint 규칙을 불러오되, 빌드 시 문제되는 규칙들을 완화함
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  nextPlugin.configs["core-web-vitals"],
  {
    rules: {
      // any 타입 허용
      "@typescript-eslint/no-explicit-any": "off",
      // 사용되지 않은 변수 경고 비활성화
      "@typescript-eslint/no-unused-vars": "off",
      // useEffect 의존성 검사 비활성화
      "react-hooks/exhaustive-deps": "off",
      // console.log 허용
      "no-console": "off",
    },
  },
];
