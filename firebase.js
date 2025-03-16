// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBvPubtp1RgwRmRghto_4qCh-UJ3QrzooM",
  authDomain: "alimi-5eef5.firebaseapp.com",
  projectId: "alimi-5eef5",
  storageBucket: "alimi-5eef5.appspot.com",
  messagingSenderId: "102026935593",
  appId: "1:102026935593:web:7de57bc2e464bd328f4b38"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app);

// FCM 토큰 가져오기
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // VAPID 키는 Firebase 콘솔에서 생성한 웹 푸시 인증서의 공개 키입니다
      const currentToken = await getToken(messaging, {
        vapidKey: 'BIx-fXsztVTbYegMa2Mk6F4qjH5sk1OiBv1JvTlSnrGXwsmTk5ZhtjJVjGkunwJtO1nTVKrvZrMFtrF8BGW6J1k' // Firebase 콘솔에서 생성한 웹 푸시 인증서 키로 교체
      });
      
      if (currentToken) {
        console.log('FCM 토큰:', currentToken);
        
        // 토큰을 Firestore에 사용자와 연결하여 저장할 수 있습니다
        const userRef = doc(db, "users", localStorage.getItem("currentUser") || "anonymous");
        await setDoc(userRef, { fcmToken: currentToken }, { merge: true });
        
        return currentToken;
      } else {
        console.log('토큰을 가져올 수 없습니다');
        return null;
      }
    } else {
      console.log('알림 권한이 거부되었습니다');
      return null;
    }
  } catch (err) {
    console.error('FCM 토큰 얻기 오류:', err);
    return null;
  }
}

// 포그라운드 메시지 수신 처리
onMessage(messaging, (payload) => {
  console.log('메시지 수신됨:', payload);
  
  // 수신된 메시지로 사용자 정의 알림 표시
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico' // 원하는 아이콘으로 교체
  };
  
  new Notification(notificationTitle, notificationOptions);
});

export { db, collection, doc, setDoc, getDocs, messaging, requestNotificationPermission };
