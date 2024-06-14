var version_date = `
last modified: 2024/06/14 10:18:33
`;
// version_dataからスペースと改行を削除
version_date = version_date.replace(/\n/g, "");
document.querySelector('#version_date').innerHTML = version_date;


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
async function getEncodedString(timestamp, classname, id, score) {
    // console.log("getEncodedString");
    const param = {
        type: 'registration',
        timestamp: timestamp,
        id: id,
        classname: classname,
    };

    // console.log(param);

    try {
        const response = await fetch('EncodeDecode.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(param)
        });

        const res = await response.json();

        if (res.message === 'Success') {
            document.querySelector('#input_attendance_code').value = res.encoded_text;
            document.querySelector('#alert').classList = 'alert alert-success';
            // copyAttendanceCode();

            return param;
        } else {
            document.querySelector('#input_attendance_code').value = res.message;
            document.querySelector('#alert').classList = 'alert alert-danger';
        }

        setTimeout(() => {
            document.querySelector('#alert').classList = 'alert alert-secondary';
        }, 5000);


        return null;
    } catch (error) {
        console.error("Error", error);
        return null;
    }
}

// function getEncodedString(timestamp, classname, id) {
//     console.log("getEncodedString");
//     const param = {
//         type: 'registration',
//         timestamp: timestamp, // タイムスタンプは暗号化されているが、そのまま送信
//         id: id,
//         classname: classname
//     };

//     console.log(param);
//     fetch('EncodeDecode.php', { // 第1引数に送り先
//         method: 'POST', // メソッド指定
//         headers: { 'Content-Type': 'application/json' }, // jsonを指定
//         body: JSON.stringify(param) // json形式に変換して添付
//     })
//         .then(response => response.json()) // 返ってきたレスポンスをjsonで受け取って次のthenへ渡す
//         .then(res => {
//             console.log(res); // 返ってきたデータ
//             // 取得した出席コードをDOMにいれる
//             if (res.message == 'Success') {
//                 // alert背景をsuccessに
//                 document.querySelector('#input_attendance_code').value = res.encoded_text;
//                 document.querySelector('#alert').classList = 'alert alert-success';
//                 document.querySelector('#attendance_code').value = res.encoded_text;
//                 copyAttendanceCode();
//             }
//             else {
//                 // alert背景をdangerに
//                 document.querySelector('#input_attendance_code').value = res.message;
//                 document.querySelector('#alert').classList = 'alert alert-danger';
//             }
//             setTimeout(function () {
//                 document.querySelector('#alert').classList = 'alert alert-secondary';
//             }, 5000);
//         }).catch(error => {
//             console.log(error);
//         })
// }

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
            if (confirm(`学生番号の入力・変更は ${waiting_time / 60000} 分に一度だけしかできません。よろしいですか？`)) {
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





var is_camera_open = false;
async function toggleCamera() {

    if (document.querySelector('#id').value == '') {
        alert('学生番号を入力してください\nInput your student number');
        return;
    }

    is_camera_open = !is_camera_open;

    // カメラを開く
    if (is_camera_open) {
        //console.log("startCamera();") <canvas style="width:100%;margin:0;padding:0" id="canvas" hidden></canvas>
        document.querySelector('#camera_placeholder').innerHTML = '<canvas style="width:100%;margin:0;padding:0" id="canvas"></canvas>';
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
    var canvasElement = document.getElementById("canvas");
    var canvas = canvasElement.getContext("2d");

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
    var canvasElement = document.getElementById("canvas");

    //console.log(window.cancelAnimationFrame(id_animation_request));
    camera_stream.getTracks().forEach(function (track) {
        track.stop();

    });
    //canvasElement.style.visibility = "hidden";

    is_camera_open = false;
    document.querySelector('#button_toggle_camera').classList = "btn btn-secondary";
    setTimeout(function () {
        canvasElement.style.visibility = "collapse";
        document.querySelector('#camera_placeholder').innerHTML = '';
    }, 500);
}

async function tick() {
    var canvasElement = document.getElementById("canvas");
    if (!canvasElement) {
        return;  // ここで処理を中断
    }
    var canvas = canvasElement.getContext("2d");
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

            let ret_string = await getEncodedString(timestamp, classname, document.querySelector('#id').value);
            // console.log(ret_string);
            stopCamera();

            if (ret_string == null) {
                alert('出席登録が失敗しました。もう一度お試しください。\nAttendance registration failed. Please try again.')
            }
            else {
                alert('出席登録が成功しました。Confirmボタンを押して正しく出席登録されているのを確認したら、必要に応じてAddボタンで出席コードを追加してください。\nAttendance registration was successful. If you have confirmed that the attendance registration is correct, add the attendance code as necessary by pressing the Add button.');
            }
            return;
        } else {
        }
    }
    id_animation_request = requestAnimationFrame(tick);
}

