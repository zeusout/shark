import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs } from "firebase/firestore";

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

export { db, collection, doc, setDoc, getDocs };
