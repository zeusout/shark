import { db, collection, doc, setDoc, getDocs } from "./firebase.js";

let currentUser = null;

// 날짜 표시
const today = new Date().toISOString().split('T')[0];
document.getElementById('date').innerText = `오늘 날짜: ${today}`;

window.selectUser = function(name) {
    currentUser = name;
    document.getElementById('userSelect').style.display = 'none';
    document.getElementById('taskList').style.display = 'block';
    loadTasks();
};

async function loadTasks() {
    if (!currentUser) return;

    const taskCollection = collection(db, "users", currentUser, "tasks");
    const snapshot = await getDocs(taskCollection);

    snapshot.forEach(doc => {
        const task = doc.id;
        const checked = doc.data().completed;
        document.getElementById(task).checked = checked;
    });
}

document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', async function() {
        if (!currentUser) return;

        const taskId = this.id;
        const isChecked = this.checked;

        await setDoc(doc(db, "users", currentUser, "tasks", taskId), {
            completed: isChecked,
            date: today
        });

        showNotification(`${currentUser}님이 ${this.parentElement.innerText.trim()}를 완료했어요!`);
    });
});

function showNotification(message) {
    if (Notification.permission === "granted") {
        new Notification(message);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(message);
            }
        });
    }
}
