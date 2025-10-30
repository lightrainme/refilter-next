// 캐시 이름 정의
const CACHE_NAME = 'refilter-cache-v2';

// 캐시할 파일 목록
const urlsToCache = [
  '/',           // 메인 페이지
  '/search',     // 검색 페이지
  '/manifest.json',
  '/icon/icon-192x192.png',
  '/icon/icon-512x512.png'
];

// 설치 단계: 캐시 저장
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// 요청 가로채기: 캐시 우선 응답
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});

// 새로운 버전이 있으면 캐시 갱신
self.addEventListener('activate', (event) => {
  const whitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (!whitelist.includes(name)) return caches.delete(name);
        })
      )
    )
  );
});