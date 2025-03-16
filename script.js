document.addEventListener("DOMContentLoaded", function () {
    const dateElement = document.getElementById("date");
    const jihoButton = document.getElementById("jiho");
    const soyeolButton = document.getElementById("soyeol");
    const taskList = document.getElementById("taskList");
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    
    // 오늘 날짜 가져오기
    const today = new Date().toISOString().split("T")[0];
    dateElement.innerText = `오늘 날짜: ${today}`;
    
    let currentUser = null;
    let completedTasks = {};

    // 사용자 선택
    function selectUser(name) {
        currentUser = name;
        document.querySelector(".user-btns").style.display = "none"; 
        taskList.style.display = "block"; 
        
        // 날짜가 바뀌면 체크 초기화
        const savedDate = localStorage.getItem("savedDate");
        if (savedDate !== today) {
            localStorage.clear();
            localStorage.setItem("savedDate", today);
        }

        // 저장된 체크 상태 불러오기
        checkboxes.forEach((checkbox, index) => {
            const checked = localStorage.getItem(`${currentUser}-task${index}`);
            checkbox.checked = checked === "true";
        });

        // 알림 권한 요청
        if (Notification.permission !== "granted") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("알림 권한이 허용되었습니다.");
                }
            });
        }
    }

    // 체크박스 클릭 시 알림 전송
    function handleCheckboxClick(event) {
        if (!currentUser) return; // 사용자가 선택되지 않았으면 무시
        
        const taskName = event.target.parentNode.querySelector("span").innerText;
        const isChecked = event.target.checked;

        // 체크 상태 저장
        localStorage.setItem(`${currentUser}-task${Array.from(checkboxes).indexOf(event.target)}`, isChecked);

        // 완료된 개수 카운트
        completedTasks[currentUser] = checkboxes.length 
            ? Array.from(checkboxes).filter(cb => cb.checked).length 
            : 0;

        // 알림 전송 (체크하면 보냄, 해제하면 안 보냄)
        if (isChecked) {
            sendNotification(`${currentUser}님이 ${taskName}을(를) 완료했어요! (${completedTasks[currentUser]}/${checkboxes.length})`);
        }
    }

    // 브라우저 알림 보내기
    function sendNotification(message) {
        if (Notification.permission === "granted") {
            new Notification("학습 체크 알림", { body: message });
        }
    }

    // 버튼 클릭 이벤트
    jihoButton.addEventListener("click", () => selectUser("지호"));
    soyeolButton.addEventListener("click", () => selectUser("소율"));

    // 체크박스 클릭 이벤트
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", handleCheckboxClick);
    });
});