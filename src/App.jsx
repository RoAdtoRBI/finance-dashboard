import React, { useEffect, useState } from 'react';
import './styles.css';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
} from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBNycgqh3wSyKCPeAUIpvIbTGpgqM8aUJI",
  authDomain: "team-task-dashboard-188fd.firebaseapp.com",
  projectId: "team-task-dashboard-188fd",
  storageBucket: "team-task-dashboard-188fd.appspot.com",
  messagingSenderId: "830092054067",
  appId: "1:830092054067:web:686d101752bf9b39f69d46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const App = () => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("User changed:", currentUser);
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch tasks
  useEffect(() => {
    if (user) {
      const fetchTasks = async () => {
        try {
          const snapshot = await getDocs(collection(db, "tasks"));
          const data = snapshot.docs.map(doc => doc.data());
          console.log("Fetched tasks:", data);
          setTasks(data);
        } catch (error) {
          console.error("Error fetching tasks:", error);
        }
      };
      fetchTasks();
    }
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow text-center">
          <h1 className="text-2xl font-bold mb-2">Loading App...</h1>
          <p>Please wait while we prepare the dashboard.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded shadow text-center">
          <h2 className="text-xl font-semibold mb-2">Login Required</h2>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleLogin}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Finance Dashboard</h1>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 shadow rounded">
          <h2 className="font-semibold mb-2">Task Count</h2>
          <p className="text-xl">{tasks.length}</p>
        </div>
        <div className="bg-white p-4 shadow rounded">
          <h2 className="font-semibold mb-2">Preview (First Task)</h2>
          <pre className="text-sm">{tasks[0] ? JSON.stringify(tasks[0], null, 2) : "No tasks available"}</pre>
        </div>
      </div>
    </div>
  );
};

export default App;
