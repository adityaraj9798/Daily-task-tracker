const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const dateTime = document.getElementById("dateTime");
const weekRange = document.getElementById("weekRange");
const weeklyAverageText = document.getElementById("weeklyAverage");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let yearlyHistory = JSON.parse(localStorage.getItem("yearlyHistory")) || {}; 
let chart;
let currentWeekStart = getStartOfWeek(new Date());

function updateDateTime() {
  const now = new Date();
  dateTime.textContent = now.toLocaleString();
}
setInterval(updateDateTime, 1000);
updateDateTime();

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function saveHistory() {
  localStorage.setItem("yearlyHistory", JSON.stringify(yearlyHistory));
}

function addTask() {
  const taskText = taskInput.value.trim();
  if (taskText === "") return;
  tasks.push({ text: taskText, completed: false });
  taskInput.value = "";
  saveTasks();
  renderTasks();
}

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  renderTasks();
}

function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.textContent = task.text;
    if (task.completed) li.classList.add("completed");
    li.onclick = () => toggleTask(index);
    taskList.appendChild(li);
  });
  updateProgress();
}

function updateProgress() {
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  progressFill.style.width = percent + "%";
  progressText.textContent = percent + "%";
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function getWeekKey(date) {
  const year = date.getFullYear();
  const weekStart = getStartOfWeek(date);
  return `${year}-${weekStart.getMonth()+1}-${weekStart.getDate()}`;
}

function resetForNewDay() {
  const today = new Date();
  const weekKey = getWeekKey(today);
  const dayName = today.toLocaleString("en-us", { weekday: "long" });
  const percent = parseInt(progressText.textContent);

  if (!yearlyHistory[weekKey]) yearlyHistory[weekKey] = {};
  yearlyHistory[weekKey][dayName] = percent;

  saveHistory();
  tasks = [];
  saveTasks();
  renderTasks();
  updateChart();
}

function getWeekDays(startDate) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function updateChart() {
  const ctx = document.getElementById("weeklyChart").getContext("2d");
  const weekKey = getWeekKey(currentWeekStart);
  const thisWeek = yearlyHistory[weekKey] || {};

  const weekDays = getWeekDays(currentWeekStart);
  const labels = weekDays.map(d => d.toLocaleString("en-us", { weekday: "short" }));
  const todayName = new Date().toLocaleString("en-us", { weekday: "long" });
  const data = weekDays.map(d => thisWeek[d.toLocaleString("en-us", { weekday: "long" })] || 0);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Completion %",
        data,
        backgroundColor: labels.map(l =>
          l === todayName.slice(0, 3)
            ? "rgba(255, 215, 0, 0.9)"
            : "rgba(0, 242, 96, 0.7)"
        ),
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
        x: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.parsed.y}% completed`
          }
        },
        datalabels: {
          color: "#fff",
          anchor: "end",
          align: "top",
          formatter: val => val + "%",
        },
      },
      animation: { duration: 1500, easing: "easeOutBounce" },
    },
  });

  const avg = data.reduce((a,b) => a + b, 0) / 7;
  weeklyAverageText.textContent = `Average: ${Math.round(avg)}%`;
  const start = weekDays[0].toLocaleDateString();
  const end = weekDays[6].toLocaleDateString();
  weekRange.textContent = `${start} - ${end}`;
}

function prevWeek() {
  currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  updateChart();
}

function nextWeek() {
  currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  updateChart();
}

function downloadChart() {
  const link = document.createElement("a");
  link.download = "Weekly_Report.png";
  link.href = document.getElementById("weeklyChart").toDataURL("image/png");
  link.click();
}

renderTasks();
updateChart();
