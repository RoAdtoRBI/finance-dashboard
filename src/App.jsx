import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, onSnapshot, updateDoc, addDoc, where, getDocs, deleteDoc } from 'firebase/firestore';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBNycgqh3wSyKCPeAUIpvIbTGpgqM8aUJI", // Updated API Key
  authDomain: "team-task-dashboard-188fd.firebaseapp.com",
  projectId: "team-task-dashboard-188fd",
  storageBucket: "team-task-dashboard-188fd.firebasestorage.app",
  messagingSenderId: "830092054067",
  appId: "1:830092054067:web:686d101752bf9b39f69d46"
};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Define the team manager's email for access control
const TEAM_MANAGER_EMAIL = "rohit.a@sunlightsports.co.in";


// Helper function to format a Date object into a વખતે-MM-DD string
const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return ''; // Invalid date
    return d.toISOString().split('T')[0];
};

// Helper to parse due date strings into actual dates for calendar comparison
const parseDueDateForCalendar = (dateString, currentYear, currentMonth, taskFrequency) => {
    const dates = [];
    const monthMap = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
    };
    const dayOfWeekMap = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6
    };

    if (taskFrequency && taskFrequency.toLowerCase() === 'daily') {
        const numDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let day = 1; day <= numDaysInMonth; day++) {
            const dateCandidate = new Date(currentYear, currentMonth, day);
            if (dateCandidate.getDay() !== 0) { // Exclude Sundays
                dates.push(dateCandidate);
            }
        }
    } else if (taskFrequency && taskFrequency.toLowerCase() === 'weekly' && dayOfWeekMap.hasOwnProperty(dateString.toLowerCase())) {
        const targetDay = dayOfWeekMap[dateString.toLowerCase()];
        const numDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let day = 1; day <= numDaysInMonth; day++) {
            const dateCandidate = new Date(currentYear, currentMonth, day);
            if (dateCandidate.getDay() === targetDay && dateCandidate.getDay() !== 0) { // Exclude Sundays
                dates.push(dateCandidate);
            }
        }
    } else {
        const dayMatch = dateString.match(/^(\d+)(st|nd|rd|th)?$/);
        if (dayMatch) {
            const day = parseInt(dayMatch[1]);
            if (taskFrequency && taskFrequency.toLowerCase() === 'monthly') {
                const dateCandidate = new Date(currentYear, currentMonth, day);
                if (!isNaN(dateCandidate.getTime()) && dateCandidate.getMonth() === currentMonth && dateCandidate.getDay() !== 0) {
                    dates.push(dateCandidate);
                }
            } else {
                const dateCandidate = new Date(currentYear, currentMonth, day);
                if (!isNaN(dateCandidate.getTime()) && dateCandidate.getMonth() === currentMonth && dateCandidate.getDay() !== 0) {
                    dates.push(dateCandidate);
                }
            }
        } else if (dateString.includes('/')) {
            const parts = dateString.split(' ');
            if (parts.length > 1 && parts[0].match(/^\d+(st|nd|rd|th)?$/)) {
                const day = parseInt(parts[0]);
                const monthAbbreviations = parts[1].split('/').map(m => m.toLowerCase());
                monthAbbreviations.forEach(monthAbbr => {
                    if (monthMap.hasOwnProperty(monthAbbr)) {
                        const dateCandidate = new Date(currentYear, monthMap[monthAbbr], day);
                        if (!isNaN(dateCandidate.getTime()) && dateCandidate.getDay() !== 0) {
                            dates.push(dateCandidate);
                        }
                    }
                });
            }
        }
    }
    return dates;
};

// Custom Calendar Component
const CustomCalendar = ({ selectedDate, onDateChange, financeTasks, selectedTeamMember, selectedCategoryFilter, selectedFrequencyFilter }) => {
    const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

    useEffect(() => {
        if (selectedDate) {
            setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
        }
    }, [selectedDate]);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const numDays = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);

        const days = [];

        // Add empty cells for preceding days of the week
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="text-center p-2"></div>);
        }

        // Normalize today's date for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add days of the month
        for (let day = 1; day <= numDays; day++) {
            const date = new Date(year, month, day);
            date.setHours(0, 0, 0, 0); // Normalize calendar date to midnight

            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            const isFutureDate = date > today; // Check if the calendar day is in the future

            // Filter tasks for this specific calendar day based on selected team member and filters
            const tasksOnThisDay = selectedTeamMember && financeTasks
                ? financeTasks.filter(task => {
                    const relevantForSelectedMember = (task.handledby === selectedTeamMember);
                    if (!relevantForSelectedMember || !task.commitmentdate) return false; // Use commitmentdate

                    if (selectedCategoryFilter !== 'All' && task.category !== selectedCategoryFilter) {
                        return false;
                    }
                    if (selectedFrequencyFilter !== 'All' && task.frequency !== selectedFrequencyFilter) {
                        return false;
                    }

                    const dueDatesForTask = parseDueDateForCalendar(task.commitmentdate, year, month, task.frequency); // Use commitmentdate
                    return dueDatesForTask.some(dueDate =>
                        dueDate.getFullYear() === year &&
                        dueDate.getMonth() === month &&
                        dueDate.getDate() === day
                    );
                })
                : [];

            const totalTasksForDay = tasksOnThisDay.length;
            // Only count pending for past/current dates
            const pendingTasksForDay = isFutureDate ? 0 : tasksOnThisDay.filter(task => (task.statusByDate[formatDate(date)] || "Pending") === "Pending").length;
            const hasPendingTask = pendingTasksForDay > 0;

            days.push(
                <div
                    key={day}
                    // Determine primary styling for the day cell
                    className={`relative flex flex-col items-center justify-start p-1 sm:p-2 rounded-lg transition-colors duration-200 min-h-[80px] sm:min-h-[100px] text-sm overflow-hidden
                        ${isToday ? 'bg-blue-200 font-bold' : ''}
                        ${isSelected ? 'bg-blue-500 text-white font-bold shadow-md' : 'hover:bg-gray-200'}
                        ${hasPendingTask ? 'border-2 border-red-500 bg-red-100' : (totalTasksForDay > 0 && !isSelected ? 'border-2 border-green-400' : '')}
                        ${isFutureDate ? 'bg-gray-50' : (date < today && !hasPendingTask ? 'opacity-50 cursor-not-allowed text-gray-400' : 'cursor-pointer')}
                    `}
                    // Disable click for past dates without pending tasks
                    onClick={date < today && !hasPendingTask ? null : () => onDateChange(date)}
                >
                    <span className={`text-base font-semibold mb-1 ${isSelected ? 'text-white' : 'text-gray-800'}`}>{day}</span>
                    {selectedTeamMember && totalTasksForDay > 0 && (
                        <div className="flex flex-col items-center text-xs">
                            {isFutureDate ? (
                                <span className="font-bold text-orange-500">Total: {totalTasksForDay}</span>
                            ) : (
                                <>
                                    <span className="font-medium text-gray-700">Total: {totalTasksForDay}</span>
                                    {hasPendingTask && (
                                        <span className="text-red-600 font-bold">Pending: {pendingTasksForDay}</span>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    {/* Show red dot only for pending tasks on past/current dates */}
                    {hasPendingTask && (
                        <span className="absolute bottom-1 right-1 text-red-600 text-base leading-none">●</span>
                    )}
                </div>
            );
        }
        return days;
    };

    const changeMonth = (direction) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + direction);
        setCurrentMonth(newMonth);
        const today = new Date();
        today.setHours(0,0,0,0);
        let newSelectedDate = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
        if (newSelectedDate < today) {
            newSelectedDate = today;
        }
        onDateChange(newSelectedDate);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg max-w-full mx-auto">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200">
                    &lt;
                </button>
                <h3 className="text-xl font-semibold">
                    {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
                </h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200">
                    &gt;
                </button>
            </div>
            <div className="grid grid-cols-7 text-center font-medium text-gray-500 text-sm mb-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {renderDays()}
            </div>
        </div>
    );
};

const App = () => {
    // Initial CSV Data
    const initialCsvData = [
        ["SNO", "Work Particulars", "Handled By", "Reviewed By", "Frequency", "Category", "Due Date", "Commitment Date"],
        ["1", "Revenue Entries", "Shekar", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["2", "Purchase Entries", "Shekar", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["3", "Expense Entries", "Shekar", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["4", "Payments", "Shekar", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["5", "E-way Bills", "Shekar", "Rohit", "On-Demand", "Operations", "On-Demand", "On-Demand"],
        ["6", "Other Adhoc Documents", "Shekar", "Rohit", "On-Demand", "Operations", "On-Demand", "On-Demand"],
        ["7", "Sales,Cash Flow & Stock Reports", "Shekar", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["8", "Factory/Other Outstandings", "Shekar", "Rohit", "Weekly", "Operations", "Monday", "Saturday"],
        ["9", "Bank Reconciliation", "Shekar", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["10", "Invoice Rate vs Price Comparison", "Shekar", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["11", "Salary Advance Reconciliations", "Shekar", "Rohit", "Monthly", "Operations", "Monthly", "Monthly"],
        ["12", "Vouching Review", "Shekar", "Sudheer", "Daily", "Expense Schedules", "Daily", "Daily"],
        ["13", "Debtors/Creditor Ageing", "Sudheer", "Rohit", "Monthly", "Statutory", "Monthly", "Monthly"],
        ["14", "MSME Workings", "Sudheer", "Rohit", "Monthly", "Statutory", "Monthly", "Monthly"],
        ["15", "Monthly TDS Workings", "Sudheer", "Rohit", "Monthly", "Statutory", "7th", "5th"],
        ["16", "Monthly GSTR1 Workings", "Sudheer", "Rohit", "Monthly", "Statutory", "11th", "9th"],
        ["17", "Monthly GSTR3B Workings", "Sudheer", "Rohit", "Monthly", "Statutory", "20th", "18th"],
        ["18", "Monthly PT Workings & Returns", "Sudheer", "Rohit", "Monthly", "Statutory", "10th", "5th"],
        ["19", "Monthly PF & ESI Workings", "Sudheer", "Rohit", "Monthly", "Statutory", "15th", "14th"],
        ["20", "Quarterly TDS Returns", "Sudheer", "Rohit", "Monthly", "Statutory", "30th Jul/Oct/Jan/May", "15th Jul/Oct/Jan/May"],
        ["21", "Import & Export Documentation", "Sudheer", "Rohit", "On-Demand", "Exim", "On-Demand", "On-Demand"],
        ["22", "Expense Schedules", "Sudheer", "Rohit", "Weekly", "Audit", "7th", "7th"],
        ["23", "Ledger Reconciliations", "Sudheer", "Rohit", "Weekly", "Operations", "Weekly", "Weekly"],
        ["24", "Prepaid Expense Schedules", "Sudheer", "Rohit", "Monthly", "Audit", "7th", "7th"],
        ["25", "Fixed Asset Register", "Sudheer", "Rohit", "Monthly", "Audit", "Monthly", "25th"],
        ["26", "PF ESI Reconciliation & Documentation", "Sudheer", "Rohit", "Monthly", "Audit", "Monthly", "28th"],
        ["27", "TDS Reconciliation& Documentation", "Sudheer", "Rohit", "Monthly", "Audit", "Monthly", "30th"],
        ["28", "GST Reconciliation& Documentation", "Sudheer", "Rohit", "Monthly", "Audit", "Monthly", "22th"],
        ["29", "Import & Export Checklist Approval", "Sudheer", "Rohit", "On-Demand", "Exim", "On-Demand", "On-Demand"],
        ["30", "Agreements Filing", "Sudheer", "Rohit", "On-Demand", "Operations", "On-Demand", "On-Demand"],
        ["31", "Big Distributor Statement", "Rohit", "Chandra", "Monthly", "Reports", "Monthly", "1st"],
        ["32", "Monthly MIS", "Rohit", "Bharath", "Monthly", "Reports", "Monthly", "8th"],
        ["33", "Player/Coach/Institutions Agreements", "Rohit", "Vishal/Zoravar", "On-Demand", "Agreements", "On-Demand", "On-Demand"],
        ["34", "Distribution Agreements", "Rohit", "Vishal/Zoravar", "On-Demand", "Agreements", "On-Demand", "On-Demand"],
        ["35", "Financial Statements & Audit", "Rohit", "Auditors", "Quarterly", "Audit", "Quarterly", "Quarterly"],
        ["36", "Payroll Processing", "Rohit", "Vishal", "Monthly", "Operations", "Monthly", "3rd"],
        ["37", "Leave Encashment & Gratuity Workings", "Rohit", "Auditors", "Yearly", "Audit", "Yearly", "Yearly"],
        ["38", "Sales Reports & Incentive Workings", "Rohit", "Vishal/Zoravar", "Monthly", "Reports", "Monthly", "1st"],
        ["39", "AR Outstanding Reports", "Arun", "Rohit", "Weekly", "Reports", "Monday", "Monday"],
        ["40", "Cash Collection Report", "Arun", "Rohit", "Weekly", "Reports", "Tuesday", "Monday"],
        ["41", "Global Monitoring Report", "Arun", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["42", "Cash/Bank Cheque Deposits & Entries", "Arun", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["43", "Cash Maintenance & Vouchers Documentation", "Arun", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["44", "Sales Report by Person Wise", "Arun", "Rohit", "Weekly", "Operations", "1st Week", "1st Week"],
        ["45", "Sales Return & Documentation", "Arun", "Bheekar", "On-Demand", "Operations", "Within 2 Days from Receipt", "On-Demand"],
        ["46", "Communication with Sales team", "Arun", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["47", "Communication with Parties", "Arun", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["48", "Inter Company Payment Reconciliations", "Arun", "Rohit", "Daily", "Operations", "Daily", "Daily"],
        ["49", "Vouching Review", "Arun", "Sudheer", "Daily", "Expense Schedules", "Daily", "Daily"],
        ["50", "Sending Office Notices to Parties", "Arun", "Rohit", "On-Demand", "Operations", "On-Demand", "On-Demand"],
    ];

    // State for Firebase Auth and Firestore
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);


    // Login/Register form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    // App states
    const [financeTasks, setFinanceTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]); // Handled by members
    const [allReviewedBy, setAllReviewedBy] = useState([]); // Reviewed By members
    const [allCategories, setAllCategories] = useState([]); // All unique categories
    const [allFrequencies, setAllFrequencies] = useState([]); // All unique frequencies

    const [currentPage, setCurrentPage] = useState('overview');
    const [selectedTeamMember, setSelectedTeamMember] = useState('');
    const [selectedOverviewTeamMember, setSelectedOverviewTeamMember] = useState('All');
    const [calendarSelectedDate, setCalendarSelectedDate] = useState(new Date());
    const [showOnlyPending, setShowOnlyPending] = useState(false);
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
    const [selectedFrequencyFilter, setSelectedFrequencyFilter] = useState('All');
    const [loginMessage, setLoginMessage] = useState('');

    // States for search and sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState('sno'); // Default sort by S.No
    const [sortDirection, setSortDirection] = useState('asc'); // 'asc', 'desc', or 'none' (for no sorting)

    // New states for task management
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [currentTask, setCurrentTask] = useState({
        sno: '',
        workparticulars: '',
        handledby: '',
        reviewedby: '',
        frequency: '',
        category: '',
        duedate: '', // Kept for CSV display/input, but logic uses commitmentdate
        commitmentdate: ''
    });
    const [taskModalError, setTaskModalError] = useState('');

    // New states for overdue/status filtering
    const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Pending', 'Completed', 'Review Complete'
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);


    // Firebase Authentication Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setUserId(currentUser.uid);
                setLoginMessage(`Logged in as: ${currentUser.email || 'Anonymous'} (UID: ${currentUser.uid})`);
                console.log("Current Firebase User:", currentUser);
                console.log("User ID:", currentUser.uid);
                console.log("App ID being used:", appId);

                const userDocRef = doc(db, `artifacts/${appId}/users/${currentUser.uid}/profile/info`);
                const userDocSnap = await getDoc(userDocRef);
                if (!userDocSnap.exists()) {
                    await setDoc(userDocRef, {
                        email: currentUser.email,
                        createdAt: new Date(),
                    });
                }

                // Check and populate finance tasks ONLY ONCE after user authentication
                const tasksCollectionRef = collection(db, `artifacts/${appId}/public/data/tasks`);
                const tasksSnapshot = await getDocs(tasksCollectionRef);
                if (tasksSnapshot.empty) {
                    console.log("Firestore tasks collection is empty. Populating from CSV data.");
                    await populateInitialData();
                } else {
                    console.log(`Firestore tasks collection has ${tasksSnapshot.size} tasks. No initial population needed.`);
                }

            } else {
                setUser(null);
                setUserId(null);
                setLoginMessage('Not logged in.');
                console.log("No user signed in.");
            }
            setIsAuthReady(true);
        });

        const signInOnLoad = async () => {
             try {
                if (!auth.currentUser) {
                    await signInAnonymously(auth);
                    console.log("Attempted anonymous sign-in.");
                }
             } catch (error) {
                console.error("Firebase sign-in error:", error);
                setAuthError(`Failed to sign in anonymously. Please ensure 'Anonymous' sign-in is enabled in your Firebase project (Authentication -> Sign-in method tab). Error: ${error.message}`);
             }
        };

        if (!isAuthReady) {
            signInOnLoad();
        }

        return () => unsubscribe();
    }, [isAuthReady, auth, appId]);


    // Initial data load and Firebase Sync (only for real-time updates)
    // The initial population logic is now in the auth useEffect.
    useEffect(() => {
        if (!isAuthReady || !userId) return;

        const tasksCollectionRef = collection(db, `artifacts/${appId}/public/data/tasks`);
        const q = query(tasksCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTasks = [];
            const uniqueHandledByMembers = new Set();
            const uniqueReviewedByMembers = new Set(); // New set for Reviewed By
            const uniqueCategories = new Set();
            const uniqueFrequencies = new Set();

            snapshot.docs.forEach(d => {
                const taskData = d.data();
                fetchedTasks.push({ id: d.id, ...taskData });
                if (taskData.handledby) uniqueHandledByMembers.add(taskData.handledby);
                if (taskData.reviewedby) uniqueReviewedByMembers.add(taskData.reviewedby); // Collect Reviewed By
                if (taskData.category) uniqueCategories.add(taskData.category);
                if (taskData.frequency) uniqueFrequencies.add(taskData.frequency);
            });

            // Sort by originalSno which is now guaranteed to be a number
            fetchedTasks.sort((a, b) => (a.originalsno || 0) - (b.originalsno || 0));
            setFinanceTasks(fetchedTasks);
            setTeamMembers(Array.from(uniqueHandledByMembers).sort());
            setAllReviewedBy(Array.from(uniqueReviewedByMembers).sort()); // Set Reviewed By
            setAllCategories(Array.from(uniqueCategories).sort()); // Set Categories
            setAllFrequencies(Array.from(uniqueFrequencies).sort()); // Set Frequencies


            // No longer checking snapshot.empty here or calling populateInitialData
            console.log(`Firestore tasks collection has ${fetchedTasks.length} tasks and is being synced.`);

        }, (error) => {
            console.error("Error fetching tasks:", error);
            setAuthError(`Error fetching tasks: ${error.message}`);
        });

        return () => unsubscribe();
    }, [isAuthReady, userId, db]); // Add db to dependency array


    // Function to populate initial CSV data into Firestore
    const populateInitialData = async () => {
        const tasksCollectionRef = collection(db, `artifacts/${appId}/public/data/tasks`);
        console.log("Starting initial CSV data population...");
        for (let i = 1; i < initialCsvData.length; i++) {
            const row = initialCsvData[i];
            if (row.length === initialCsvData[0].length && row[0]) {
                const task = {};
                initialCsvData[0].forEach((header, index) => {
                    task[header.replace(/ /g, '').replace(/\//g, '').toLowerCase()] = row[index];
                });

                // Ensure 'sno' is stored as a number and also as 'originalsno' for consistent numeric sorting
                const snoValue = parseInt(row[0]);
                if (!isNaN(snoValue)) {
                    task.sno = snoValue;
                    task.originalsno = snoValue; // Store as number for sorting reference
                } else {
                    task.sno = row[0]; // Keep as string if not a valid number
                    task.originalsno = 0; // Default to 0 for sorting if not a valid number
                }


                task.handledby = task.handledby ? task.handledby.trim() : '';
                task.reviewedby = task.reviewedby ? task.reviewedby.trim() : '';
                task.category = task.category ? task.category.trim() : '';
                task.frequency = task.frequency ? task.frequency.trim() : '';
                task.duedate = task.duedate ? task.duedate.trim() : ''; // Still store original due date string
                task.commitmentdate = task.commitmentdate ? task.commitmentdate.trim() : ''; // Ensure commitment date is trimmed

                // Initialize statusByDate for a range of dates based on COMMITMENT DATE
                const currentYear = new Date().getFullYear();
                const endDateForPopulation = new Date(currentYear + 1, 11, 31); // Populate up to end of next year
                const startDateForPopulation = new Date(currentYear - 1, 0, 1); // Populate from start of last year
                task.statusByDate = {};
                let tempDate = new Date(startDateForPopulation);
                tempDate.setHours(0,0,0,0);
                endDateForPopulation.setHours(0,0,0,0);

                while (tempDate <= endDateForPopulation) {
                    const relevantDates = parseDueDateForCalendar( // Use commitmentdate here
                        task.commitmentdate,
                        tempDate.getFullYear(),
                        tempDate.getMonth(),
                        task.frequency
                    );
                    relevantDates.forEach(d => {
                        const formattedD = formatDate(d);
                        if (d.getDay() !== 0) { // Exclude Sundays
                           task.statusByDate[formattedD] = "Pending";
                        }
                    });
                    tempDate.setDate(tempDate.getDate() + 1);
                    tempDate.setHours(0,0,0,0);
                }

                try {
                    await addDoc(tasksCollectionRef, task);
                    console.log(`Added task SNO ${task.sno}`);
                } catch (e) {
                    console.error(`Error adding document for SNO ${task.sno} to Firestore: `, e);
                }
            }
        }
        console.log("Initial CSV data population complete.");
    };


    // Function to delete all tasks and re-populate
    const resetAllData = async () => {
        if (!db || !userId) {
            setAuthError("You must be logged in to reset data.");
            console.log("Reset button clicked: User or DB not ready. Current user:", auth.currentUser, "userId:", userId);
            return;
        }

        // Show confirmation modal
        setConfirmAction(() => async () => {
            console.log("Resetting all data...");
            setLoginMessage("Resetting data, please wait...");
            setAuthError(null);
            try {
                // Delete all documents in the tasks collection
                const tasksCollectionRef = collection(db, `artifacts/${appId}/public/data/tasks`);
                const snapshot = await getDocs(tasksCollectionRef);
                const deletePromises = [];
                snapshot.forEach(doc => {
                    deletePromises.push(deleteDoc(doc.ref));
                });
                await Promise.all(deletePromises);
                console.log("All existing tasks deleted.");

                // Re-populate data
                await populateInitialData();
                setLoginMessage("Data reset and re-populated successfully!");
            } catch (error) {
                console.error("Error resetting data:", error);
                setAuthError(`Failed to reset data: ${error.message}`);
            } finally {
                setShowConfirmModal(false);
            }
        });
        setShowConfirmModal(true);
    };


    // Helper to get the "handledby" name for the current user based on their email or display name
    const getUserMappedName = (currentUser) => {
        if (!currentUser || !currentUser.email) return null;

        const emailPrefix = currentUser.email.split('@')[0].toLowerCase();
        // Explicit mapping for specific emails if they don't match handledby names directly
        switch (emailPrefix) {
            case "rohit.a": return "Rohit";
            case "shekar": return "Shekar"; // For kaluva.rajashekar@sunlightsports.co.in if display name is not 'Shekar'
            case "kaluva.rajashekar": return "Shekar";
            case "sudheer": return "Sudheer"; // For sudheer.u@sunlightsports.co.in if display name is not 'Sudheer'
            case "sudheer.u": return "Sudheer";
            case "arun": return "Arun"; // For arun@...
            case "thota.kumar": return "Arun"; // Explicitly map thota.kumar to Arun
            case "bheekar": return "Bheekar"; // If Bheekar logs in with a matching email
            default:
                // Attempt to capitalize and use as name if no specific mapping
                if (currentUser.displayName) return currentUser.displayName;
                if (emailPrefix.length > 0) {
                    return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
                }
                return null;
        }
    };


    // Function to update task status for a specific date in Firestore
    const updateTaskStatus = async (taskId, dateString, newStatus) => {
        const taskToUpdate = financeTasks.find(task => task.id === taskId);
        if (!taskToUpdate) {
            setAuthError("Task not found.");
            return;
        }

        const isTeamManager = user && user.email === TEAM_MANAGER_EMAIL;
        const currentUserMappedName = getUserMappedName(user);

        // Check if the current user is assigned to handle this task
        const isHandledByCurrentUser = taskToUpdate.handledby.toLowerCase() === currentUserMappedName?.toLowerCase();
        // Check if the current user is assigned to review this task
        const isReviewedByCurrentUser = taskToUpdate.reviewedby.toLowerCase() === currentUserMappedName?.toLowerCase();

        let isAuthorized = false;

        if (isTeamManager) {
            isAuthorized = true; // Manager has full access
        } else if (isHandledByCurrentUser) {
            // Handled By can mark Completed or Pending
            if (newStatus === "Completed" || newStatus === "Pending") {
                isAuthorized = true;
            } else {
                setAuthError("You are not authorized to mark this task as 'Review Complete'. Only manager or reviewer can.");
                return;
            }
        } else if (isReviewedByCurrentUser) {
            // Reviewed By can mark Review Complete or Pending/Completed if reverting from Review Complete
            if (newStatus === "Review Complete") {
                isAuthorized = true;
            } else if (taskToUpdate.statusByDate[dateString] === "Review Complete" && (newStatus === "Completed" || newStatus === "Pending")) {
                 isAuthorized = true; // Reviewer can revert their own review
            } else {
                setAuthError("You are not authorized to perform this action. Only the 'Handled By' person can mark as 'Completed'.");
                return;
            }
        }

        if (!isAuthorized) {
            setAuthError("You do not have sufficient permissions to update this task's status.");
            console.warn("Unauthorized attempt to update task:", taskId, "by user:", user?.email, "Current status:", taskToUpdate.statusByDate[dateString], "New status:", newStatus);
            return;
        }

        try {
            const taskRef = doc(db, `artifacts/${appId}/public/data/tasks`, taskId);
            await updateDoc(taskRef, {
                [`statusByDate.${dateString}`]: newStatus
            });
            console.log(`Task ${taskId} status updated to ${newStatus} for ${dateString}`);
            setAuthError(null); // Clear any previous auth errors
        } catch (error) {
            console.error("Error updating task status:", error);
            setAuthError("Failed to update task status. Check console for details.");
        }
    };


    // Prepare dates for calendar highlighting for the selected team member
    // No longer explicitly used for highlighting, but useful to keep for task filtering on calendar
    const datesWithHighlights = selectedTeamMember
        ? financeTasks.flatMap(task => {
            const relevantForSelectedMember = (task.handledby === selectedTeamMember);
            if (relevantForSelectedMember && task.commitmentdate) { // Use commitmentdate
                const year = calendarSelectedDate.getFullYear();
                const month = calendarSelectedDate.getMonth();

                return parseDueDateForCalendar(task.commitmentdate, year, month, task.frequency); // Use commitmentdate
            }
            return [];
        }).filter(Boolean)
        : [];

    // Filter tasks for the selected team member and selected calendar date
    const tasksForSelectedCalendarDate = selectedTeamMember
        ? financeTasks.filter(task => {
            const relevantForSelectedMember = (task.handledby === selectedTeamMember);
            if (!relevantForSelectedMember || !task.commitmentdate) return false; // Use commitmentdate

            if (selectedCategoryFilter !== 'All' && task.category !== selectedCategoryFilter) {
                return false;
            }
            if (selectedFrequencyFilter !== 'All' && task.frequency !== selectedFrequencyFilter) {
                return false;
            }

            const year = calendarSelectedDate.getFullYear();
            const month = calendarSelectedDate.getMonth();
            const day = calendarSelectedDate.getDate();

            const dueDatesForTask = parseDueDateForCalendar(task.commitmentdate, year, month, task.frequency); // Use commitmentdate

            const matchesSelectedDate = dueDatesForTask.some(dueDate =>
                dueDate.getFullYear() === year &&
                dueDate.getMonth() === month &&
                dueDate.getDate() === day
            );
            const statusForDate = task.statusByDate[formatDate(calendarSelectedDate)] || "Pending";

            return matchesSelectedDate && (showOnlyPending ? statusForDate === "Pending" : true);
        }).map(task => ({
            ...task,
            status: task.statusByDate[formatDate(calendarSelectedDate)] || "Pending"
        })).sort((a,b) => (a.originalsno || 0) - (b.originalsno || 0))
        : [];


    // --- Monthly Overview Calculations (for the current month of calendarSelectedDate) ---
    let monthlyTotalAllocatedWorks = 0;
    let monthlyTotalFinishedWorks = 0;
    const currentMonthYearFormatted = `${calendarSelectedDate.getFullYear()}-${String(calendarSelectedDate.getMonth() + 1).padStart(2, '0')}`;

    financeTasks.forEach(task => {
        for (const dateString in task.statusByDate) {
            if (dateString.startsWith(currentMonthYearFormatted)) {
                monthlyTotalAllocatedWorks++;
                if (task.statusByDate[dateString] === "Completed" || task.statusByDate[dateString] === "Review Complete") {
                    monthlyTotalFinishedWorks++;
                }
            }
        }
    });

    const monthlyOverallPerformanceRate = monthlyTotalAllocatedWorks > 0
        ? ((monthlyTotalFinishedWorks / monthlyTotalAllocatedWorks) * 100).toFixed(1)
        : 0;
    // --- End Monthly Overview Calculations ---


    // --- Monthly Breakdown by Category and Frequency for Overview ---
    const uniqueTasksActiveInCurrentMonth = new Set();

    const tasksByCategoryMonthlyOverview = financeTasks.reduce((acc, task) => {
        const hasAllocationInCurrentMonth = Object.keys(task.statusByDate || {}).some(dateString =>
            dateString.startsWith(currentMonthYearFormatted)
        );

        if (hasAllocationInCurrentMonth) {
            acc[task.category] = (acc[task.category] || 0) + 1;
            uniqueTasksActiveInCurrentMonth.add(task.id);
        }
        return acc;
    }, {});

    const tasksByFrequencyMonthlyOverview = financeTasks.reduce((acc, task) => {
        const hasAllocationInCurrentMonth = Object.keys(task.statusByDate || {}).some(dateString =>
            dateString.startsWith(currentMonthYearFormatted)
        );

        if (hasAllocationInCurrentMonth) {
            acc[task.frequency] = (acc[task.frequency] || 0) + 1;
        }
        return acc;
    }, {});

    const totalUniqueTasksActiveInMonth = uniqueTasksActiveInCurrentMonth.size;
    // --- End Monthly Breakdown for Overview ---


    // Calculate individual team member overall performance rate (across all time)
    const getMemberOverallPerformanceRate = (member) => {
        let memberAllotted = 0;
        let memberFinished = 0;
        financeTasks.filter(task => task.handledby === member).forEach(task => {
            for (const dateString in task.statusByDate || {}) {
                memberAllotted++;
                if (task.statusByDate[dateString] === "Completed" || task.statusByDate[dateString] === "Review Complete") {
                    memberFinished++;
                }
            }
        });
        return memberAllotted > 0 ? ((memberFinished / memberAllotted) * 100).toFixed(1) : 0;
    };

    // New: Calculate individual team member performance for the current selected month
    const getMemberCurrentMonthPerformance = (member, monthDate) => {
        const currentMonthFormatted = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
        let memberMonthlyAllocated = 0;
        let memberMonthlyFinished = 0;

        financeTasks.filter(task => task.handledby === member).forEach(task => {
            for (const dateString in task.statusByDate || {}) {
                if (dateString.startsWith(currentMonthFormatted)) {
                    memberMonthlyAllocated++;
                    if (task.statusByDate[dateString] === "Completed" || task.statusByDate[dateString] === "Review Complete") {
                        memberMonthlyFinished++;
                    }
                }
            }
        });
        return memberMonthlyAllocated > 0 ? ((memberMonthlyFinished / memberMonthlyAllocated) * 100).toFixed(1) : 0;
    };

    // New: Calculate individual team member performance year-to-date up to the selected calendar date
    const getMemberYearToDatePerformance = (member, upToDate) => {
        const currentYear = upToDate.getFullYear();
        let memberYTDAllocated = 0;
        let memberYTDFinished = 0;

        financeTasks.filter(task => task.handledby === member).forEach(task => {
            for (const dateString in task.statusByDate || {}) {
                const taskDate = new Date(dateString);
                if (taskDate.getFullYear() === currentYear && taskDate <= upToDate) {
                    memberYTDAllocated++;
                    if (task.statusByDate[dateString] === "Completed" || task.statusByDate[dateString] === "Review Complete") {
                        memberYTDFinished++;
                    }
                }
            }
        });
        return memberYTDAllocated > 0 ? ((memberYTDFinished / memberYTDAllocated) * 100).toFixed(1) : 0;
    };


    // Calculate daily performance rate for selected team member and selected date (used in calendar view)
    const getMemberDailyPerformanceRate = (member, date) => {
        const tasksForSpecificDate = financeTasks.filter(task => {
            if (task.handledby !== member || !task.commitmentdate) return false; // Use commitmentdate

            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();

            const dueDatesForTask = parseDueDateForCalendar(task.commitmentdate, year, month, task.frequency); // Use commitmentdate
            return dueDatesForTask.some(dueDate =>
                dueDate.getFullYear() === year &&
                dueDate.getMonth() === month &&
                dueDate.getDate() === day
            );
        });

        const completedTasksForSpecificDate = tasksForSpecificDate.filter(task => {
            const statusForDate = task.statusByDate[formatDate(date)] || "Pending";
            return statusForDate === "Completed" || statusForDate === "Review Complete";
        }).length;

        return tasksForSpecificDate.length > 0
            ? ((completedTasksForSpecificDate / tasksForSpecificDate.length) * 100).toFixed(1)
            : 0;
    };


    // Filtered and Sorted tasks for the overview table based on selectedOverviewTeamMember, searchTerm, and sort state
    const filteredAndSortedOverviewTasks = financeTasks
        .filter(task => {
            const matchesTeamMember = selectedOverviewTeamMember === 'All' || task.handledby === selectedOverviewTeamMember;
            const matchesSearchTerm = task.workparticulars.toLowerCase().includes(searchTerm.toLowerCase());

            const todayFormatted = formatDate(new Date());
            const currentDayStatus = task.statusByDate[todayFormatted] || "Pending";

            // Status filter logic
            const matchesStatusFilter = filterStatus === 'All' || currentDayStatus === filterStatus;

            // Overdue filter logic (based on COMMITMENT DATE)
            const taskCommitmentDates = parseDueDateForCalendar(task.commitmentdate, new Date().getFullYear(), new Date().getMonth(), task.frequency); // Use commitmentdate
            const todayDateOnly = new Date();
            todayDateOnly.setHours(0,0,0,0);

            const isTaskDueTodayOrPast = taskCommitmentDates.some(d => d.setHours(0,0,0,0) <= todayDateOnly.getTime());
            const isOverdue = currentDayStatus === 'Pending' && isTaskDueTodayOrPast;

            const matchesOverdueFilter = !showOverdueOnly || isOverdue;


            return matchesTeamMember && matchesSearchTerm && matchesStatusFilter && matchesOverdueFilter;
        })
        .sort((a, b) => {
            if (sortColumn === 'none') return 0; // No sorting
            const aValue = a[sortColumn];
            const bValue = b[b[sortColumn]]; // Fixed: should be b[sortColumn]

            let comparison = 0;
            // Handle numeric sort for 'sno'
            if (sortColumn === 'sno') {
                comparison = (a.originalsno || 0) - (b.originalsno || 0);
            } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                comparison = aValue.localeCompare(bValue);
            } else {
                comparison = aValue - bValue; // Fallback for other numeric (though most are strings)
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

    // Handle sort column click
    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(prev => {
                if (prev === 'asc') return 'desc';
                if (prev === 'desc') return 'none';
                return 'asc';
            });
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };


    // Login/Logout Handlers
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError(null);
        setLoginMessage('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setAuthError(error.message);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setAuthError(null);
        setLoginMessage('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setAuthError(error.message);
        }
    };

    const handleLogout = async () => {
        setAuthError(null);
        setLoginMessage('');
        try {
            await signOut(auth);
            setFinanceTasks([]);
            setTeamMembers([]);
            setSelectedTeamMember('');
            setSelectedOverviewTeamMember('All');
            setCalendarSelectedDate(new Date());
            setShowOnlyPending(false);
            setSelectedCategoryFilter('All');
            setSelectedFrequencyFilter('All');
            setSearchTerm('');
            setSortColumn('sno');
            setSortDirection('asc');
            setFilterStatus('All');
            setShowOverdueOnly(false);
        } catch (error) {
            setAuthError(error.message);
        }
    };

    // Task Modal Management Functions
    const openAddTaskModal = () => {
        setIsEditingTask(false);
        // Calculate the next available S.No
        const maxSno = financeTasks.reduce((max, task) => Math.max(max, task.originalsno || 0), 0);
        const nextSno = maxSno + 1;

        setCurrentTask({
            sno: nextSno, // Pre-fill with the next S.No
            workparticulars: '',
            handledby: '',
            reviewedby: '',
            frequency: '',
            category: '',
            duedate: '',
            commitmentdate: ''
        });
        setTaskModalError('');
        setShowTaskModal(true);
    };

    const openEditTaskModal = (task) => {
        setIsEditingTask(true);
        setCurrentTask({ ...task });
        setTaskModalError('');
        setShowTaskModal(true);
    };

    const closeTaskModal = () => {
        setShowTaskModal(false);
        setTaskModalError('');
    };

    const handleTaskFormChange = (e) => {
        const { name, value } = e.target;
        setCurrentTask(prev => ({ ...prev, [name]: value }));
    };

    const saveTask = async () => {
        setTaskModalError('');
        if (!currentTask.workparticulars || !currentTask.handledby || !currentTask.frequency || !currentTask.category || !currentTask.commitmentdate) {
            setTaskModalError("Please fill in all required task fields: Work Particulars, Handled By, Frequency, Category, and Commitment Date.");
            return;
        }

        try {
            if (isEditingTask) {
                // Update existing task
                const taskRef = doc(db, `artifacts/${appId}/public/data/tasks`, currentTask.id);
                // Preserve existing statusByDate
                const existingTaskSnap = await getDoc(taskRef);
                const existingStatusByDate = existingTaskSnap.exists() ? existingTaskSnap.data().statusByDate : {};

                await updateDoc(taskRef, {
                    sno: parseInt(currentTask.sno) || 0, // Ensure SNO is a number
                    originalsno: parseInt(currentTask.sno) || 0,
                    workparticulars: currentTask.workparticulars,
                    handledby: currentTask.handledby,
                    reviewedby: currentTask.reviewedby,
                    frequency: currentTask.frequency,
                    category: currentTask.category,
                    duedate: currentTask.duedate, // Save original due date string
                    commitmentdate: currentTask.commitmentdate, // Save commitment date string
                    statusByDate: existingStatusByDate // Maintain existing historical statuses
                });
                setLoginMessage("Task updated successfully!"); // Using loginMessage for general messages
            } else {
                // Add new task
                const tasksCollectionRef = collection(db, `artifacts/${appId}/public/data/tasks`);
                const newTask = {
                    ...currentTask,
                    sno: parseInt(currentTask.sno) || 0, // Ensure SNO is a number
                    originalsno: parseInt(currentTask.sno) || 0,
                    // Initialize statusByDate for a range of dates for new task based on COMMITMENT DATE
                    statusByDate: {},
                    createdAt: new Date()
                };

                const currentYear = new Date().getFullYear();
                const endDateForPopulation = new Date(currentYear + 1, 11, 31);
                const startDateForPopulation = new Date(currentYear - 1, 0, 1);
                let tempDate = new Date(startDateForPopulation);
                tempDate.setHours(0,0,0,0);
                endDateForPopulation.setHours(0,0,0,0);

                while (tempDate <= endDateForPopulation) {
                    const relevantDates = parseDueDateForCalendar( // Use commitmentdate
                        newTask.commitmentdate,
                        tempDate.getFullYear(),
                        tempDate.getMonth(),
                        newTask.frequency
                    );
                    relevantDates.forEach(d => {
                        const formattedD = formatDate(d);
                        if (d.getDay() !== 0) { // Exclude Sundays
                           newTask.statusByDate[formattedD] = "Pending";
                        }
                    });
                    tempDate.setDate(tempDate.getDate() + 1);
                    tempDate.setHours(0,0,0,0);
                }


                await addDoc(tasksCollectionRef, newTask);
                setLoginMessage("Task added successfully!"); // Using loginMessage for general messages
            }
            closeTaskModal();
        } catch (error) {
            console.error("Error saving task:", error);
            setTaskModalError(`Failed to save task: ${error.message}`);
        }
    };

    const deleteTask = async (taskId) => {
        // Confirmation before deleting
        setConfirmAction(() => async () => {
            try {
                const taskRef = doc(db, `artifacts/${appId}/public/data/tasks`, taskId);
                await deleteDoc(taskRef);
                setLoginMessage("Task deleted successfully!"); // Using loginMessage for general messages
            } catch (error) {
                console.error("Error deleting task:", error);
                setAuthError(`Failed to delete task: ${error.message}`);
            } finally {
                setShowConfirmModal(false);
            }
        });
        setShowConfirmModal(true);
    };

    // Export to CSV function
    const exportToCsv = () => {
        if (filteredAndSortedOverviewTasks.length === 0) {
            setLoginMessage("No data to export.");
            return;
        }

        const headers = ["S.No", "Work Particulars", "Handled By", "Reviewed By", "Frequency", "Category", "Commitment Date", "Current Status"]; // Changed Due Date to Commitment Date
        const rows = filteredAndSortedOverviewTasks.map(task => {
            const todayFormatted = formatDate(new Date());
            const currentDayStatus = task.statusByDate[todayFormatted] || "Pending";
            return [
                task.sno,
                `"${task.workparticulars.replace(/"/g, '""')}"`, // Handle commas/quotes in content
                task.handledby,
                task.reviewedby,
                task.frequency,
                task.category,
                task.commitmentdate, // Export commitment date
                currentDayStatus
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(e => e.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) { // feature detection
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'finance_tasks_dashboard.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setLoginMessage("Tasks exported to CSV!"); // Using loginMessage for general messages
        } else {
            setLoginMessage("Your browser does not support downloading CSV files directly."); // Using loginMessage for general messages
        }
    };


    // Render login screen if not authenticated
    if (!isAuthReady) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
                    <h2 className="text-3xl font-bold mb-6 text-gray-800">Loading App...</h2>
                    <p className="text-gray-600">Please wait while we prepare the dashboard.</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                    <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">{isRegistering ? 'Register' : 'Login'}</h2>
                    {authError && <p className="text-red-500 mb-4">{authError}</p>}
                    {loginMessage && <p className="text-green-500 mb-4">{loginMessage}</p>}
                    <form onSubmit={isRegistering ? handleRegister : handleLogin}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                                Email
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="email"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                                Password
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                                id="password"
                                type="password"
                                placeholder="******************"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
                                type="submit"
                            >
                                {isRegistering ? 'Register' : 'Sign In'}
                            </button>
                            <button
                                className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                                type="button"
                                onClick={() => setIsRegistering(!isRegistering)}
                            >
                                {isRegistering ? 'Already have an account? Login' : 'Create an account'}
                            </button>
                        </div>
                    </form>
                    <p className="text-center text-gray-500 text-xs mt-6">
                        Note: For demo purposes, you can create new accounts.
                    </p>
                    <p className="text-center text-gray-500 text-xs mt-2">
                        Your User ID: {userId || 'Not available'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col items-center p-4 sm:p-6 md:p-8">
            <header className="w-full max-w-6xl bg-gradient-to-r from-teal-600 to-cyan-800 text-white p-6 rounded-lg shadow-xl mb-8">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-2 tracking-tight">
                    <img src="https://placehold.co/40x40/ffffff/000000?text=📈" alt="Finance Icon" className="inline-block mr-3" />
                    SSGPL Finance Dashboard
                </h1>
                <p className="text-lg sm:text-xl text-center font-light">Efficiently track your financial tasks</p>
                <div className="mt-4 text-center">
                    <p className="text-sm">Logged in as: {user.email} (UID: {user.uid})</p>
                    <button
                        onClick={handleLogout}
                        className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition duration-300"
                    >
                        Logout
                    </button>
                    {authError && <p className="text-red-300 mt-2">{authError}</p>}
                </div>
            </header>

            <div className="w-full max-w-6xl flex justify-center gap-4 mb-8">
                <button
                    onClick={() => setCurrentPage('overview')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300
                        ${currentPage === 'overview' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Tasks Overview
                </button>
                <button
                    onClick={() => setCurrentPage('calendar')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300
                        ${currentPage === 'calendar' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    Team Calendar
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm Action</h3>
                        <p className="mb-6 text-gray-700">Are you sure you want to reset all data? This action cannot be undone.</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => {
                                    if (confirmAction) confirmAction();
                                }}
                                className="px-5 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 transition duration-300"
                            >
                                Yes, Reset
                            </button>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-5 py-2 rounded-md text-gray-800 bg-gray-300 hover:bg-gray-400 transition duration-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {currentPage === 'overview' && (
                <main className="w-full max-w-6xl bg-white p-6 rounded-lg shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Finance Tasks Overview</h2>

                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        <button
                            onClick={() => resetAllData()}
                            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Reset All Data (Re-populate from CSV)
                        </button>
                         {user && user.email === TEAM_MANAGER_EMAIL && (
                            <button
                                onClick={openAddTaskModal}
                                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                Add New Task
                            </button>
                        )}
                        <button
                            onClick={exportToCsv}
                            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Export to CSV
                        </button>
                    </div>

                    {/* Summary Cards - Now reflecting monthly totals */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-blue-100 p-6 rounded-lg shadow-md text-center">
                            <h3 className="text-xl font-semibold text-blue-800 mb-2">Total Allocated Works (Current Month)</h3>
                            <p className="text-4xl font-bold text-blue-900">{monthlyTotalAllocatedWorks}</p>
                        </div>
                        <div className="bg-green-100 p-6 rounded-lg shadow-md text-center">
                            <h3 className="text-xl font-semibold text-green-800 mb-2">Total Finished Works (Current Month)</h3>
                            <p className="text-4xl font-bold text-green-900">{monthlyTotalFinishedWorks}</p>
                        </div>
                        <div className="bg-yellow-100 p-6 rounded-lg shadow-md text-center">
                            <h3 className="text-xl font-semibold text-yellow-800 mb-2">Total Pending Works (Current Month)</h3>
                            <p className="text-4xl font-bold text-yellow-900">{monthlyTotalAllocatedWorks - monthlyTotalFinishedWorks}</p>
                        </div>
                    </section>

                    {/* Overall Performance Rate - Now reflecting monthly overall performance */}
                    <section className="bg-purple-100 p-6 rounded-lg shadow-md text-center mb-8">
                        <h3 className="text-xl font-semibold text-purple-800 mb-2">Overall Performance Rate (Current Month)</h3>
                        <p className="text-5xl font-extrabold text-purple-900">{monthlyOverallPerformanceRate}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                            <div className="bg-purple-600 h-4 rounded-full" style={{ width: `${monthlyOverallPerformanceRate}%` }}></div>
                        </div>
                    </section>

                    {/* Individual Team Member Overall Performance (Across All Time) */}
                    <section className="bg-white p-6 rounded-lg shadow-md overflow-x-auto mb-8">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Individual Team Member Overall Performance (Across All Time)</h3>
                        {teamMembers.length === 0 ? (
                            <p className="text-gray-500 italic">No team members found.</p>
                        ) : (
                            <div className="space-y-4">
                                {teamMembers.map(member => {
                                    const overallPerformance = getMemberOverallPerformanceRate(member);
                                    return (
                                        <div key={member} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-lg font-medium text-gray-700">{member}</span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-semibold
                                                    ${overallPerformance >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {overallPerformance}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
                                                    style={{ width: `${overallPerformance}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>


                    {/* Tasks by Category and Frequency - Visualized */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Tasks by Category (Monthly)</h3>
                            <div className="space-y-4">
                                {Object.entries(tasksByCategoryMonthlyOverview).sort(([,a],[,b]) => b - a).map(([category, count]) => (
                                    <div key={category} className="flex items-center">
                                        <span className="w-1/3 font-medium text-gray-700">{category}</span>
                                        <div className="w-2/3 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                                            <div
                                                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${(count / (totalUniqueTasksActiveInMonth || 1)) * 100}%` }}
                                            ></div>
                                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                                {count} ({(count / (totalUniqueTasksActiveInMonth || 1) * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Tasks by Frequency (Monthly)</h3>
                            <div className="space-y-4">
                                {Object.entries(tasksByFrequencyMonthlyOverview).sort(([,a],[,b]) => b - a).map(([frequency, count]) => (
                                    <div key={frequency} className="flex items-center">
                                        <span className="w-1/3 font-medium text-gray-700">{frequency}</span>
                                        <div className="w-2/3 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                                            <div
                                                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${(count / (totalUniqueTasksActiveInMonth || 1)) * 100}%` }}
                                            ></div>
                                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                                {count} ({(count / (totalUniqueTasksActiveInMonth || 1) * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* New: Individual Team Member Performance - Monthly and YTD (already exists, retaining) */}
                    <section className="bg-white p-6 rounded-lg shadow-md overflow-x-auto mb-8">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">Team Member Performance (Current Month & Year-to-Date)</h3>
                        {teamMembers.length === 0 ? (
                            <p className="text-gray-500 italic">No team members found.</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Performance</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year-to-Date Performance</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {teamMembers.map(member => (
                                        <tr key={member}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                    ${getMemberCurrentMonthPerformance(member, calendarSelectedDate) >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {getMemberCurrentMonthPerformance(member, calendarSelectedDate)}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                    ${getMemberYearToDatePerformance(member, calendarSelectedDate) >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {getMemberYearToDatePerformance(member, calendarSelectedDate)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>


                    {/* All Finance Tasks Table */}
                    <section className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                        <h3 className="text-2xl font-bold mb-4 text-gray-800">All Finance Tasks</h3>

                        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                            <label htmlFor="overview-team-member-select" className="text-lg font-medium text-gray-700 shrink-0">Handled By:</label>
                            <select
                                id="overview-team-member-select"
                                className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
                                value={selectedOverviewTeamMember}
                                onChange={(e) => setSelectedOverviewTeamMember(e.target.value)}
                            >
                                <option value="All">All</option>
                                {teamMembers.map(member => (
                                    <option key={member} value={member}>
                                        {member}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="status-filter" className="text-lg font-medium text-gray-700 shrink-0">Status:</label>
                            <select
                                id="status-filter"
                                className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                                <option value="Review Complete">Review Complete</option>
                            </select>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="overdue-filter"
                                    className="h-5 w-5 text-red-600 rounded focus:ring-red-500"
                                    checked={showOverdueOnly}
                                    onChange={(e) => setShowOverdueOnly(e.target.checked)}
                                />
                                <label htmlFor="overdue-filter" className="text-lg font-medium text-gray-700">Show Overdue Only</label>
                            </div>

                            <label htmlFor="search-term" className="text-lg font-medium text-gray-700 shrink-0">Search Work:</label>
                            <input
                                type="text"
                                id="search-term"
                                className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Search work particulars..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {filteredAndSortedOverviewTasks.length === 0 ? (
                            <p className="text-gray-500 italic">No finance tasks found for the selected filter.</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {[
                                            { key: 'sno', label: 'S.No' },
                                            { key: 'workparticulars', label: 'Work Particulars' },
                                            { key: 'handledby', label: 'Handled By' },
                                            { key: 'reviewedby', label: 'Reviewed By' },
                                            { key: 'frequency', label: 'Frequency' },
                                            { key: 'category', label: 'Category' },
                                            { key: 'commitmentdate', label: 'Commitment Date' } // Changed header to Commitment Date
                                        ].map(col => (
                                            <th
                                                key={col.key}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                                onClick={() => handleSort(col.key)}
                                            >
                                                {col.label}
                                                {sortColumn === col.key && (
                                                    sortDirection === 'asc' ? ' ↑' : (sortDirection === 'desc' ? ' ↓' : '')
                                                )}
                                            </th>
                                        ))}
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status (Today)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredAndSortedOverviewTasks.map((task) => {
                                        const todayFormatted = formatDate(new Date());
                                        const currentDayStatus = task.statusByDate[todayFormatted] || "Pending";

                                        const isTeamManager = user && user.email === TEAM_MANAGER_EMAIL;
                                        const currentUserMappedName = getUserMappedName(user);
                                        const isHandledByCurrentUser = task.handledby.toLowerCase() === currentUserMappedName?.toLowerCase();
                                        const isReviewedByCurrentUser = task.reviewedby.toLowerCase() === currentUserMappedName?.toLowerCase();

                                        const taskCommitmentDateObjects = parseDueDateForCalendar(task.commitmentdate, new Date().getFullYear(), new Date().getMonth(), task.frequency); // Use commitmentdate
                                        const todayDateOnly = new Date();
                                        todayDateOnly.setHours(0,0,0,0);
                                        const isTaskDueTodayOrPast = taskCommitmentDateObjects.some(d => d.setHours(0,0,0,0) <= todayDateOnly.getTime());
                                        const isOverdue = currentDayStatus === 'Pending' && isTaskDueTodayOrPast;


                                        return (
                                            <tr key={task.id} className={isOverdue ? 'bg-red-50' : ''}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.sno}</td>
                                                <td className="px-6 py-4 whitespace-normal text-sm text-gray-900 max-w-xs">{task.workparticulars}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.handledby}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.reviewedby}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.frequency}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.category}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.commitmentdate}</td> {/* Display commitmentdate */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                        ${currentDayStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                                                          currentDayStatus === 'Review Complete' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {currentDayStatus}
                                                    </span>
                                                    {isOverdue && <span className="ml-2 text-red-600 font-bold text-xs">(OVERDUE)</span>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2">
                                                    {(isTeamManager || isHandledByCurrentUser) && currentDayStatus === 'Pending' && (
                                                        <button
                                                            onClick={() => updateTaskStatus(task.id, todayFormatted, 'Completed')}
                                                            className="px-3 py-1 rounded-md text-white bg-blue-500 hover:bg-blue-600 transition duration-300"
                                                        >
                                                            Mark Complete
                                                        </button>
                                                    )}
                                                    {(isTeamManager || isReviewedByCurrentUser) && (currentDayStatus === 'Completed' || currentDayStatus === 'Pending') && currentDayStatus !== 'Review Complete' && (
                                                        <button
                                                            onClick={() => updateTaskStatus(task.id, todayFormatted, 'Review Complete')}
                                                            className="px-3 py-1 rounded-md text-white bg-purple-500 hover:bg-purple-600 transition duration-300"
                                                        >
                                                            Review Complete
                                                        </button>
                                                    )}
                                                    {(isTeamManager || (isHandledByCurrentUser && currentDayStatus === 'Completed') || (isReviewedByCurrentUser && currentDayStatus === 'Review Complete')) && (currentDayStatus === 'Completed' || currentDayStatus === 'Review Complete') && (
                                                        <button
                                                            onClick={() => updateTaskStatus(task.id, todayFormatted, 'Pending')}
                                                            className="px-3 py-1 rounded-md text-white bg-red-500 hover:bg-red-600 transition duration-300"
                                                        >
                                                            Mark Pending
                                                        </button>
                                                    )}
                                                    {!isTeamManager && !isHandledByCurrentUser && !isReviewedByCurrentUser && <span className="text-gray-500 italic">View Only</span>}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </section>
                </main>
            )}

            {currentPage === 'calendar' && (
                <main className="w-full max-w-6xl bg-white p-6 rounded-lg shadow-xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Team Work Calendar</h2>

                    <section className="p-4 bg-green-50 rounded-lg shadow-inner mb-8">
                        <h3 className="text-2xl font-bold mb-3 text-green-700">Individual Calendars</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                            <label htmlFor="team-member-select" className="text-lg font-medium text-gray-700 shrink-0">Select Team Member:</label>
                            <select
                                id="team-member-select"
                                className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
                                value={selectedTeamMember}
                                onChange={(e) => setSelectedTeamMember(e.target.value)}
                            >
                                <option value="">Select a team member</option>
                                {teamMembers.map(member => (
                                        <option key={member} value={member}>
                                            {member}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                            <label htmlFor="category-filter" className="text-lg font-medium text-gray-700 shrink-0">Filter by Category:</label>
                            <select
                                id="category-filter"
                                className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
                                value={selectedCategoryFilter}
                                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                            >
                                <option value="All">All Categories</option>
                                {allCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>

                            <label htmlFor="frequency-filter" className="text-lg font-medium text-gray-700 shrink-0">Filter by Frequency:</label>
                            <select
                                id="frequency-filter"
                                className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-sm"
                                value={selectedFrequencyFilter}
                                onChange={(e) => setSelectedFrequencyFilter(e.target.value)}
                            >
                                <option value="All">All Frequencies</option>
                                {allFrequencies.map(frequency => (
                                    <option key={frequency} value={frequency}>{frequency}</option>
                                ))}
                            </select>
                        </div>
                    </section>

                    {selectedTeamMember ? (
                        <div className="grid grid-cols-1 gap-8">
                            <div className="lg:col-span-1">
                                <h4 className="text-xl font-bold mb-4 text-gray-800 text-center">
                                    Calendar for {selectedTeamMember}
                                </h4>
                                <div className="flex justify-center mb-6">
                                    <CustomCalendar
                                        selectedDate={calendarSelectedDate}
                                        onDateChange={setCalendarSelectedDate}
                                        financeTasks={financeTasks}
                                        selectedTeamMember={selectedTeamMember}
                                        selectedCategoryFilter={selectedCategoryFilter}
                                        selectedFrequencyFilter={selectedFrequencyFilter}
                                    />
                                </div>

                            </div>

                            <div className="lg:col-span-1">
                                <div className="flex flex-wrap justify-center gap-4 mb-4">
                                    <button
                                        onClick={() => setShowOnlyPending(false)}
                                        className={`px-5 py-2 rounded-lg font-semibold transition-all duration-300
                                            ${!showOnlyPending ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        Show All Tasks
                                    </button>
                                    <button
                                        onClick={() => setShowOnlyPending(true)}
                                        className={`px-5 py-2 rounded-lg font-semibold transition-all duration-300
                                            ${showOnlyPending ? 'bg-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        Show Pending Tasks
                                    </button>
                                </div>

                                <h4 className="text-xl font-bold mb-3 text-gray-800">
                                    Tasks for {selectedTeamMember} on {calendarSelectedDate.toLocaleDateString()}
                                </h4>
                                {tasksForSelectedCalendarDate.length === 0 &&
                                 getMemberOverallPerformanceRate(selectedTeamMember) === 0 &&
                                 getMemberCurrentMonthPerformance(selectedTeamMember, calendarSelectedDate) === 0 &&
                                 getMemberYearToDatePerformance(selectedTeamMember, calendarSelectedDate) === 0 ? (
                                    <p className="text-gray-500 italic">No tasks or performance data found for {selectedTeamMember} on this date or month {showOnlyPending ? ' (pending only)' : ''}.</p>
                                ) : (
                                    <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {/* Performance metrics for individual member in calendar view */}
                                        <li className="bg-blue-50 p-4 rounded-md shadow-sm border border-blue-200 text-center font-bold flex flex-col gap-2">
                                            <span>Overall Performance Rate: {getMemberOverallPerformanceRate(selectedTeamMember)}%</span>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${getMemberOverallPerformanceRate(selectedTeamMember)}%` }}></div>
                                            </div>
                                            <span>Monthly Performance Rate (for {calendarSelectedDate.toLocaleString('default', { month: 'long' })}): {getMemberCurrentMonthPerformance(selectedTeamMember, calendarSelectedDate)}%</span>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${getMemberCurrentMonthPerformance(selectedTeamMember, calendarSelectedDate)}%` }}></div>
                                            </div>
                                            <span>Year-to-Date Performance (up to {calendarSelectedDate.toLocaleDateString()}): {getMemberYearToDatePerformance(selectedTeamMember, calendarSelectedDate)}%</span>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${getMemberYearToDatePerformance(selectedTeamMember, calendarSelectedDate)}%` }}></div>
                                            </div>
                                            <span>Daily Performance Rate: {getMemberDailyPerformanceRate(selectedTeamMember, calendarSelectedDate)}%</span>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${getMemberDailyPerformanceRate(selectedTeamMember, calendarSelectedDate)}%` }}></div>
                                            </div>
                                        </li>
                                        {tasksForSelectedCalendarDate.map(task => {
                                            const currentDayStatus = task.status; // status is already filtered for calendarSelectedDate
                                            // Overdue check based on COMMITMENT DATE
                                            const taskCommitmentDateObjects = parseDueDateForCalendar(task.commitmentdate, calendarSelectedDate.getFullYear(), calendarSelectedDate.getMonth(), task.frequency); // Use commitmentdate
                                            const selectedDateOnly = new Date(calendarSelectedDate);
                                            selectedDateOnly.setHours(0,0,0,0);
                                            const isTaskDueOnSelectedDateOrPast = taskCommitmentDateObjects.some(d => d.setHours(0,0,0,0) <= selectedDateOnly.getTime());

                                            const isOverdue = currentDayStatus === 'Pending' && isTaskDueOnSelectedDateOrPast;
                                            
                                            const isTeamManager = user && user.email === TEAM_MANAGER_EMAIL;
                                            const currentUserMappedName = getUserMappedName(user);
                                            const isHandledByCurrentUser = task.handledby.toLowerCase() === currentUserMappedName?.toLowerCase();
                                            const isReviewedByCurrentUser = task.reviewedby.toLowerCase() === currentUserMappedName?.toLowerCase();
                                            
                                            return (
                                                <li key={task.id} className={`bg-white p-4 rounded-md shadow-sm border border-gray-200 ${isOverdue ? 'border-red-500 ring-2 ring-red-300' : ''}`}>
                                                    <p className="font-semibold text-lg text-gray-800 mb-1">{task.workparticulars}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Assigned to: <span className="font-medium">{task.handledby}</span>, Reviewed by: <span className="font-medium">{task.reviewedby}</span>
                                                    </p>
                                                    <p className="text-sm text-gray-600">Frequency: {task.frequency}, Category: {task.category}</p>
                                                    <p className={`text-base font-bold mt-2 ${
                                                        currentDayStatus === 'Completed' ? 'text-green-600' :
                                                        currentDayStatus === 'Review Complete' ? 'text-purple-600' : 'text-yellow-600'
                                                    }`}>Status: {currentDayStatus} {isOverdue && <span className="text-red-600 ml-2">(OVERDUE)</span>}</p>
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {(isTeamManager || isHandledByCurrentUser) && currentDayStatus === 'Pending' && (
                                                            <button
                                                                onClick={() => updateTaskStatus(task.id, formatDate(calendarSelectedDate), 'Completed')}
                                                                className="px-4 py-2 rounded-md text-white text-sm font-semibold bg-blue-500 hover:bg-blue-600 transition duration-300"
                                                            >
                                                                Mark Complete
                                                            </button>
                                                        )}
                                                        {(isTeamManager || isReviewedByCurrentUser) && (currentDayStatus === 'Completed' || currentDayStatus === 'Pending') && currentDayStatus !== 'Review Complete' && (
                                                            <button
                                                                onClick={() => updateTaskStatus(task.id, formatDate(calendarSelectedDate), 'Review Complete')}
                                                                className="px-4 py-2 rounded-md text-white text-sm font-semibold bg-purple-500 hover:bg-purple-600 transition duration-300"
                                                            >
                                                                Review Complete
                                                            </button>
                                                        )}
                                                        {(isTeamManager || (isHandledByCurrentUser && currentDayStatus === 'Completed') || (isReviewedByCurrentUser && currentDayStatus === 'Review Complete')) && (currentDayStatus === 'Completed' || currentDayStatus === 'Review Complete') && (
                                                            <button
                                                                onClick={() => updateTaskStatus(task.id, formatDate(calendarSelectedDate), 'Pending')}
                                                                className="px-4 py-2 rounded-md text-white text-sm font-semibold bg-red-500 hover:bg-red-600 transition duration-300"
                                                            >
                                                                Mark Pending
                                                            </button>
                                                        )}
                                                        {!isTeamManager && !isHandledByCurrentUser && !isReviewedByCurrentUser && <span className="text-gray-500 italic">View Only</span>}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic text-center text-lg mt-8">Select a team member from the dropdown above to view their calendar and tasks.</p>
                    )}
                </main>
            )}

            {/* Add/Edit Task Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4 border-b pb-3">
                            <h3 className="text-xl font-bold text-gray-800">{isEditingTask ? 'Edit Task' : 'Add New Task'}</h3>
                            <button
                                onClick={closeTaskModal}
                                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                            >
                                &times;
                            </button>
                        </div>
                        {taskModalError && <p className="text-red-500 mb-4 text-center">{taskModalError}</p>}
                        <form onSubmit={(e) => { e.preventDefault(); saveTask(); }} className="flex-grow overflow-y-auto pr-2">
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sno">S.No</label>
                                <input type="number" id="sno" name="sno" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={currentTask.sno} onChange={handleTaskFormChange} required min="1" placeholder="Enter S.No" />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="workparticulars">Work Particulars</label>
                                <input type="text" id="workparticulars" name="workparticulars" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={currentTask.workparticulars} onChange={handleTaskFormChange} required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="handledby">Handled By</label>
                                <select id="handledby" name="handledby" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white"
                                    value={currentTask.handledby} onChange={handleTaskFormChange} required>
                                    <option value="">Select Handled By</option>
                                    {teamMembers.map(member => (
                                        <option key={member} value={member}>{member}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="reviewedby">Reviewed By</label>
                                <select id="reviewedby" name="reviewedby" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white"
                                    value={currentTask.reviewedby} onChange={handleTaskFormChange}>
                                    <option value="">Select Reviewed By</option>
                                    {allReviewedBy.map(member => (
                                        <option key={member} value={member}>{member}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="frequency">Frequency</label>
                                <select id="frequency" name="frequency" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white"
                                    value={currentTask.frequency} onChange={handleTaskFormChange} required>
                                    <option value="">Select Frequency</option>
                                    {allFrequencies.map(freq => (
                                        <option key={freq} value={freq}>{freq}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">Category</label>
                                <select id="category" name="category" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-white"
                                    value={currentTask.category} onChange={handleTaskFormChange} required>
                                    <option value="">Select Category</option>
                                    {allCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="duedate">Due Date (Reference Only)</label> {/* Kept for original CSV value */}
                                <input type="text" id="duedate" name="duedate" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="e.g., Daily, Monday, 7th, 30th Jul/Oct/Jan/May"
                                    value={currentTask.duedate} onChange={handleTaskFormChange} />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="commitmentdate">Commitment Date</label> {/* Main date for logic */}
                                <input type="text" id="commitmentdate" name="commitmentdate" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    placeholder="e.g., Daily, Saturday, 5th"
                                    value={currentTask.commitmentdate} onChange={handleTaskFormChange} required />
                            </div>
                            <div className="flex justify-end gap-4 mt-auto pt-4 border-t">
                                <button type="button" onClick={closeTaskModal} className="px-5 py-2 rounded-md text-gray-800 bg-gray-300 hover:bg-gray-400 transition duration-300">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition duration-300">
                                    {isEditingTask ? 'Save Changes' : 'Add Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
