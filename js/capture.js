let version_date_capture_js = `
last modified: 2024/07/08 10:41:32
`;


// version_dataからlast modified: とスペース、改行を削除
version_date_capture_js = version_date_capture_js.replace(/last modified: /g, '');
version_date_capture_js = version_date_capture_js.replace(/\n/g, '');
document.querySelector('#version_date').innerHTML += `capture.js: ${version_date_capture_js}`;


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


document.getElementById('id').value = localStorage.getItem('ID');

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



async function listCameras4Safari() {
    const cameraSelect = document.getElementById('camera-select');
    try {
        // 仮のカメラアクセスをリクエストしてユーザーの許可を取得
        initialStream = await navigator.mediaDevices.getUserMedia({ video: true });

        // デバイスを列挙
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        console.log(videoInputs);
        // セレクトボックスをクリア
        cameraSelect.innerHTML = '';

        // カメラデバイスをセレクトボックスに追加
        // const option = document.createElement('option');
        // option.value = "default";
        // option.text = `Choose Camera`;
        // cameraSelect.appendChild(option);
        videoInputs.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `camera ${index + 1} `;

            // もしローカルストレージのカメラIDと一致したら選択状態にする
            if (localStorage.getItem('camera_id') == device.deviceId) {
                option.selected = true;
            }

            cameraSelect.appendChild(option);
        });
        // ストリームを停止してカメラをクローズ
        if (initialStream) {
            initialStream.getTracks().forEach(track => track.stop());
        }
    } catch (err) {
        console.error('Error accessing media devices.', err);
    }
}
async function listCameras() {
    const cameraSelect = document.getElementById('camera-select');
    try {
        // デバイスを列挙
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        console.log(videoInputs);
        // セレクトボックスをクリア
        cameraSelect.innerHTML = '';

        // カメラデバイスをセレクトボックスに追加
        // const option = document.createElement('option');
        // option.value = "default";
        // option.text = `Choose Camera`;
        // cameraSelect.appendChild(option);
        videoInputs.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `camera ${index + 1} `;

            // もしローカルストレージのカメラIDと一致したら選択状態にする
            if (localStorage.getItem('camera_id') == device.deviceId) {
                option.selected = true;
            }

            cameraSelect.appendChild(option);
        });
    } catch (err) {
        console.error('Error accessing media devices.', err);
    }
}


function saveCameraIdtoLocalStorage() {
    let camera_id = document.getElementById('camera-select').value;
    localStorage.setItem('camera_id', camera_id);
    console.log(localStorage.getItem('camera_id'));
    tmpAlertFadeIn();
    setTimeout(function () {
        tmpAlertFadeOut();
    }, 3000);
}

function tmpAlertFadeIn(message) {
    var alertElement = document.querySelector('.tmpAlert');
    alertElement.classList.remove('fade-out', 'alert', 'alert-success');
    alertElement.classList.add('fade-in', 'alert', 'alert-success');
    alertElement.innerHTML = 'デフォルトのカメラデバイス設定が保存されました。Default camera device setting has been saved.';
    alertElement.style.opacity = 1; // 明示的に表示
}

function tmpAlertFadeOut() {
    var alertElement = document.querySelector('.tmpAlert');
    alertElement.classList.remove('fade-in');
    alertElement.classList.add('fade-out', 'alert', 'alert-success');
    // alertElementのcssエフェクトが終わったら中身を空にする
    alertElement.addEventListener('animationend', () => {
        alertElement.innerHTML = '';
        alertElement.classList.remove('alert', 'alert-success');
    }, { once: true });

    alertElement.style.opacity = 0; // 明示的に非表示
}



var is_camera_open = false;
async function toggleCamera() {

    if (document.querySelector('#id').value == '') {
        alert('学生番号を入力してからカメラを起動してください\nInput your student number before starting the camera.');
        return;
    }

    is_camera_open = !is_camera_open;

    // カメラを開く
    if (is_camera_open) {
        //console.log("startCamera();") <canvas style="width:100%;margin:0;padding:0" id="canvas" hidden></canvas>
        document.querySelector('#camera_placeholder').innerHTML = '<canvas style="width:100%;margin:0;padding:0;border-radius: 0.4rem;border:0px solid #000" class="" id="canvas"></canvas>';
        await startCamera();

        // ズーム機能を表示したいときには下のコメントを外してデバッグする
        const videoTrack = camera_stream.getVideoTracks()[0];
        let settings = videoTrack.getSettings();
        let capabilities = videoTrack.getCapabilities();
        // capabilities.zoom = { min: 1, max: 10, step: 0.1 };
        // settings.zoom = 5;
        if (capabilities.zoom) {
            if (!capabilities.zoom.step) {
                capabilities.zoom.step = 0.1;
            }
            document.getElementById('zoom_ui').innerHTML = `
                    <div class="row mt-2 mb-2">
                        <div class="col-2 text-end fs-4">
                            <i class="bi bi-zoom-out"></i>
                        </div>  
                        <div class="col-8 text-center">
                            <input type="range" class="form-range" min="${capabilities.zoom.min}" max="${capabilities.zoom.max}" value="${settings.zoom}" step="${capabilities.zoom.step}" id="zoom_ui_input">
                        </div>
                        <div class="col-2 text-start fs-4">
                            <i class="bi bi-zoom-in"></i>
                        </div>
                    </div>
                    `;
            document.getElementById('zoom_ui_input').addEventListener('input', (event) => {
                videoTrack.applyConstraints({ advanced: [{ zoom: parseFloat(event.target.value) }] });
            });
        }


    }
    // カメラを閉じる
    else {
        //console.log("stopCamera();")
        stopCamera();
        document.getElementById('zoom_ui').innerHTML = '';
    }
}

var camera_stream;

var video;
var id_animation_request = null;
async function startCamera() {
    var canvasElement = document.getElementById("canvas");
    var canvas = canvasElement.getContext("2d");

    video = document.createElement("video");
    canvasElement.style.visibility = "visible";
    console.log(document.querySelector('#camera-select').value);

    try {
        // Use facingMode: environment to attempt to get the front camera on phones
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                deviceId: localStorage.getItem('camera_id'),
                facingMode: "environment",
                zoom: { ideal: 2.0 }
            }
        });

        video.srcObject = stream;
        camera_stream = stream;
        video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
        await video.play();
        id_animation_request = window.requestAnimationFrame(tick);

        document.querySelector('#button_toggle_camera').classList = "btn btn-danger rounded-pill";
    } catch (error) {
        console.error('Error accessing camera:', error);
    }

}

function stopCamera() {
    if (is_camera_open) {
        var canvasElement = document.getElementById("canvas");
        camera_stream.getTracks().forEach(function (track) {
            track.stop();
        });
        document.querySelector('#button_toggle_camera').classList = "btn btn-secondary rounded-pill";
        setTimeout(function () {
            canvasElement.style.visibility = "collapse";
            document.querySelector('#camera_placeholder').innerHTML = '';
        }, 500);
    }
    is_camera_open = false;
}

// async function tick() {
//     var canvasElement = document.getElementById("canvas");
//     if (!canvasElement && is_camera_open == false) {
//         return;  // ここで処理を中断
//     }
//     var canvas = canvasElement.getContext("2d");
//     if (video.readyState === video.HAVE_ENOUGH_DATA) {
//         canvasElement.hidden = false;

//         let new_height = video.videoHeight * (canvasElement.clientWidth / video.videoWidth);
//         canvasElement.width = video.videoWidth * (canvasElement.clientWidth / video.videoWidth);
//         canvasElement.height = new_height;//video.videoHeight;

//         canvas.drawImage(video, 0, 0, canvasElement.width, new_height);
//         var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
//         var code = jsQR(imageData.data, imageData.width, imageData.height, {
//             inversionAttempts: "dontInvert",
//         });

//         // QRコードが見つかったとき
//         if (code) {
//             // code.dataから空白を削除
//             code.data = code.data.replace(/\s+/g, "");
//             // code.dataをカンマで2つに分割
//             let code_data = code.data.split(',');
//             let timestamp = code_data[0];
//             let classname = code_data[1];

//             let ret_string = await getEncodedString(timestamp, classname, document.querySelector('#id').value);
//             // console.log(ret_string);
//             stopCamera();

//             if (ret_string == null) {
//                 alert('出席登録が失敗しました。もう一度お試しください。\nAttendance registration failed. Please try again.')
//             }
//             else {
//                 alert('出席登録が成功しました。Confirmボタンを押して正しく出席登録されているのを確認したら、必要に応じてAddボタンで出席コードを追加してください。\nAttendance registration was successful. If you have confirmed that the attendance registration is correct, add the attendance code as necessary by pressing the Add button.');
//             }
//             return;
//         } else {
//         }
//     }
//     id_animation_request = requestAnimationFrame(tick);
// }

async function tick() {
    return new Promise(async (resolve, reject) => {
        try {
            var canvasElement = document.getElementById("canvas");
            if (!canvasElement && is_camera_open == false) {
                resolve();  // ここで処理を中断してPromiseを解決
                return;
            }
            var canvas = canvasElement.getContext("2d");
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvasElement.hidden = false;

                let new_height = video.videoHeight * (canvasElement.clientWidth / video.videoWidth);
                canvasElement.width = video.videoWidth * (canvasElement.clientWidth / video.videoWidth);
                canvasElement.height = new_height;

                // キャンバスの幅と高さが0でないことを確認
                if (canvasElement.width > 0 && canvasElement.height > 0) {
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
                        stopCamera();

                        if (ret_string == null) {
                            alert('出席登録が失敗しました。もう一度お試しください。\nAttendance registration failed. Please try again.');
                            resolve();
                        } else {
                            alert('出席登録が成功しました。Confirmボタンを押して正しく出席登録されているのを確認したら、必要に応じてAddボタンで出席コードを追加してください。\nAttendance registration was successful. If you have confirmed that the attendance registration is correct, add the attendance code as necessary by pressing the Add button.');
                            resolve();
                        }
                        return;
                    }
                }
            }
            id_animation_request = requestAnimationFrame(() => tick().then(resolve).catch(reject));
        } catch (error) {
            reject(error);
        }
    });
}



listCameras();
// listCameras4Safari();