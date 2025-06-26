import React, { useEffect, useState } from 'react';
import './styles.css';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBNycgqh3wSyKCPeAUIpvIbTGpgqM8aUJI",
  authDomain: "team-task-dashboard-188fd.firebaseapp.com",
  projectId: "team-task-dashboard-188fd",
  storageBucket: "team-task-dashboard-188fd.appspot.com",
  messagingSenderId: "830092054067",
  appId: "1:830092054067:web:686d101752bf9b39f69d46"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [tasks, setTasks] = useState([]);
  const [monthlyTasks, setMonthlyTasks] = useState([]);
  const [yearlyTasks, setYearlyTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, "tasks"));
      const tasksData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);
      setMonthlyTasks(tasksData.filter(task => task.period === 'monthly'));
      setYearlyTasks(tasksData.filter(task => task.period === 'yearly'));
    };

    fetchTasks();
  }, []);

  const calculateStats = (tasks) => {
    const handledByStats = {};
    const categoryStats = {};
    const frequencyStats = {};

    tasks.forEach(task => {
      handledByStats[task.handledBy] = (handledByStats[task.handledBy] || 0) + 1;
      categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
      frequencyStats[task.frequency] = (frequencyStats[task.frequency] || 0) + 1;
    });

    const total = tasks.length;

    const calculatePercentage = (stat) =>
      Object.fromEntries(Object.entries(stat).map(([key, value]) => [key, ((value / total) * 100).toFixed(1)]));

    return {
      handledBy: calculatePercentage(handledByStats),
      category: calculatePercentage(categoryStats),
      frequency: calculatePercentage(frequencyStats),
    };
  };

  const monthlyStats = calculateStats(monthlyTasks);
  const yearlyStats = calculateStats(yearlyTasks);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Finance Dashboard</h1>

      <section>
        <h2>Monthly Tasks</h2>
        <div>
          <h3>Handled By</h3>
          <ul>
            {Object.entries(monthlyStats.handledBy).map(([name, percentage]) => (
              <li key={name}>{name}: {percentage}%</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Category</h3>
          <ul>
            {Object.entries(monthlyStats.category).map(([cat, percentage]) => (
              <li key={cat}>{cat}: {percentage}%</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Frequency</h3>
          <ul>
            {Object.entries(monthlyStats.frequency).map(([freq, percentage]) => (
              <li key={freq}>{freq}: {percentage}%</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2>Yearly Tasks</h2>
        <div>
          <h3>Handled By</h3>
          <ul>
            {Object.entries(yearlyStats.handledBy).map(([name, percentage]) => (
              <li key={name}>{name}: {percentage}%</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Category</h3>
          <ul>
            {Object.entries(yearlyStats.category).map(([cat, percentage]) => (
              <li key={cat}>{cat}: {percentage}%</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Frequency</h3>
          <ul>
            {Object.entries(yearlyStats.frequency).map(([freq, percentage]) => (
              <li key={freq}>{freq}: {percentage}%</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default App;
