import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyDfN8DoYPyJbVM3y3MWaFdz0mhrpqLFuZo",
  authDomain: "data-journaling.firebaseapp.com",
  projectId: "data-journaling",
  storageBucket: "data-journaling.firebasestorage.app",
  messagingSenderId: "738602468552",
  appId: "1:738602468552:web:abfffbe405bd8f3f1a11fd",
  measurementId: "G-QNHEJD6HV4"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const geminiApiKey = "AIzaSyBcGTlB3bK26F63bCVM-Gfz5rL0h_mgaN0";