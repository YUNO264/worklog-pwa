// ========================================
// 画面部品
// ========================================
const buttonArea =
    document.getElementById("button-area");

const settingsButton =
    document.getElementById("settings-button");

const settingsScreen =
    document.getElementById("settings-screen");

const settingsCloseButton =
    document.getElementById("settings-close-button");

const actionSettingsList =
    document.getElementById("action-settings-list");

const newActionName =
    document.getElementById("new-action-name");

const addActionButton =
    document.getElementById("add-action-button");
const selectedAction = document.getElementById("selected-action");
const currentTime = document.getElementById("current-time");
const recordButton = document.getElementById("record-button");
const historyList = document.getElementById("history-list");
const csvButton = document.getElementById("csv-button");
const undoButton =document.getElementById("undo-button");

function initializeActions() {

    const transaction =
        db.transaction(
            ACTION_STORE_NAME,
            "readonly"
        );

    const store =
        transaction.objectStore(
            ACTION_STORE_NAME
        );

    const request =
        store.count();


    request.onsuccess = function() {

        if (request.result === 0) {

            createDefaultActions();

        } else {

            loadActionButtons();

        }
    };
}

function createDefaultActions() {

    const defaultActions = [
        "現場確認",
        "設備対応",
        "改善活動",
        "会議",
        "資料作成",
        "メール",
        "データ分析",
        "その他"
    ];


    const transaction =
        db.transaction(
            ACTION_STORE_NAME,
            "readwrite"
        );


    const store =
        transaction.objectStore(
            ACTION_STORE_NAME
        );


    defaultActions.forEach(
        function(actionName) {

            store.add({
                name: actionName
            });

        }
    );


    transaction.oncomplete =
        function() {

            loadActionButtons();

        };
}

function loadActionButtons() {

    const transaction =
        db.transaction(
            ACTION_STORE_NAME,
            "readonly"
        );


    const store =
        transaction.objectStore(
            ACTION_STORE_NAME
        );


    const request =
        store.getAll();


    request.onsuccess = function() {

        const actions =
            request.result;

        buttonArea.innerHTML = "";


        actions.forEach(
            function(action) {

                const button =
                    document.createElement(
                        "button"
                    );


                button.classList.add(
                    "action-button"
                );


                button.textContent =
                    action.name;


                button.addEventListener(
                    "click",
                    function() {

                        selectAction(
                            button,
                            action.name
                        );

                    }
                );


                buttonArea.appendChild(
                    button
                );

            }
        );
    };
}

// ========================================
// 選択中の行動
// ========================================

let selectedActionName = "";


// ========================================
// IndexedDB設定
// ========================================

const DB_NAME = "WorkLogDB";
const DB_VERSION = 2;

const STORE_NAME = "workLogs";
const ACTION_STORE_NAME = "actions";

let db;


// ========================================
// IndexedDBを開く
// ========================================

function openDatabase() {

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // 初回作成時
    request.onupgradeneeded = function(event) {

        db = event.target.result;


        // ============================
        // 行動記録保存場所
        // ============================

        if (!db.objectStoreNames.contains(STORE_NAME)) {

            const store =
                db.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id",
                        autoIncrement: true
                    }
                );

            store.createIndex(
                "date",
                "date",
                {
                    unique: false
                }
            );
        }


        // ============================
        // 行動項目保存場所
        // ============================

        if (!db.objectStoreNames.contains(ACTION_STORE_NAME)) {

            db.createObjectStore(
                ACTION_STORE_NAME,
                {
                    keyPath: "id",
                    autoIncrement: true
                }
            );
        }
    };


    // DBを正常に開けた時
    request.onsuccess = function(event) {

        db =
            event.target.result;


        console.log(
            "IndexedDBを開きました"
        );


        initializeActions();

        loadHistory();
    };


    // DBを開けなかった時
    request.onerror = function(event) {

        console.error(
            "IndexedDBエラー",
            event.target.error
        );

        alert("データベースを開けませんでした。");
    };
}


// ========================================
// 現在時刻表示
// ========================================

function updateClock() {

    const now = new Date();

    const hours = String(
        now.getHours()
    ).padStart(2, "0");

    const minutes = String(
        now.getMinutes()
    ).padStart(2, "0");

    const seconds = String(
        now.getSeconds()
    ).padStart(2, "0");

    currentTime.textContent =
        hours + ":" + minutes + ":" + seconds;
}


updateClock();

setInterval(updateClock, 1000);


// ========================================
// 行動ボタン
// ========================================

function selectAction(button, actionName) {

    const buttons =
        document.querySelectorAll(
            ".action-button"
        );


    buttons.forEach(
        function(btn) {

            btn.classList.remove(
                "selected"
            );

        }
    );


    button.classList.add(
        "selected"
    );


    selectedActionName =
        actionName;


    selectedAction.textContent =
        actionName;
}


// ========================================
// 記録ボタン
// ========================================

recordButton.addEventListener(
    "click",
    function() {

        if (selectedActionName === "") {

            alert(
                "行動を選択してください。"
            );

            return;
        }


        const now = new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                now.getDate()
            ).padStart(2, "0");

        const hours =
            String(
                now.getHours()
            ).padStart(2, "0");

        const minutes =
            String(
                now.getMinutes()
            ).padStart(2, "0");

        const seconds =
            String(
                now.getSeconds()
            ).padStart(2, "0");


        const date =
            year +
            "-" +
            month +
            "-" +
            day;


        const time =
            hours +
            ":" +
            minutes +
            ":" +
            seconds;


        // 保存するデータ
        const logData = {

            date: date,

            time: time,

            action:
                selectedActionName,

            timestamp:
                now.getTime()
        };


        // IndexedDBへ保存
        saveLog(logData);
    }
);


// ========================================
// IndexedDBへ1件保存
// ========================================

function saveLog(logData) {

    const transaction =
        db.transaction(
            STORE_NAME,
            "readwrite"
        );


    const store =
        transaction.objectStore(
            STORE_NAME
        );


    const request =
        store.add(logData);


    request.onsuccess =
        function() {

            console.log(
                "保存しました",
                logData
            );

            clearSelection();

            // 履歴を再読み込み
            loadHistory();
        };


    request.onerror =
        function(event) {

            console.error(
                "保存エラー",
                event.target.error
            );

            alert(
                "記録の保存に失敗しました。"
            );
        };
}

function clearSelection() {

    selectedActionName = "";

    selectedAction.textContent =
        "未選択";


    const buttons =
        document.querySelectorAll(
            ".action-button"
        );


    buttons.forEach(
        function(button) {

            button.classList.remove(
                "selected"
            );

        }
    );
}

settingsButton.addEventListener(
    "click",
    function() {

        settingsScreen.classList.remove(
            "hidden"
        );

        loadActionSettings();

    }
);
settingsCloseButton.addEventListener(
    "click",
    function() {

        settingsScreen.classList.add(
            "hidden"
        );

        loadActionButtons();

    }
);

function loadActionSettings() {

    const transaction =
        db.transaction(
            ACTION_STORE_NAME,
            "readonly"
        );


    const store =
        transaction.objectStore(
            ACTION_STORE_NAME
        );


    const request =
        store.getAll();


    request.onsuccess =
        function() {

            const actions =
                request.result;


            actionSettingsList.innerHTML =
                "";


            actions.forEach(
                function(action) {

                    createActionSettingItem(
                        action
                    );

                }
            );
        };
}

function createActionSettingItem(action) {

    const row =
        document.createElement(
            "div"
        );


    row.classList.add(
        "action-setting-item"
    );


    const input =
        document.createElement(
            "input"
        );


    input.type =
        "text";


    input.value =
        action.name;


    input.classList.add(
        "action-setting-input"
    );


    const saveButton =
        document.createElement(
            "button"
        );


    saveButton.textContent =
        "変更";


    saveButton.classList.add(
        "action-save-button"
    );


    saveButton.addEventListener(
        "click",
        function() {

            updateAction(
                action.id,
                input.value
            );

        }
    );


    const deleteButton =
        document.createElement(
            "button"
        );


    deleteButton.textContent =
        "削除";


    deleteButton.classList.add(
        "action-delete-button"
    );


    deleteButton.addEventListener(
        "click",
        function() {

            deleteAction(
                action.id
            );

        }
    );


    row.appendChild(
        input
    );


    row.appendChild(
        saveButton
    );


    row.appendChild(
        deleteButton
    );


    actionSettingsList.appendChild(
        row
    );
}

addActionButton.addEventListener(
    "click",
    function() {

        const name =
            newActionName.value.trim();


        if (name === "") {

            alert(
                "行動項目名を入力してください。"
            );

            return;
        }


        addAction(name);

    }
);

function addAction(name) {

    const transaction =
        db.transaction(
            ACTION_STORE_NAME,
            "readwrite"
        );


    const store =
        transaction.objectStore(
            ACTION_STORE_NAME
        );


    store.add({
        name: name
    });


    transaction.oncomplete =
        function() {

            newActionName.value =
                "";

            loadActionSettings();

        };
}

function updateAction(id, newName) {

    const name =
        newName.trim();


    if (name === "") {

        alert(
            "行動項目名を入力してください。"
        );

        return;
    }


    const transaction =
        db.transaction(
            ACTION_STORE_NAME,
            "readwrite"
        );


    const store =
        transaction.objectStore(
            ACTION_STORE_NAME
        );


    const request =
        store.get(id);


    request.onsuccess =
        function() {

            const action =
                request.result;


            action.name =
                name;


            store.put(
                action
            );

        };


    transaction.oncomplete =
        function() {

            loadActionSettings();

        };
}

function deleteAction(id) {

    const result =
        confirm(
            "この行動項目を削除しますか？"
        );


    if (!result) {

        return;
    }


    const transaction =
        db.transaction(
            ACTION_STORE_NAME,
            "readwrite"
        );


    const store =
        transaction.objectStore(
            ACTION_STORE_NAME
        );


    store.delete(id);


    transaction.oncomplete =
        function() {

            loadActionSettings();

        };
}

// ========================================
// 保存済み履歴を読み込む
// ========================================

function loadHistory() {

    const transaction =
        db.transaction(
            STORE_NAME,
            "readonly"
        );


    const store =
        transaction.objectStore(
            STORE_NAME
        );


    const request =
        store.getAll();


    request.onsuccess =
        function() {

            const logs =
                request.result;

            const todaylogs =
                getTodayLogs(logs);

            displayHistory(todaylogs);
        };


    request.onerror =
        function(event) {

            console.error(
                "読み込みエラー",
                event.target.error
            );
        };
}

function getTodayLogs(logs) {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");

    const today =
        year +
        "-" +
        month +
        "-" +
        day;


    return logs.filter(
        function(log) {

            return (
                log.date === today
            );
        }
    );
}

// ========================================
// 履歴表示
// ========================================

function displayHistory(logs) {

    historyList.innerHTML = "";


    if (logs.length === 0) {

        historyList.innerHTML =
            "<p>まだ記録はありません。</p>";

        return;
    }


    logs.sort(
        function(a, b) {

            return (
                b.timestamp -
                a.timestamp
            );
        }
    );


    logs.forEach(
        function(log) {

            const historyItem =
                document.createElement(
                    "div"
                );

            historyItem.classList.add(
                "history-item"
            );


            const historyText =
                document.createElement(
                    "div"
                );

            historyText.classList.add(
                "history-text"
            );

            historyText.textContent =
                log.time +
                "　" +
                log.action;


            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.textContent =
                "削除";

            deleteButton.classList.add(
                "delete-button"
            );


            deleteButton.addEventListener(
                "click",
                function() {

                    deleteLog(
                        log.id
                    );
                }
            );


            historyItem.appendChild(
                historyText
            );

            historyItem.appendChild(
                deleteButton
            );

            historyList.appendChild(
                historyItem
            );
        }
    );
}

function deleteLog(id) {

    const result =
        confirm(
            "この記録を削除しますか？"
        );

    if (!result) {

        return;
    }


    const transaction =
        db.transaction(
            STORE_NAME,
            "readwrite"
        );


    const store =
        transaction.objectStore(
            STORE_NAME
        );


    const request =
        store.delete(id);


    request.onsuccess =
        function() {

            console.log(
                "削除しました ID:",
                id
            );

            loadHistory();
        };


    request.onerror =
        function(event) {

            console.error(
                "削除エラー",
                event.target.error
            );

            alert(
                "削除に失敗しました。"
            );
        };
}

// ========================================
// 直前の記録を取り消すボタン
// ========================================
undoButton.addEventListener(
    "click",
    function() {

        undoLastLog();
    }
);

function undoLastLog() {

    if (!db) {

        return;
    }


    const transaction =
        db.transaction(
            STORE_NAME,
            "readonly"
        );


    const store =
        transaction.objectStore(
            STORE_NAME
        );


    const request =
        store.getAll();


    request.onsuccess =
        function() {

            const logs =
                request.result;


            const todayLogs =
                getTodayLogs(logs);


            if (
                todayLogs.length === 0
            ) {

                alert(
                    "取り消す記録がありません。"
                );

                return;
            }


            todayLogs.sort(
                function(a, b) {

                    return (
                        b.timestamp -
                        a.timestamp
                    );
                }
            );


            const lastLog =
                todayLogs[0];


            const result =
                confirm(
                    "直前の記録\n\n" +
                    lastLog.time +
                    " " +
                    lastLog.action +
                    "\n\nを取り消しますか？"
                );


            if (!result) {

                return;
            }


            deleteLogDirect(
                lastLog.id
            );
        };
}

function deleteLogDirect(id) {

    const transaction =
        db.transaction(
            STORE_NAME,
            "readwrite"
        );


    const store =
        transaction.objectStore(
            STORE_NAME
        );


    const request =
        store.delete(id);


    request.onsuccess =
        function() {

            loadHistory();
        };


    request.onerror =
        function(event) {

            console.error(
                "取り消しエラー",
                event.target.error
            );

            alert(
                "取り消しに失敗しました。"
            );
        };
}

// ========================================
// CSV出力
// ========================================

csvButton.addEventListener("click", function() {

    if (!db) {
        alert("データベースの準備ができていません。");
        return;
    }

    const transaction =
        db.transaction(
            STORE_NAME,
            "readonly"
        );

    const store =
        transaction.objectStore(
            STORE_NAME
        );

    const request =
        store.getAll();


    request.onsuccess = function() {

        const logs =
            request.result;


        if (logs.length === 0) {

            alert(
                "出力する記録がありません。"
            );

            return;
        }


        createCSV(logs);
    };


    request.onerror = function(event) {

        console.error(
            "CSV用データ読み込みエラー",
            event.target.error
        );

        alert(
            "データの読み込みに失敗しました。"
        );
    };

});


// ========================================
// CSVファイルを作成
// ========================================

function createCSV(logs) {

    // 日時の古い順に並べる
    logs.sort(
        function(a, b) {

            return (
                a.timestamp -
                b.timestamp
            );
        }
    );


    // CSVの先頭行
    let csv =
        "Date,Time,Action\r\n";


    // データを1行ずつ追加
    logs.forEach(
        function(log) {

            csv +=
                escapeCSV(log.date) +
                "," +
                escapeCSV(log.time) +
                "," +
                escapeCSV(log.action) +
                "\r\n";
        }
    );


    // Excelで文字化けしにくくするためUTF-8 BOMを追加
    const bom =
        "\uFEFF";


    const blob =
        new Blob(
            [
                bom + csv
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    // ファイル名用の日付
    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const fileName =
        "WorkLog_" +
        year +
        "-" +
        month +
        "-" +
        day +
        ".csv";


    // ダウンロード用URLを作る
    const url =
        URL.createObjectURL(
            blob
        );


    // 一時的なリンクを作る
    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;

    link.download =
        fileName;


    // 自動クリック
    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );


    // 一時URLを解放
    URL.revokeObjectURL(
        url
    );
}


// ========================================
// CSV用文字処理
// ========================================

function escapeCSV(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    let text =
        String(value);


    // " を "" に変換
    text =
        text.replace(
            /"/g,
            '""'
        );


    // 必ずダブルクォーテーションで囲む
    return (
        '"' +
        text +
        '"'
    );
}

// ========================================
// アプリ起動
// ========================================

openDatabase();

// ========================================
// Service Worker登録
// ========================================

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        function() {

            navigator.serviceWorker
                .register("./service-worker.js")

                .then(function(registration) {

                    console.log(
                        "Service Worker登録成功",
                        registration
                    );

                })

                .catch(function(error) {

                    console.error(
                        "Service Worker登録失敗",
                        error
                    );

                });

        }
    );
}