
const API_URL = "/api/students";

const studentList = document.getElementById("studentList");
const totalStudents = document.getElementById("totalStudents");
const avgAttendance = document.getElementById("avgAttendance");
const avgMarks = document.getElementById("avgMarks");
const needsAttention = document.getElementById("needsAttention");
const chartAttendance = document.getElementById("chartAttendance");
const searchInput = document.getElementById("searchInput");
const tableCount = document.getElementById("tableCount");

const modal = document.getElementById("modalOverlay");
const studentForm = document.getElementById("studentForm");
const formMessage = document.getElementById("formMessage");

let students = [];
let attendanceChart = null;
let marksChart = null;

const colors = [
  "#6758e8", "#20b486", "#f1a34a",
  "#e66b7a", "#4299e1", "#b66ee8"
];

// Current date
document.getElementById("today").textContent =
  new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

// Open and close the Add Student modal
document.getElementById("addBtn").addEventListener("click", () => {
  formMessage.textContent = "";
  modal.hidden = false;
});

function closeModal() {
  modal.hidden = true;
}

document.getElementById("closeBtn").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);

modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

// Mobile sidebar
document.getElementById("menuBtn").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => {
      item.classList.remove("active");
    });

    link.classList.add("active");
    document.getElementById("sidebar").classList.remove("open");
  });
});

// Load students from the Express API
async function loadStudents() {
  studentList.replaceChildren();

  const loadingRow = document.createElement("tr");
  const loadingCell = document.createElement("td");

  loadingCell.colSpan = 6;
  loadingCell.className = "empty";
  loadingCell.textContent = "Loading student records...";
  loadingRow.appendChild(loadingCell);
  studentList.appendChild(loadingRow);

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Unable to load students (${response.status})`);
    }

    students = await response.json();

    renderDashboard();
  } catch (error) {
    studentList.replaceChildren();

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 6;
    cell.className = "empty";
    cell.textContent =
      `${error.message}. Check your server and database connection.`;

    row.appendChild(cell);
    studentList.appendChild(row);
  }
}

// Update the dashboard statistics
function renderDashboard() {
  const count = students.length;

  const attendanceAverage = count
    ? students.reduce((sum, s) => sum + Number(s.attendance || 0), 0) / count
    : 0;

  const marksAverage = count
    ? students.reduce((sum, s) => sum + Number(s.marks || 0), 0) / count
    : 0;

  const lowAttendance = students.filter(
    (s) => Number(s.attendance || 0) < 75
  ).length;

  totalStudents.textContent = count;
  avgAttendance.textContent = `${attendanceAverage.toFixed(1)}%`;
  avgMarks.textContent = `${marksAverage.toFixed(1)}%`;
  needsAttention.textContent = lowAttendance;
  chartAttendance.textContent = `${attendanceAverage.toFixed(0)}%`;

  renderAttendanceChart(attendanceAverage);
  renderMarksChart();
  renderStudentTable();
}

// Attendance donut chart
function renderAttendanceChart(average) {
  if (typeof Chart === "undefined") return;

  if (attendanceChart) attendanceChart.destroy();

  attendanceChart = new Chart(
    document.getElementById("attendanceChart"),
    {
      type: "doughnut",
      data: {
        labels: ["Present", "Low attendance"],
        datasets: [{
          data: countSafeData(average),
          backgroundColor: ["#20b486", "#e66b7a"],
          borderWidth: 0,
          hoverOffset: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "76%",
        plugins: {
          legend: { display: false }
        }
      }
    }
  );
}

function countSafeData(average) {
  return [average, 100 - average];
}

// Marks chart
function renderMarksChart() {
  if (typeof Chart === "undefined") return;

  if (marksChart) marksChart.destroy();

  const chartStudents = students.slice(0, 8);

  marksChart = new Chart(
    document.getElementById("marksChart"),
    {
      type: "bar",
      data: {
        labels: chartStudents.map((s) => s.name),
        datasets: [{
          label: "Marks (%)",
          data: chartStudents.map((s) => Number(s.marks || 0)),
          backgroundColor: chartStudents.map(
            (_, index) => colors[index % colors.length]
          ),
          borderRadius: 6,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { stepSize: 20 },
            grid: { color: "#f0f1f6" }
          },
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 35,
              minRotation: 0
            }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    }
  );
}

// Create a table cell safely
function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

// Render searchable student records
function renderStudentTable() {
  const query = searchInput.value.trim().toLowerCase();

  const filteredStudents = students.filter((student) => {
    return [
      student.name,
      student.rollNumber,
      student.course,
      student.email
    ].some((value) => String(value || "").toLowerCase().includes(query));
  });

  studentList.replaceChildren();

  if (filteredStudents.length === 0) {
    const row = document.createElement("tr");
    const cell = createCell(
      students.length === 0
        ? "No students yet. Click Add Student to begin."
        : "No matching students found."
    );

    cell.colSpan = 6;
    cell.className = "empty";
    row.appendChild(cell);
    studentList.appendChild(row);
  }

  filteredStudents.forEach((student, index) => {
    const row = document.createElement("tr");

    // Student name and email
    const nameCell = document.createElement("td");
    const nameWrapper = document.createElement("div");
    const avatar = document.createElement("div");
    const nameInfo = document.createElement("div");
    const name = document.createElement("strong");
    const email = document.createElement("small");

    nameWrapper.className = "student-cell";
    avatar.className = `avatar`;
    avatar.style.background = "#f0edff";
    avatar.style.color = colors[index % colors.length];

    avatar.textContent = String(student.name || "S")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase();

    name.textContent = student.name;
    email.textContent = student.email;

    nameInfo.append(name, email);
    nameWrapper.append(avatar, nameInfo);
    nameCell.appendChild(nameWrapper);

    row.appendChild(nameCell);
    row.appendChild(createCell(student.rollNumber));
    row.appendChild(createCell(student.course));

    // Attendance progress
    const attendance = Math.min(
      100,
      Math.max(0, Number(student.attendance) || 0)
    );

    const attendanceCell = document.createElement("td");
    const attendanceText = document.createElement("span");
    const progress = document.createElement("div");
    const progressBar = document.createElement("span");

    attendanceText.textContent = `${attendance}%`;
    progress.className = `progress ${attendance < 75 ? "low" : ""}`;
    progressBar.style.width = `${attendance}%`;

    progress.appendChild(progressBar);
    attendanceCell.append(attendanceText, progress);
    row.appendChild(attendanceCell);

    // Marks
    const marks = Math.min(
      100,
      Math.max(0, Number(student.marks) || 0)
    );

    const marksCell = document.createElement("td");
    const marksBadge = document.createElement("span");

    marksBadge.className = `badge ${marks < 40 ? "low" : ""}`;
    marksBadge.textContent = `${marks}%`;

    marksCell.appendChild(marksBadge);
    row.appendChild(marksCell);

    // Delete student
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");

    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      deleteStudent(student._id);
    });

    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);

    studentList.appendChild(row);
  });

  tableCount.textContent =
    `Showing ${filteredStudents.length} of ${students.length} students`;
}

// Search
searchInput.addEventListener("input", renderStudentTable);

// Add student
studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";

  const formData = new FormData(studentForm);
  const student = Object.fromEntries(formData.entries());

  student.attendance = Number(student.attendance);
  student.marks = Number(student.marks);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(student)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to add student");
    }

    studentForm.reset();
    closeModal();

    searchInput.value = "";
    await loadStudents();
  } catch (error) {
    formMessage.textContent = error.message;
  }
});

// Delete student
async function deleteStudent(id) {
  const confirmed = confirm(
    "Are you sure you want to delete this student?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete student");
    }

    await loadStudents();
  } catch (error) {
    alert(error.message);
  }
}

// Refresh button
document.getElementById("refreshBtn").addEventListener("click", loadStudents);

// Initial dashboard load
loadStudents();
