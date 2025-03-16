document.addEventListener("DOMContentLoaded", function () {
    const dateElement = document.getElementById("date");
    const jihoButton = document.getElementById("jiho");
    const soyeolButton = document.getElementById("soyeol");
    const taskList = document.getElementById("taskList");
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    
    // Firebase 구성 - 인라인으로 포함
    const firebaseConfig = {
        apiKey: "AIzaSyBvPubtp1RgwRmRghto_4qCh-UJ3QrzooM",
        authDomain: "alimi-5eef5.firebaseapp.com",
        projectId: "alimi-5eef5",
        storageBucket: "alimi-5eef5.appspot.com",
        messagingSenderId: "102026935593",
        appId: "1:102026935593:web:7de57bc2e464bd328f4b38"
    };
    
    // Firebase 초기화 (필요한 경우)
    let messaging = null;
    let db = null;
    
    // FCM을 지원하고 Firebase가 로드되었는지 확인
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        
        // FCM 사용 가능하면 초기화
        if (firebase.messaging && 'serviceWorker' in navigator) {
            messaging = firebase.messaging();
            db = firebase.firestore();
            initializeFCM();
        }
    }
    
    // FCM 초기화 함수
    function initializeFCM() {
        // 서비스 워커 등록
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then((registration) => {
                // FCM 설정
                messaging.useServiceWorker(registration);
                
                // 알림 권한 요청
                requestNotificationPermission();
            })
            .catch((err) => {
                console.error('서비스 워커 등록 실패:', err);
            });
    }
    
    // 알림 권한 요청 함수
    function requestNotificationPermission() {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                console.log('알림 권한이 허용되었습니다.');
                
                // FCM을 사용할 수 있으면 토큰 가져오기
                if (messaging) {
                    messaging.getToken()
                        .then((token) => {
                            if (token) {
                                console.log('FCM 토큰:', token);
                                saveFCMTokenToFirestore(token);
                            } else {
                                console.log('토큰을 가져올 수 없습니다.');
                            }
                        })
                        .catch((err) => {
                            console.error('FCM 토큰 가져오기 실패:', err);
                        });
                        
                    // 메시지 수신 처리
                    messaging.onMessage((payload) => {
                        console.log('메시지 수신됨:', payload);
                        handleFCMMessage(payload);
                    });
                }
            } else {
                console.log('알림 권한이 거부되었습니다.');
            }
        });
    }
    
    // FCM 토큰을 Firestore에 저장
    function saveFCMTokenToFirestore(token) {
        // Firestore가 사용 가능한 경우에만 저장
        if (db && currentUser) {
            db.collection("users").doc(currentUser).set({
                fcmToken: token,
                lastUpdated: new Date()
            }, { merge: true })
            .then(() => {
                console.log("FCM 토큰이 저장되었습니다.");
            })
            .catch((error) => {
                console.error("토큰 저장 중 오류:", error);
            });
        } else {
            // 아직 사용자가 선택되지 않았다면 로컬에 임시 저장
            localStorage.setItem("fcmToken", token);
        }
    }
    
    // FCM 메시지 처리
    function handleFCMMessage(payload) {
        const notificationTitle = payload.notification?.title || "학습 체크 알림";
        const notificationOptions = {
            body: payload.notification?.body || payload.data?.message || "새로운 알림이 있습니다.",
            icon: '/favicon.ico'
        };
        
        // 브라우저 알림 표시
        new Notification(notificationTitle, notificationOptions);
    }
    
    // 오늘 날짜 가져오기
    const today = new Date().toISOString().split("T")[0];
    dateElement.innerText = `오늘 날짜: ${today}`;
    
    let currentUser = null;
    let completedTasks = {};
    
    // 사용자 선택
    function selectUser(name) {
        currentUser = name;
        
        // FCM 토큰이 있고 Firestore가 사용 가능하면 저장
        const savedToken = localStorage.getItem("fcmToken");
        if (savedToken && db) {
            saveFCMTokenToFirestore(savedToken);
            localStorage.removeItem("fcmToken");
        }
        
        document.querySelector(".user-btns").style.display = "none"; 
        taskList.style.display = "block"; 
        
        // 날짜가 바뀌면 체크 초기화
        const savedDate = localStorage.getItem("savedDate");
        if (savedDate !== today) {
            // 날짜 관련 데이터만 초기화
            for (let i = 0; i < checkboxes.length; i++) {
                localStorage.removeItem(`${currentUser}-task${i+1}`);
            }
            localStorage.setItem("savedDate", today);
        }
        
        // 저장된 체크 상태 불러오기
        checkboxes.forEach((checkbox, index) => {
            const checked = localStorage.getItem(`${currentUser}-task${index+1}`);
            checkbox.checked = checked === "true";
        });
        
        // 완료된 항목 수 계산
        completedTasks[currentUser] = Array.from(checkboxes).filter(cb => cb.checked).length;
    }
    
    // 체크박스 클릭 시 처리
    function handleCheckboxClick(event) {
        if (!currentUser) return; // 사용자가 선택되지 않았으면 무시
        
        const taskName = event.target.parentNode.querySelector("span").innerText;
        const isChecked = event.target.checked;
        const taskId = event.target.id;
        
        // 체크 상태 저장
        localStorage.setItem(`${currentUser}-${taskId}`, isChecked);
        
        // 완료된 개수 카운트
        completedTasks[currentUser] = Array.from(checkboxes).filter(cb => cb.checked).length;
        
        // 알림 메시지
        const message = `${currentUser}님이 ${taskName}을(를) ${isChecked ? '완료' : '취소'}했어요! (${completedTasks[currentUser]}/${checkboxes.length})`;
        
        // FCM이 초기화되었고 체크된 경우에만 Firestore에 데이터 저장
        if (db && isChecked) {
            // Firestore에 진행 상황 저장
            db.collection("taskProgress").add({
                user: currentUser,
                task: taskName,
                completed: isChecked,
                timestamp: new Date(),
                completedCount: completedTasks[currentUser],
                totalTasks: checkboxes.length
            })
            .then((docRef) => {
                console.log("진행 상황 저장됨, ID:", docRef.id);
                
                // 알림 데이터 저장
                return db.collection("notifications").add({
                    user: currentUser,
                    message: message,
                    timestamp: new Date(),
                    read: false
                });
            })
            .then(() => {
                console.log("알림 데이터 저장됨");
            })
            .catch((error) => {
                console.error("데이터 저장 중 오류:", error);
                // Firebase에 저장 실패해도 로컬 알림은 표시
                sendNotification(message);
            });
        } else if (isChecked) {
            // Firebase를 사용할 수 없는 경우 브라우저 알림 사용
            sendNotification(message);
        }
    }
    
    // 브라우저 알림 보내기 (FCM 실패 시 폴백)
    function sendNotification(message) {
        if (Notification.permission === "granted") {
            new Notification("학습 체크 알림", { body: message });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("학습 체크 알림", { body: message });
                }
            });
        }
    }
    
    // 버튼 클릭 이벤트
    jihoButton.addEventListener("click", function() {
        selectUser("지호");
    });
    
    soyeolButton.addEventListener("click", function() {
        selectUser("소율");
    });
    
    // 체크박스 클릭 이벤트
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener("change", handleCheckboxClick);
    });
});
