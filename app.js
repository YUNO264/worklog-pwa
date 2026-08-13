// ========================================
// 画面部品
// ========================================

const actionButtons = document.querySelectorAll(".action-button");
const selectedAction = document.getElementById("selected-action");
const currentTime = document.getElementById("current-time");
const recordButton = document.getElementById("record-button");
const historyList = document.getElementById("history-list");
const csvButton = document.getElementById("csv-button");
const undoButton =document.getElementById("undo-button");

// ========================================
// 選択中の行動
// ========================================

let selectedActionName = "";


// ========================================
// IndexedDB設定
// ========================================

const DB_NAME = "WorkLogDB";
const DB_VERSION = 1;
const STORE_NAME = "workLogs";

let db;


// ========================================
// IndexedDBを開く
// ========================================

function openDatabase() {

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // 初回作成時
    request.onupgradeneeded = function(event) {

        db = event.target.result;

        // workLogsという保存場所がまだなければ作る
        if (!db.objectStoreNames.contains(STORE_NAME)) {

            const store = db.createObjectStore(
                STORE_NAME,
                {
                    keyPath: "id",
                    autoIncrement: true
                }
            );

            // 日付で検索できるようにする
            store.createIndex(
                "date",
                "date",
                {
                    unique: false
                }
            );
        }
    };


    // DBを正常に開けた時
    request.onsuccess = function(event) {

        db = event.target.result;

        console.log("IndexedDBを開きました");

        // 保存済み履歴を読み込む
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

actionButtons.forEach(function(button) {

    button.addEventListener(
        "click",
        function() {

            actionButtons.forEach(
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
                button.textContent.trim();

            selectedAction.textContent =
                selectedActionName;
        }
    );
});


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

    actionButtons.forEach(
        function(button) {

            button.classList.remove(
                "selected"
            );
        }
    );
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