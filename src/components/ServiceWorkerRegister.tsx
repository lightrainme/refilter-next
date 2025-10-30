'use client';
import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(() => console.log('✅ Service Worker registered!'))
        .catch((err) => console.log('Service Worker registration failed:', err));
    }
  }, []);

  return null; // UI는 없으니까 아무것도 렌더링하지 않음
}