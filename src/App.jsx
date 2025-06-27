import React from 'react';
import './styles.css';

const tasks = [
  {
    "title": "Revenue Entries",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "Daily",
    "category": "Operations",
    "dueDate": "Daily",
    "commitment": "Daily"
  },
  {
    "title": "Purchase Entries",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "Daily",
    "category": "Operations",
    "dueDate": "Daily",
    "commitment": "Daily"
  },
  {
    "title": "Expense Entries",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "Daily",
    "category": "Operations",
    "dueDate": "Daily",
    "commitment": "Daily"
  },
  {
    "title": "Payments",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "Daily",
    "category": "Operations",
    "dueDate": "Daily",
    "commitment": "Daily"
  },
  {
    "title": "E-Way Bills",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "On-Demand",
    "category": "Operations",
    "dueDate": "On-Demand",
    "commitment": "On-Demand"
  },
  {
    "title": "Other Adhoc Documents",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "On-Demand",
    "category": "Operations",
    "dueDate": "On-Demand",
    "commitment": "On-Demand"
  },
  {
    "title": "Sales, Cash Flow & Stock Reports",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "Daily",
    "category": "Operations",
    "dueDate": "Daily",
    "commitment": "Daily"
  },
  {
    "title": "Factory/Other Outstandings",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "Monday",
    "category": "Operations",
    "dueDate": "Monday",
    "commitment": "Monday"
  },
  {
    "title": "Bank Reconciliation",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "Daily",
    "category": "Operations",
    "dueDate": "Daily",
    "commitment": "Daily"
  },
  {
    "title": "Invoice Rate vs PI Reconciliation",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "Daily",
    "category": "Operations",
    "dueDate": "Daily",
    "commitment": "Daily"
  },
  {
    "title": "Salary Advance Reconciliations",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Operations",
    "dueDate": "Monthly",
    "commitment": "Monthly"
  },
  {
    "title": "Visiting Departmental Offices",
    "handledBy": "Shekar",
    "reviewedBy": "Rohit",
    "frequency": "On-Demand",
    "category": "Operations",
    "dueDate": "On-Demand",
    "commitment": "On-Demand"
  },
  {
    "title": "Debtors/Creditor Ageing",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Statutory",
    "dueDate": "Monthly",
    "commitment": "Monthly"
  },
  {
    "title": "MSME Workings",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Statutory",
    "dueDate": "Monthly",
    "commitment": "Monthly"
  },
  {
    "title": "Monthly TDS Workings",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Statutory",
    "dueDate": "7th",
    "commitment": "5th"
  },
  {
    "title": "Monthly GSTR1 Workings",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Statutory",
    "dueDate": "11th",
    "commitment": "9th"
  },
  {
    "title": "Monthly GSTR3B Workings",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Statutory",
    "dueDate": "20th",
    "commitment": "18th"
  },
  {
    "title": "Monthly PT Workings & Returns",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Statutory",
    "dueDate": "10th",
    "commitment": "5th"
  },
  {
    "title": "Monthly PF & ESI Workings",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Statutory",
    "dueDate": "15th",
    "commitment": "14th"
  },
  {
    "title": "Quarterly TDS Returns",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Quarterly",
    "category": "Statutory",
    "dueDate": "30th Jul/Oct/Jan/May",
    "commitment": "15th Jul/Oct/Jan/May"
  },
  {
    "title": "Import & Export Documentation",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "On-Demand",
    "category": "Exim",
    "dueDate": "On-Demand",
    "commitment": "On-Demand"
  },
  {
    "title": "Expense Schedules",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Audit",
    "dueDate": "7th",
    "commitment": "7th"
  },
  {
    "title": "Ledger Reconciliations",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Weekly",
    "category": "Operations",
    "dueDate": "Weekly",
    "commitment": "Weekly"
  },
  {
    "title": "Prepared Expense Schedules",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Audit",
    "dueDate": "7th",
    "commitment": "7th"
  },
  {
    "title": "Fixed Asset Register",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Audit",
    "dueDate": "25th",
    "commitment": "25th"
  },
  {
    "title": "PF ESI Reconciliation & Documentation",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Audit",
    "dueDate": "Monthly",
    "commitment": "28th"
  },
  {
    "title": "TDS Reconciliation Documentation",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Audit",
    "dueDate": "Monthly",
    "commitment": "30th"
  },
  {
    "title": "GST Reconciliation & Documentation",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "Monthly",
    "category": "Audit",
    "dueDate": "Monthly",
    "commitment": "22nd"
  },
  {
    "title": "Import & Export Checklist Approval",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "On-Demand",
    "category": "Exim",
    "dueDate": "On-Demand",
    "commitment": "On-Demand"
  },
  {
    "title": "Agreements Filing",
    "handledBy": "Sudheer",
    "reviewedBy": "Rohit",
    "frequency": "On-Demand",
    "category": "Operations",
    "dueDate": "On-Demand",
    "commitment": "On-Demand"
  },
];

const countByField = (field) => {
  const result = {};
  for (const task of tasks) {
    const key = task[field] || "Unknown";
    result[key] = (result[key] || 0) + 1;
  }
  return result;
};

const renderStats = (title, data) => (
  <div className="bg-white p-4 shadow rounded">
    <h2 className="font-semibold mb-2">{title}</h2>
    <ul className="list-disc list-inside text-sm">
      {Object.entries(data).map(([key, count]) => (
        <li key={key}>
          <strong>{key}</strong>: {count} task{count > 1 ? "s" : ""}
        </li>
      ))}
    </ul>
  </div>
);

const App = () => {
  const handledByStats = countByField('handledBy');
  const reviewedByStats = countByField('reviewedBy');
  const frequencyStats = countByField('frequency');
  const categoryStats = countByField('category');

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📊 Finance Dashboard</h1>
        <span className="text-sm text-gray-500">Total Tasks: {tasks.length}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 shadow rounded">
          <h2 className="font-semibold mb-2">Preview (First Task)</h2>
          <pre className="text-xs">{JSON.stringify(tasks[0], null, 2)}</pre>
        </div>
        {renderStats("Handled By", handledByStats)}
        {renderStats("Reviewed By", reviewedByStats)}
        {renderStats("Frequency", frequencyStats)}
        {renderStats("Category", categoryStats)}
      </div>
    </div>
  );
};

export default App;
