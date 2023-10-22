if (localStorage.getItem('attendable_codes')) {
    document.querySelector('#textarea_attendance_codes').value = localStorage.getItem('attendable_codes');
}

// QRコードのタイムスタンプと学修番号をエンコーダーに渡して
// デコードされた文字列を取得する
function encodeMyCode() {
    if (document.querySelector('#attendance_code').value == '') {
        alert("出席コードを貼り付けてください\nPaste your attendance code.")
        return;
    }
    const param = {
        type: 'check',
        encoded_text: document.querySelector('#attendance_code').value
    };

    fetch('EncodeDecode.php', { // 第1引数に送り先
        method: 'POST', // メソッド指定
        headers: { 'Content-Type': 'application/json' }, // jsonを指定
        body: JSON.stringify(param) // json形式に変換して添付
    })
        .then(response => response.json()) // 返ってきたレスポンスをjsonで受け取って次のthenへ渡す
        .then(res => {
            //console.log(res); // 返ってきたデータ
            if (res.message == "Success") {
                var results = res.decoded_text.split(',');
                let timestamp = new Date(results[0] * 1000).toLocaleString({ timeZone: 'Asia/Tokyo' });
                //console.log(results[1]);
                document.querySelector('#timestamp').innerHTML = String(timestamp);
                document.querySelector('#classname').innerHTML = String(decodeURIComponent(results[1]));
                document.querySelector('#encoded_id').innerHTML = String(results[2]);
            }
            else {
                alert(res.message);
            }
        });
}

/**
* Checkerボタンを押してOKだった出席コードをログ扱いのtextareaに一時保存して、localStorageに保存する
*/
function addAttendanceCode(dom) {

    if (document.querySelector('#attendance_code').value == '') {
        alert('出席コードが入力されていません');
        return;
    }
    // 現在の出席コードをtextareaに追加
    document.querySelector('#textarea_attendance_codes').value += document.querySelector('#attendance_code').value + '\n';
    localStorage.setItem('attendable_codes', document.querySelector('#textarea_attendance_codes').value);
}


function saveCodesToLocalStorage() {
    let text = document.querySelector('#textarea_attendance_codes').value;
    localStorage.setItem('attendable_codes', text);
}

function downloadTxt() {
    const element = document.createElement('a');
    const text = document.getElementById('textarea_attendance_codes').value;
    const filename = 'attendance_codes.txt';

    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}



function shareTxt() {
    if (navigator.share) {
        navigator.share({
            title: 'デザインと生活出席',
            text: document.getElementById('textarea_attendance_codes').value
        })
            .then(() => console.log('共有が完了しました'))
            .catch(error => console.error('共有に失敗しました:', error));
    } else {
        console.error('このブラウザではシェア機能がサポートされていません');
    }
}

