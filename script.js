import { db, doc, setDoc, requestNotificationPermission } from './firebase.js';

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
    let fcmToken = null;
    
    // FCM 토큰 초기화 시도
    async function initializeFCM() {
        fcmToken = await requestNotificationPermission();
    }
    
    // 페이지 로드 시 FCM 초기화
    initializeFCM();
    
    // 사용자 선택
    function selectUser(name) {
        currentUser = name;
        localStorage.setItem("currentUser", name); // 현재 사용자 저장
        document.querySelector(".user-btns").style.display = "none"; 
        taskList.style.display = "block"; 
        
        // 날짜가 바뀌면 체크 초기화
        const savedDate = localStorage.getItem("savedDate");
        if (savedDate !== today) {
            // 로컬 스토리지 날짜 관련 데이터만 초기화
            localStorage.removeItem("savedDate");
            checkboxes.forEach((checkbox, index) => {
                localStorage.removeItem(`${currentUser}-task${index}`);
            });
            localStorage.setItem("savedDate", today);
        }
        
        // 저장된 체크 상태 불러오기
        checkboxes.forEach((checkbox, index) => {
            const checked = localStorage.getItem(`${currentUser}-task${index}`);
            checkbox.checked = checked === "true";
        });
    }
    
    // 체크박스 클릭 시 Firestore에 데이터 저장 및 FCM 알림 요청
    async function handleCheckboxClick(event) {
        if (!currentUser) return; // 사용자가 선택되지 않았으면 무시
        
        const taskName = event.target.parentNode.querySelector("span").innerText;
        const isChecked = event.target.checked;
        const taskIndex = Array.from(checkboxes).indexOf(event.target);
        
        // 체크 상태 로컬에 저장
        localStorage.setItem(`${currentUser}-task${taskIndex}`, isChecked);
        
        // 완료된 개수 카운트
        completedTasks[currentUser] = Array.from(checkboxes).filter(cb => cb.checked).length;
        
        // Firestore에 사용자 진행 상황 저장
        try {
            const taskData = {
                date: today,
                user: currentUser,
                task: taskName,
                completed: isChecked,
                completedAt: isChecked ? new Date().toISOString() : null,
                completedCount: completedTasks[currentUser],
                totalTasks: checkboxes.length
            };
            
            // Firestore에 진행 상황 저장
            await setDoc(doc(db, "taskProgress", `${today}_${currentUser}_${taskIndex}`), taskData);
            
            // Cloud Functions가 FCM을 처리하도록 별도의 컬렉션에 알림 요청 저장
            if (isChecked) {
                const notificationData = {
                    user: currentUser,
                    message: `${currentUser}님이 ${taskName}을(를) 완료했어요! (${completedTasks[currentUser]}/${checkboxes.length})`,
                    timestamp: new Date().toISOString(),
                    read: false
                };
                
                await setDoc(doc(db, "notifications", `${today}_${currentUser}_${taskIndex}`), notificationData);
                console.log("알림 데이터가 Firestore에 저장되었습니다");
            }
        } catch (error) {
            console.error("Firestore에 데이터 저장 중 오류 발생:", error);
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
