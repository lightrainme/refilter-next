import { Suspense } from "react";
import ResultClient from "./ResultClient";

export default function ResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultClient />
    </Suspense>
  );
}
