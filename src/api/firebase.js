// src/api/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBMiMwXVgrA93DR3mtAO5ZY9BOV3nvXcF8",
  authDomain: "sweetscoop-971dd.firebaseapp.com",
  projectId: "sweetscoop-971dd",
  storageBucket: "sweetscoop-971dd.firebasestorage.app",
  messagingSenderId: "903554353672",
  appId: "1:903554353672:web:95a88817e925cb1ec95fbd",
  measurementId: "G-JXPHZXJP7M"
};

// 💡 이미 초기화된 앱이 있다면 재사용하고, 없으면 새로 초기화합니다 (중복 방지)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = getAnalytics(app);

// 💡 'orders' 데이터베이스 명시적 연결
export const db = getFirestore(app, "orders");