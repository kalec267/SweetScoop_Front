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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = getAnalytics(app);

export const db = getFirestore(app);

console.log("현재 연결된 파이어베이스 프로젝트 ID:", getApp().options.projectId);