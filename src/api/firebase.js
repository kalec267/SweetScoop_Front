// src/api/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDVhihEnsrXJblczI6XS-HJ2WG4h3Uj7cE",
    authDomain: "sweetscoop-f5ca9.firebaseapp.com",
    projectId: "sweetscoop-f5ca9",
    storageBucket: "sweetscoop-f5ca9.firebasestorage.app",
    messagingSenderId: "157221535588",
    appId: "1:157221535588:web:908f9f89a0db78228a4471",
    measurementId: "G-NQLST5N3SM"
  };

// 💡 이미 초기화된 앱이 있다면 재사용하고, 없으면 새로 초기화합니다 (중복 방지)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = getAnalytics(app);

// 💡 핵심: 데이터베이스 ID "default"를 인자로 정확히 전달합니다.
export const db = getFirestore(app);

console.log("현재 연결된 파이어베이스 프로젝트 ID:", getApp().options.projectId);