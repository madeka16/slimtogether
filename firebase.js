// 🔥 ВСТАВЬ СЮДА СВОИ ДАННЫЕ ИЗ FIREBASE CONSOLE
// Инструкция в README.md

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey:            "AIzaSyBQ2RAa3RTJY3wrnHz5BGeERfbfEjIcWqs",
  authDomain:        "slimtogether-c47e0.firebaseapp.com",
  databaseURL:       "https://slimtogether-c47e0-default-rtdb.firebaseio.com",
  projectId:         "slimtogether-c47e0",
  storageBucket:     "slimtogether-c47e0.firebasestorage.app",
  messagingSenderId: "508394741524",
  appId:             "1:508394741524:web:ff06acab820a03192cac01",
};

const app  = initializeApp(firebaseConfig);
export const db = getDatabase(app);
