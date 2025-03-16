// firebase-messaging-sw.js
// 이 파일은 반드시 웹사이트의 최상위 폴더(루트)에 저장해야 합니다

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase 설정
firebase.initializeApp({
  apiKey: "AIzaSyBvPubtp1RgwRmRghto_4qCh-UJ3QrzooM",
  authDomain: "alimi-5eef5.firebaseapp.com",
  projectId: "alimi-5eef5",
  storageBucket: "alimi-5eef5.appspot.com",
  messagingSenderId: "102026935593",
  appId: "1:102026935593:web:7de57bc2e464bd328f4b38"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('백그라운드 메시지 수신:', payload);
  
  const notificationTitle = payload.notification?.title || "학습 체크 알림";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || "새로운 알림이 있습니다.",
    icon: '/favicon.ico',
    badge: '/badge-icon.png',
    data: payload.data,
    // 알림을 터치하면 열릴 URL (선택 사항)
    actions: [
      {
        action: 'open',
        title: '앱 열기'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('알림 클릭됨:', event);
  
  // 알림 닫기
  event.notification.close();
  
  // 클릭한 액션 확인
  const action = event.action;
  
  // 알림 데이터 가져오기
  const data = event.notification.data;
  let urlToOpen = '/';
  
  // 데이터가 있으면 특정 URL로 이동
  if (data && data.url) {
    urlToOpen = data.url;
  }
  
  // 기존 창이 있으면 포커스, 없으면 새 창 열기
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((windowClients) => {
      // 이미 열린 창이 있는지 확인
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // 열린 창이 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// 푸시 이벤트 처리
self.addEventListener('push', (event) => {
  console.log('푸시 이벤트 발생:', event);
  
  if (event.data) {
    // 푸시 데이터 파싱 시도
    try {
      const data = event.data.json();
      console.log('푸시 데이터:', data);
      
      const title = data.notification?.title || "학습 체크 알림";
      const options = {
        body: data.notification?.body || "새로운 알림이 있습니다.",
        icon: '/favicon.ico',
        badge: '/badge-icon.png',
        data: data.data || {}
      };
      
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    } catch (error) {
      console.error('푸시 데이터 파싱 중 오류:', error);
      
      // 기본 알림 표시
      event.waitUntil(
        self.registration.showNotification("학습 체크", {
          body: "새로운 알림이 있습니다",
          icon: '/favicon.ico'
        })
      );
    }
  }
});

// 서비스 워커 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker 설치됨');
  self.skipWaiting();
});

// 서비스 워커 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화됨');
  return self.clients.claim();
});
