/* =========================================================
   SMARTSPEND
   Frontend JavaScript
   ========================================================= */


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

const API_URL =
    window.location.port === "5500"
        ? "http://" + window.location.hostname + ":8000"
        : window.location.origin;

let token = localStorage.getItem("token");

let allExpenses = [];

let categoryChart = null;
let paymentChart = null;
let monthlyChart = null;


/* =========================================================
   DESIGN COLORS
   ========================================================= */

const COLORS = {
    coral: "#F28C8C",
    yellow: "#E8B84A",
    brown: "#5A3A2E",
    tan: "#C9B79C",
    paper: "#F1EBD6",
    text: "#5A3A2E",
    textSoft: "#6B4A3C"
};


/* =========================================================
   FIXED CATEGORY COLORS
   ========================================================= */

const chartPalette = [
    "#F28C8C",
    "#E8B84A",
    "#5A3A2E",
    "#C9B79C",
    "#8FA79A",
    "#D9805F",
    "#A68A6D",
    "#E6C9A8"
];


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function showRegister() {

    document.getElementById("loginBox").style.display = "none";

    document.getElementById("registerBox").style.display = "block";

    const message =
        document.getElementById("registerMessage");

    if (message) {
        message.textContent = "";
    }
}


function showLogin() {

    document.getElementById("registerBox").style.display = "none";

    document.getElementById("loginBox").style.display = "block";

    const message =
        document.getElementById("loginMessage");

    if (message) {
        message.textContent = "";
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

async function login(event) {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const message =
        document.getElementById("loginMessage");

    message.textContent = "Signing you in...";

    try {

        const response = await fetch(
            `${API_URL}/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            message.textContent =
                data.detail ||
                "Invalid email or password.";

            return;
        }


        token = data.access_token;

        localStorage.setItem(
            "token",
            token
        );


        message.textContent = "";

        showApp();

    } catch (error) {

        console.error("Login error:", error);

        message.textContent =
            "Unable to connect to SmartSpend.";
    }
}


/* =========================================================
   REGISTER
   ========================================================= */

async function registerUser(event) {

    event.preventDefault();

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword =
        document.getElementById(
            "registerConfirmPassword"
        ).value;

    const message =
        document.getElementById("registerMessage");


    if (!name || !email || !password) {

        message.textContent =
            "Please fill in all fields.";

        return;
    }


    if (password.length < 8) {

        message.textContent =
            "Password must contain at least 8 characters.";

        return;
    }


    if (password !== confirmPassword) {

        message.textContent =
            "Passwords do not match.";

        return;
    }


    message.textContent =
        "Creating your account...";


    try {

        const response = await fetch(
            `${API_URL}/users`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            message.textContent =
                data.detail ||
                "Could not create account.";

            return;
        }


        message.textContent =
            "Account created. You can now log in.";

        document.getElementById(
            "registerPassword"
        ).value = "";

        document.getElementById(
            "registerConfirmPassword"
        ).value = "";


        setTimeout(() => {

            showLogin();

            document.getElementById(
                "loginEmail"
            ).value = email;

        }, 700);


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        message.textContent =
            "Unable to connect to SmartSpend.";
    }
}


/* =========================================================
   SHOW APP
   ========================================================= */

function showApp() {

    document.getElementById(
        "authSection"
    ).style.display = "none";

    document.getElementById(
        "appSection"
    ).style.display = "block";


    setTodayDate();

    loadExpenses();
}


/* =========================================================
   SET TODAY'S DATE
   ========================================================= */

function setTodayDate() {

    const dateInput =
        document.getElementById("expenseDate");

    if (!dateInput) {
        return;
    }


    if (!dateInput.value) {

        const now = new Date();

        const today =
            now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, "0") + "-" +
            String(now.getDate()).padStart(2, "0");

        dateInput.value = today;
    }
}


/* =========================================================
   ADD EXPENSE
   ========================================================= */

async function addExpense(event) {

    event.preventDefault();


    const amount =
        parseFloat(
            document.getElementById("amount").value
        );

    const category =
        document.getElementById("category").value;

    const description =
        document.getElementById(
            "description"
        ).value.trim();

    const expenseDate =
        document.getElementById(
            "expenseDate"
        ).value;

    const payment =
        document.getElementById(
            "payment"
        ).value;

    const notes =
        document.getElementById(
            "notes"
        ).value.trim();


    if (!amount || amount <= 0) {

        alert(
            "Please enter a valid expense amount."
        );

        return;
    }


    if (!category) {

        alert(
            "Please select a category."
        );

        return;
    }


    if (!expenseDate) {

        alert(
            "Please select an expense date."
        );

        return;
    }


    if (!payment) {

        alert(
            "Please select a payment method."
        );

        return;
    }


    try {

        const response = await fetch(
            `${API_URL}/expenses`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`
                },

                body: JSON.stringify({

                    amount: amount,

                    category: category,

                    description:
                        description || null,

                    notes:
                        notes || null,

                    expense_date:
                        `${expenseDate}T00:00:00`,

                    payment_method:
                        payment
                })
            }
        );


        if (response.status === 401) {

            logout();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Could not add expense."
            );

            return;
        }


        document.getElementById(
            "amount"
        ).value = "";

        document.getElementById(
            "description"
        ).value = "";

        document.getElementById(
            "notes"
        ).value = "";

        document.getElementById(
            "category"
        ).value = "";

        document.getElementById(
            "payment"
        ).value = "";


        setTodayDate();


        await loadExpenses();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


    } catch (error) {

        console.error(
            "Add expense error:",
            error
        );

        alert(
            "Unable to connect to SmartSpend."
        );
    }
}


/* =========================================================
   LOAD EXPENSES
   ========================================================= */

async function loadExpenses() {

    try {

        const response = await fetch(
            `${API_URL}/expenses`,
            {
                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        if (response.status === 401) {

            logout();

            return;
        }


        if (!response.ok) {

            console.error(
                "Failed to load expenses."
            );

            return;
        }


        allExpenses =
            await response.json();


        renderExpenses();

        updateDashboard();

        loadIntelligence();


    } catch (error) {

        console.error(
            "Load expenses error:",
            error
        );
    }
}


/* =========================================================
   RENDER EXPENSES
   ========================================================= */

function renderExpenses() {

    const container =
        document.getElementById(
            "expenses"
        );

    if (!container) {
        return;
    }


    const searchInput =
        document.getElementById(
            "search"
        );

    const filterInput =
        document.getElementById(
            "filterCategory"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const categoryFilter =
        filterInput
            ? filterInput.value
            : "";


    const filteredExpenses =
        allExpenses.filter(
            expense => {

                const description =
                    (
                        expense.description ||
                        ""
                    ).toLowerCase();


                const category =
                    (
                        expense.category ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    description.includes(search) ||
                    category.includes(search);


                const matchesCategory =
                    !categoryFilter ||
                    expense.category ===
                    categoryFilter;


                return (
                    matchesSearch &&
                    matchesCategory
                );
            }
        );


    container.innerHTML = "";


    if (filteredExpenses.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <p>
                    No expenses found.
                </p>

            </div>
        `;

        return;
    }


    filteredExpenses.forEach(
        expense => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "expense-item";


            const date =
                formatDate(
                    expense.expense_date
                );


            const description =
                escapeHTML(
                    expense.description ||
                    "Expense"
                );


            const category =
                escapeHTML(
                    expense.category
                );


            const payment =
                escapeHTML(
                    formatPayment(
                        expense.payment_method
                    )
                );


            const amount =
                Number(
                    expense.amount
                ).toFixed(2);


            item.innerHTML = `

                <div class="expense-main">

                    <div class="expense-description">
                        ${description}
                    </div>

                    <div class="expense-meta">

                        <span>
                            ${date}
                        </span>

                        <span>•</span>

                        <span>
                            ${payment}
                        </span>

                        <span class="expense-category">
                            ${category}
                        </span>

                    </div>

                </div>


                <div class="expense-amount">
                    ₹${amount}
                </div>


                <div class="expense-actions">

                    <button
                        class="icon-btn"
                        title="Edit expense"
                        onclick="openEditModal(${expense.id})"
                    >
                        ✎
                    </button>


                    <button
                        class="icon-btn"
                        title="Delete expense"
                        onclick="deleteExpense(${expense.id})"
                    >
                        ×
                    </button>

                </div>

            `;


            container.appendChild(item);
        }
    );
}


/* =========================================================
   UPDATE DASHBOARD
   ========================================================= */

function updateDashboard() {

    const total =
        allExpenses.reduce(
            (sum, expense) =>
                sum +
                Number(expense.amount),
            0
        );


    const count =
        allExpenses.length;


    const average =
        count > 0
            ? total / count
            : 0;


    document.getElementById(
        "totalSpent"
    ).textContent =
        total.toFixed(2);


    document.getElementById(
        "expenseCount"
    ).textContent =
        count;


    document.getElementById(
        "averageExpense"
    ).textContent =
        average.toFixed(2);


    updateStatus();

    createCategoryChart();

    createPaymentChart();

    createMonthlyChart();
}


/* =========================================================
   SPENDING STATUS
   ========================================================= */

function updateStatus() {

    const element =
        document.getElementById(
            "spendingStatus"
        );

    if (!element) {
        return;
    }

    const totals = {};

    allExpenses.forEach(
        expense => {

            const date =
                new Date(
                    expense.expense_date
                );

            const key =
                date.getFullYear() +
                "-" +
                String(
                    date.getMonth() + 1
                ).padStart(2, "0");

            totals[key] =
                (totals[key] || 0) +
                Number(expense.amount);
        }
    );

    const months =
        Object.keys(totals).sort();

    if (months.length < 2) {

        element.textContent =
            "On track";

        return;
    }

    const current =
        totals[
            months[months.length - 1]
        ];

    const previous =
        months
            .slice(0, -1)
            .map(month => totals[month]);

    const average =
        previous.reduce(
            (sum, value) => sum + value,
            0
        ) / previous.length;

    element.textContent =
        current > average * 1.2
            ? "Above usual"
            : "On track";
}


/* =========================================================
   CATEGORY CHART
   ========================================================= */

function createCategoryChart() {

    const canvas =
        document.getElementById(
            "categoryChart"
        );

    if (!canvas) {
        return;
    }


    if (categoryChart) {
        categoryChart.destroy();
    }


    const categoryTotals = {};


    allExpenses.forEach(
        expense => {

            const category =
                expense.category ||
                "Other";


            if (!categoryTotals[category]) {

                categoryTotals[category] = 0;
            }


            categoryTotals[category] +=
                Number(expense.amount);
        }
    );


    const labels =
        Object.keys(
            categoryTotals
        );


    const values =
        Object.values(
            categoryTotals
        );


    categoryChart =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            data: values,

                            backgroundColor:
                                labels.map(
                                    (_, index) =>
                                        chartPalette[
                                            index %
                                            chartPalette.length
                                        ]
                                ),

                            borderWidth: 2,

                            borderColor:
                                COLORS.brown,

                            hoverOffset: 6
                        }
                    ]
                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    cutout: "68%",


                    plugins: {

                        legend: {

                            position:
                                "bottom",

                            labels: {

                                color:
                                    COLORS.textSoft,

                                usePointStyle:
                                    true,

                                padding:
                                    18,

                                font: {

                                    family:
                                        "Outfit",

                                    size: 12
                                }
                            }
                        }
                    }
                }
            }
        );
}


/* =========================================================
   PAYMENT METHOD CHART
   ========================================================= */

function createPaymentChart() {

    const canvas =
        document.getElementById(
            "paymentChart"
        );

    if (!canvas) {
        return;
    }


    if (paymentChart) {
        paymentChart.destroy();
    }


    const paymentTotals = {};


    allExpenses.forEach(
        expense => {

            const payment =
                formatPayment(
                    expense.payment_method
                );


            if (!paymentTotals[payment]) {

                paymentTotals[payment] = 0;
            }


            paymentTotals[payment] +=
                Number(expense.amount);
        }
    );


    const labels =
        Object.keys(
            paymentTotals
        );


    const values =
        Object.values(
            paymentTotals
        );


    paymentChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            data: values,

                            backgroundColor:
                                labels.map(
                                    (_, index) =>
                                        chartPalette[
                                            index %
                                            chartPalette.length
                                        ]
                                ),

                            borderColor:
                                COLORS.brown,

                            borderWidth: 2,

                            borderRadius: 4,

                            borderSkipped: false,

                            barThickness:
                                "flex",

                            maxBarThickness:
                                42
                        }
                    ]
                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,


                    plugins: {

                        legend: {
                            display: false
                        }
                    },


                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {

                                color:
                                    COLORS.textSoft,

                                font: {
                                    family:
                                        "Outfit",
                                    size: 12
                                }
                            }
                        },


                        y: {

                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {

                                color:
                                    COLORS.textSoft,

                                font: {
                                    family:
                                        "Outfit",
                                    size: 12
                                },

                                callback:
                                    function(value) {
                                        return "₹" +
                                            value;
                                    }
                            }
                        }
                    }
                }
            }
        );
}


/* =========================================================
   MONTHLY SPENDING CHART
   ========================================================= */

function createMonthlyChart() {

    const canvas =
        document.getElementById(
            "monthlyChart"
        );

    if (!canvas) {
        return;
    }


    if (monthlyChart) {
        monthlyChart.destroy();
    }


    const monthlyTotals = {};


    allExpenses.forEach(
        expense => {

            const date =
                new Date(
                    expense.expense_date
                );


            const month =
                date.getFullYear() +
                "-" +
                String(
                    date.getMonth() + 1
                ).padStart(2, "0");


            if (!monthlyTotals[month]) {

                monthlyTotals[month] = 0;
            }


            monthlyTotals[month] +=
                Number(expense.amount);
        }
    );


    const sortedMonths =
        Object.keys(
            monthlyTotals
        ).sort();


    const labels =
        sortedMonths.map(
            month => formatMonth(month)
        );


    const values =
        sortedMonths.map(
            month =>
                monthlyTotals[month]
        );


    monthlyChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            data: values,

                            borderColor:
                                COLORS.coral,

                            backgroundColor:
                                "transparent",

                            borderWidth: 3,

                            pointBackgroundColor:
                                COLORS.brown,

                            pointBorderWidth:
                                0,

                            pointRadius: 5,

                            pointHoverRadius:
                                7,

                            tension: 0.35
                        }
                    ]
                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,


                    plugins: {

                        legend: {
                            display: false
                        }
                    },


                    scales: {

                        x: {

                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {

                                color:
                                    COLORS.textSoft,

                                font: {
                                    family:
                                        "Outfit",
                                    size: 12
                                }
                            }
                        },


                        y: {

                            grid: {
                                display: false
                            },

                            border: {
                                display: false
                            },

                            ticks: {

                                color:
                                    COLORS.textSoft,

                                font: {
                                    family:
                                        "Outfit",
                                    size: 12
                                },

                                callback:
                                    function(value) {
                                        return "₹" +
                                            value;
                                    }
                            }
                        }
                    }
                }
            }
        );
}


/* =========================================================
   EDIT EXPENSE MODAL
   ========================================================= */

function openEditModal(expenseId) {

    const expense =
        allExpenses.find(
            item =>
                item.id === expenseId
        );


    if (!expense) {
        return;
    }


    document.getElementById(
        "editAmount"
    ).value =
        expense.amount;


    document.getElementById(
        "editCategory"
    ).value =
        expense.category;


    document.getElementById(
        "editDescription"
    ).value =
        expense.description || "";


    document.getElementById(
        "editDate"
    ).value =
        formatInputDate(
            expense.expense_date
        );


    document.getElementById(
        "editPayment"
    ).value =
        formatPayment(
            expense.payment_method
        );


    document.getElementById(
        "editNotes"
    ).value =
        expense.notes || "";


    document.getElementById(
        "editModal"
    ).dataset.expenseId =
        expenseId;


    document.getElementById(
        "editModal"
    ).style.display =
        "flex";
}


/* =========================================================
   CLOSE EDIT MODAL
   ========================================================= */

function closeEditModal() {

    const modal =
        document.getElementById(
            "editModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }
}


/* =========================================================
   SAVE EDITED EXPENSE
   ========================================================= */

async function saveEditedExpense() {

    const modal =
        document.getElementById(
            "editModal"
        );


    const expenseId =
        modal.dataset.expenseId;


    const amount =
        parseFloat(
            document.getElementById(
                "editAmount"
            ).value
        );


    const category =
        document.getElementById(
            "editCategory"
        ).value;


    const description =
        document.getElementById(
            "editDescription"
        ).value.trim();


    const date =
        document.getElementById(
            "editDate"
        ).value;


    const payment =
        document.getElementById(
            "editPayment"
        ).value;


    const notes =
        document.getElementById(
            "editNotes"
        ).value.trim();


    if (!amount || amount <= 0) {

        alert(
            "Please enter a valid amount."
        );

        return;
    }


    if (!category || !date || !payment) {

        alert(
            "Please complete all required fields."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/expenses/${expenseId}`,
                {
                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        amount: amount,

                        category: category,

                        description:
                            description ||
                            null,

                        notes:
                            notes ||
                            null,

                        expense_date:
                            `${date}T00:00:00`,

                        payment_method:
                            payment
                    })
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            alert(
                data.detail ||
                "Could not update expense."
            );

            return;
        }


        closeEditModal();

        await loadExpenses();


    } catch (error) {

        console.error(
            "Edit expense error:",
            error
        );

        alert(
            "Unable to connect to SmartSpend."
        );
    }
}


/* =========================================================
   DELETE EXPENSE
   ========================================================= */

async function deleteExpense(expenseId) {

    const expense =
        allExpenses.find(
            item =>
                item.id === expenseId
        );


    if (!expense) {
        return;
    }


    const confirmed =
        confirm(
            `Delete this ₹${Number(
                expense.amount
            ).toFixed(2)} expense?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/expenses/${expenseId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        if (!response.ok) {

            const data =
                await response.json();

            alert(
                data.detail ||
                "Could not delete expense."
            );

            return;
        }


        await loadExpenses();


    } catch (error) {

        console.error(
            "Delete expense error:",
            error
        );

        alert(
            "Unable to connect to SmartSpend."
        );
    }
}


/* =========================================================
   SMARTSPEND INTELLIGENCE
   ========================================================= */

async function loadIntelligence() {

    await loadInsights();

    await loadUnusualExpenses();

    await loadPrediction();
}


/* =========================================================
   SPENDING INSIGHTS
   ========================================================= */

async function loadInsights() {

    const container =
        document.getElementById(
            "insights"
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/analytics/insights`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        if (!response.ok) {

            container.textContent =
                "Insights are currently unavailable.";

            return;
        }


        const data =
            await response.json();


        container.innerHTML = "";


        if (
            !data.insights ||
            data.insights.length === 0
        ) {

            container.textContent =
                "Add more expenses to receive insights.";

            return;
        }


        data.insights.forEach(
            insight => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "insight-item";


                div.textContent =
                    "• " + insight;


                container.appendChild(div);
            }
        );


    } catch (error) {

        console.error(
            "Insight error:",
            error
        );

        container.textContent =
            "Insights are currently unavailable.";
    }
}


/* =========================================================
   UNUSUAL EXPENSES
   ========================================================= */

async function loadUnusualExpenses() {

    const container =
        document.getElementById(
            "unusualExpenses"
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/analytics/unusual`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        const data =
            await response.json();


        container.innerHTML = "";


        if (
            data.status ===
            "not_enough_data"
        ) {

            container.textContent =
                data.message;

            return;
        }


        if (
            !data.unusual_expenses ||
            data.unusual_expenses.length === 0
        ) {

            container.textContent =
                "No unusual expenses detected.";

            return;
        }


        data.unusual_expenses.forEach(
            expense => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "unusual-item";


                const amount =
                    Number(
                        expense.amount
                    ).toFixed(2);


                const description =
                    escapeHTML(
                        expense.description ||
                        "Expense"
                    );


                const category =
                    escapeHTML(
                        expense.category
                    );


                div.innerHTML = `

                    <strong>
                        ₹${amount}
                    </strong>

                    <br>

                    ${description}

                    <br>

                    <small>
                        ${category}
                    </small>

                `;


                container.appendChild(div);
            }
        );


    } catch (error) {

        console.error(
            "Unusual expense error:",
            error
        );

        container.textContent =
            "Unable to analyze expenses.";
    }
}


/* =========================================================
   FUTURE SPENDING PREDICTION
   ========================================================= */

async function loadPrediction() {

    const container =
        document.getElementById(
            "prediction"
        );


    if (!container) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/analytics/prediction`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

            logout();

            return;
        }


        const data =
            await response.json();


        if (
            data.status ===
            "not_enough_data"
        ) {

            container.innerHTML = `

                <p>
                    ${escapeHTML(
                        data.message
                    )}
                </p>

            `;

            return;
        }


        container.innerHTML = `

            <div class="prediction-value">

                ₹${Number(
                    data.predicted_monthly_spending
                ).toFixed(2)}

            </div>


            <p>

                Estimated spending for your
                next month based on your
                historical spending.

            </p>


            <small>

                Based on
                ${data.based_on_months}
                months of data.

            </small>

        `;


    } catch (error) {

        console.error(
            "Prediction error:",
            error
        );

        container.textContent =
            "Prediction is currently unavailable.";
    }
}


/* =========================================================
   SEARCH
   ========================================================= */

function handleSearch() {

    renderExpenses();
}


/* =========================================================
   FILTER
   ========================================================= */

function handleCategoryFilter() {

    renderExpenses();
}


/* =========================================================
   DATE FORMATTING
   ========================================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function formatInputDate(dateString) {

    if (!dateString) {
        return "";
    }


    return dateString.split("T")[0];
}


function formatMonth(monthString) {

    const [year, month] =
        monthString.split("-");


    const date =
        new Date(
            Number(year),
            Number(month) - 1,
            1
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function formatPayment(value) {

    const text =
        (value || "Other").trim();

    if (text.toLowerCase() === "upi") {
        return "UPI";
    }

    return text
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {

    localStorage.removeItem(
        "token"
    );

    token = null;

    allExpenses = [];


    if (categoryChart) {

        categoryChart.destroy();

        categoryChart = null;
    }


    if (paymentChart) {

        paymentChart.destroy();

        paymentChart = null;
    }


    if (monthlyChart) {

        monthlyChart.destroy();

        monthlyChart = null;
    }


    document.getElementById(
        "appSection"
    ).style.display = "none";


    document.getElementById(
        "authSection"
    ).style.display = "flex";


    showLogin();
}


/* =========================================================
   MODAL CLICK OUTSIDE
   ========================================================= */

window.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById(
                "editModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeEditModal();
        }
    }
);


/* =========================================================
   KEYBOARD SUPPORT
   ========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeEditModal();
        }
    }
);


/* =========================================================
   APPLICATION INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* -------------------------
       LOGIN FORM
       ------------------------- */

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener(
            "submit",
            login
        );
    }


    /* -------------------------
       REGISTER FORM
       ------------------------- */

    const registerForm =
        document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener(
            "submit",
            registerUser
        );
    }


    /* -------------------------
       SEARCH
       ------------------------- */

    const search =
        document.getElementById("search");

    if (search) {
        search.addEventListener(
            "input",
            handleSearch
        );
    }


    /* -------------------------
       CATEGORY FILTER
       ------------------------- */

    const filter =
        document.getElementById(
            "filterCategory"
        );

    if (filter) {
        filter.addEventListener(
            "change",
            handleCategoryFilter
        );
    }


    /* -------------------------
       LOGIN / APP STATE
       ------------------------- */

    if (token) {
        showApp();
    } else {

        const authSection =
            document.getElementById(
                "authSection"
            );

        const appSection =
            document.getElementById(
                "appSection"
            );

        if (authSection) {
            authSection.style.display = "flex";
        }

        if (appSection) {
            appSection.style.display = "none";
        }
    }

});