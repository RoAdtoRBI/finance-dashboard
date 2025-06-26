import React from 'react';
import './styles.css';

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📊 Finance Dashboard</h1>
        <p className="text-gray-500">Track your team's monthly and yearly finance activity.</p>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Team Member Performance</h2>
          <p>Arun: 0.0%</p>
          <p>Rohit: 0.0%</p>
          <p>Shekar: 0.0%</p>
          <p>Sudheer: 0.0%</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Tasks by Category (Monthly)</h2>
          <ul className="list-disc list-inside">
            <li>Operations – 15 (48.4%)</li>
            <li>Statutory – 5 (16.1%)</li>
            <li>Audit – 5 (16.1%)</li>
            <li>Reports – 4 (12.9%)</li>
            <li>Expense Schedules – 2 (6.5%)</li>
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Tasks by Frequency (Monthly)</h2>
          <ul className="list-disc list-inside">
            <li>Daily – 15 (48.4%)</li>
            <li>Monthly – 12 (38.7%)</li>
            <li>Weekly – 4 (12.9%)</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default App;
