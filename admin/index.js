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
function getAttendanceCode() {
    if (document.querySelector('#id').value == '') {
        alert("学修番号を入力してください");
        return;
    }

    let date = new Date(document.querySelector('#date').value);
    // 特別に生の学修番号からその時の出席コード作成を依頼
    if (document.querySelector('#checkbox_date').checked == true) {
        param = {
            type: 'b83hgAnzjhdg1',
            id: document.querySelector('#id').value,
            date: Math.floor(date.getTime() / 1000)
        };
    }
    else {
        param = {
            type: 'b83hgAnzjhdg1',
            id: document.querySelector('#id').value,
            date: 'no'
        };
    }



    fetch('../EncodeDecode.php', { // 第1引数に送り先
        method: 'POST', // メソッド指定
        headers: { 'Content-Type': 'application/json' }, // jsonを指定
        body: JSON.stringify(param) // json形式に変換して添付
    })
        .then(response => response.json()) // 返ってきたレスポンスをjsonで受け取って次のthenへ渡す
        .then(res => {
            console.log(res); // 返ってきたデータ

            if (res.message == "Success") {
                document.querySelector('#input_attendance_code').value = res.encoded_text;
                let timestamp = new Date(res.timestamp * 1000)
                document.querySelector('#label').innerHTML = timestamp;
            }
            else {

            }

        });
}



var id_interval;
window.addEventListener('load', (event) => {
    startQR();
});

function startQR() {

    // サーバのtimestampを暗号化してもらって、それを取得する。その後はtimestampを含めたQRを生成する
    const param = {
        type: "encode_generator"
    };

    fetch('../EncodeDecode.php', { // 第1引数に送り先
        method: 'POST', // メソッド指定
        headers: { 'Content-Type': 'application/json' }, // jsonを指定
        body: JSON.stringify(param) // json形式に変換して添付
    })
        .then(response => response.json()) // 返ってきたレスポンスをjsonで受け取って次のthenへ渡す
        .then(res => {
            // ここまででエンコードテキストがもらえるのでQRコードを生成する
            //console.log(res); // 返ってきたデータ

            let size = document.getElementById("contents").clientWidth * 0.8;
            if (size > 800) {
                size = 800;
            }
            var date = new Date();
            timestamp = res.timestamp;
            //console.log(timestamp);
            const qrCode = new QRCodeStyling({
                width: size,
                height: size,
                margin: 20,
                type: "svg",
                data: String(timestamp),
                //data: "https://tetsuakibaba.jp",
                //image: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
                dotsOptions: {
                    color: "#000000",
                    type: "square"
                },
                backgroundOptions: {
                    color: "#FFFFFF",
                },
                imageOptions: {
                    crossOrigin: "anonymous",
                    margin: 20
                }
            });

            qrCode.append(document.getElementById("canvas"));

            id_interval = setInterval(function () {
                let now = parseInt(document.querySelector("#number_progress").ariaValueNow);
                let max = parseInt(document.querySelector('#number_progress').ariaValueMax);
                let next = parseInt(now) + 1;

                if (next > max) {
                    next = 0;
                    document.querySelector('#number_progress').ariaValueNow = next;
                    document.querySelector('#number_progress').style = "width:0%";
                    document.querySelector('#canvas').removeChild(document.querySelector('#canvas').firstElementChild);
                    clearInterval(id_interval);


                    // QRコードの作り直し
                    startQR();
                }
                else {
                    document.querySelector('#number_progress').ariaValueNow = next;

                    let rate = Math.floor(100 * ((now + 1) / (max)));
                    document.querySelector('#number_progress').style = "width:" + String(rate) + "%";
                }
                //console.log(next);
            }, 1000);

        });



}