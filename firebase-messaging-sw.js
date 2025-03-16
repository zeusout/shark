// firebase-messaging-sw.js
// 이 파일은 웹 루트에 위치해야 합니다

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

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
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
