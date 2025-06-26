import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNycgqh3wSyKCPeAUIpvIbTGpgqM8aUJI",
  authDomain: "team-task-dashboard-188fd.firebaseapp.com",
  projectId: "team-task-dashboard-188fd",
  storageBucket: "team-task-dashboard-188fd.appspot.com",
  messagingSenderId: "830092054067",
  appId: "1:830092054067:web:686d101752bf9b39f69d46"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);