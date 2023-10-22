// https://support.createwebflow.jp/manual/files/v5/reverse/reverse/workflow_design/form/form_half-character-only.html
function checkChar(elm) {
    var txt = elm.value;
    for (i = 0; i < txt.length; i++) {
        if (escape(txt.charAt(i)).length >= 4) {
            alert("半角英数字のみ");
            elm.value = "";
            break;
        }
    }
}


function copyAttendanceCode() {
    var copy_text = document.querySelector("#input_attendance_code");
    copy_text.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    document.querySelector('#button_copy_attendance_code').innerHTML = "COPIED";
    document.querySelector('#button_copy_attendance_code').classList = "btn btn-success";
    setTimeout(function () {
        document.querySelector('#button_copy_attendance_code').innerHTML = "COPY";
        document.querySelector('#button_copy_attendance_code').classList = "btn btn-outline-secondary";
    }, 1000);
}
// QRコードのタイムスタンプと学修番号をエンコーダーに渡して
// デコードされた文字列を取得する
function getEncodedString(timestamp, classname, id) {
    console.log("getEncodedString");
    const param = {
        type: 'registration',
        timestamp: timestamp, // タイムスタンプは暗号化されているが、そのまま送信
        id: id,
        classname: classname
    };

    console.log(param);
    fetch('EncodeDecode.php', { // 第1引数に送り先
        method: 'POST', // メソッド指定
        headers: { 'Content-Type': 'application/json' }, // jsonを指定
        body: JSON.stringify(param) // json形式に変換して添付
    })
        .then(response => response.json()) // 返ってきたレスポンスをjsonで受け取って次のthenへ渡す
        .then(res => {
            console.log(res); // 返ってきたデータ
            // 取得した出席コードをDOMにいれる
            if (res.message == 'Success') {
                // alert背景をsuccessに
                document.querySelector('#input_attendance_code').value = res.encoded_text;
                document.querySelector('#alert').classList = 'alert alert-success';
                document.querySelector('#attendance_code').value = res.encoded_text;
                copyAttendanceCode();
            }
            else {
                // alert背景をdangerに
                document.querySelector('#input_attendance_code').value = res.message;
                document.querySelector('#alert').classList = 'alert alert-danger';
            }
            setTimeout(function () {
                document.querySelector('#alert').classList = 'alert alert-secondary';
            }, 5000);
        }).catch(error => {
            console.log(error);
        })
}

window.addEventListener('load', (event) => {
    //console.log('ページが完全に読み込まれました');
    document.getElementById('id').value = localStorage.getItem('ID');
    //console.log(localStorage.getItem('ID'));

});
function saveIDtoLocalStorage(_id) {
    let id_previous = document.getElementById('id').value = localStorage.getItem('ID');
    if (_id != id_previous) {

        // 変更する場合で且つ10分以内に変更がなければ、ストレージに保存
        let now = new Date();
        let pasttime;
        const waiting_time = 1000 * 10 * 60;
        if (localStorage.getItem('timestamp') == null) {
            pasttime = waiting_time + 1000;
        }
        else {
            pasttime = new Date(parseInt(localStorage.getItem('timestamp')));
            pasttime = now.getTime() - pasttime.getTime();
        }


        if (pasttime > waiting_time) {
            if (confirm(`学修番号の入力・変更は ${waiting_time / 60000} 分に一度だけしかできません。よろしいですか？`)) {
                localStorage.setItem('ID', _id);
                document.querySelector('#id').value = _id;
                localStorage.setItem('timestamp', now.getTime());
            }
        }
        else if (pasttime < waiting_time) {
            alert(`変更できるまであと ${parseInt((waiting_time - pasttime) / 1000)} 秒お待ち下さい`);
        }
        // キャンセルはなにもしない
    }

}



var canvasElement = document.getElementById("canvas");
var canvas = canvasElement.getContext("2d");

var is_camera_open = false;
async function toggleCamera() {

    if (document.querySelector('#id').value == '') {
        alert('学修番号を入力してください\nInput your student number');
        return;
    }

    is_camera_open = !is_camera_open;

    // カメラを開く
    if (is_camera_open) {
        //console.log("startCamera();")
        startCamera();

    }
    // カメラを閉じる
    else {
        //console.log("stopCamera();")
        stopCamera();

    }
}

var camera_stream;

var video;
var id_animation_request = null;
function startCamera() {

    video = document.createElement("video");
    canvasElement.style.visibility = "visible";
    // Use facingMode: environment to attemt to get the front camera on phones
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(function (stream) {
            video.srcObject = stream;
            camera_stream = stream;
            video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
            video.play();
            id_animation_request = window.requestAnimationFrame(tick);
        });
    document.querySelector('#button_toggle_camera').classList = "btn btn-danger";
}

function stopCamera() {
    //console.log(window.cancelAnimationFrame(id_animation_request));
    camera_stream.getTracks().forEach(function (track) {
        track.stop();

    });
    //canvasElement.style.visibility = "hidden";

    is_camera_open = false;
    document.querySelector('#button_toggle_camera').classList = "btn btn-secondary";
    setTimeout(function () {
        canvasElement.style.visibility = "collapse";
    }, 100);
}

function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvasElement.hidden = false;

        let new_height = video.videoHeight * (canvasElement.clientWidth / video.videoWidth);
        canvasElement.width = video.videoWidth * (canvasElement.clientWidth / video.videoWidth);
        canvasElement.height = new_height;//video.videoHeight;

        canvas.drawImage(video, 0, 0, canvasElement.width, new_height);
        var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        // QRコードが見つかったとき
        if (code) {
            // code.dataから空白を削除
            code.data = code.data.replace(/\s+/g, "");
            // code.dataをカンマで2つに分割
            let code_data = code.data.split(',');
            let timestamp = code_data[0];
            let classname = code_data[1];

            let ret_string = getEncodedString(timestamp, classname, document.querySelector('#id').value);
            stopCamera();
            canvasElement.hidden = true;

            alert('出席登録が成功しました。取得した出席コードは大事に保管してください。');
            return;
        } else {
        }
    }
    id_animation_request = requestAnimationFrame(tick);
}

