// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDzyS6SLIpvCztJI2B_2u5UXV2V3LXIkS8",
  authDomain: "dbrestoran-36828.firebaseapp.com",
  projectId: "dbrestoran-36828",
  storageBucket: "dbrestoran-36828.firebasestorage.app",
  messagingSenderId: "599641091348",
  appId: "1:599641091348:web:b7d7176e622c342d206601",
  measurementId: "G-GELBHE280S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});