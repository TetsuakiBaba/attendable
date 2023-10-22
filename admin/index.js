// onloadイベント


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
function setClassname() {
    // local storageにclassnameを保存
    localStorage.setItem('classname', document.querySelector('#classname').value);
}


function getAllAttendanceCode() {
    // 出席コードだけをもらう
    const param = {
        type: 'get_all_attendance_code',
        classname: encodeURIComponent(document.querySelector('#classname').value)
    };
    // EncodeDecode.phpに送信
    fetch('../EncodeDecode.php', { // 第1引数に送り先
        method: 'POST', // メソッド指定
        headers: { 'Content-Type': 'application/json' }, // jsonを指定
        body: JSON.stringify(param) // json形式に変換して添付
    })
        .then(response => response.json()) // 返ってきたレスポンスをjsonで受け取って次のthenへ渡す
        .then(res => {
            console.log(res.data);
            if (res.message == "Success") {
                // 取得した res.dataのencoded_textのみをcsv形式にする
                let csv = '';
                for (let i = 0; i < res.data.length; i++) {
                    csv += res.data[i].encoded_text + '\n';
                }
                console.log(csv);
                // csvをダウンロードする
                const element = document.createElement('a');
                const text = csv;
                const filename = 'attendance_codes.csv';
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                element.setAttribute('download', filename);
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);

            }
        });
}

function getAllAttendanceData() {
    // 出席データベースを取得する
    const param = {
        type: 'get_all_attendance_data',
        classname: encodeURIComponent(document.querySelector('#classname').value)
    };
    // EncodeDecode.phpに送信
    fetch('../EncodeDecode.php', { // 第1引数に送り先
        method: 'POST', // メソッド指定
        headers: { 'Content-Type': 'application/json' }, // jsonを指定
        body: JSON.stringify(param) // json形式に変換して添付
    })
        .then(response => response.json()) // 返ってきたレスポンスをjsonで受け取って次のthenへ渡す
        .then(res => {
            //console.log(res); // 返ってきたデータ
            if (res.message == "Success") {
                // ここで出席データを表示する
                console.log(res.data);
                let div = document.querySelector('#table_show_all_attendance_data');
                div.innerHTML = '';
                let table = document.createElement('table');
                table.classList = 'table table-striped table-hover';
                let thead = document.createElement('thead');
                let tr = document.createElement('tr');
                let th = document.createElement('th');
                th.innerHTML = '学修番号';
                th.id = 'number';
                tr.appendChild(th);
                th = document.createElement('th');
                th.innerHTML = '日時';
                th.id = 'date';
                tr.appendChild(th);
                thead.appendChild(tr);
                table.appendChild(thead);
                let tbody = document.createElement('tbody');

                for (let i = 0; i < res.data.length; i++) {
                    tr = document.createElement('tr');
                    let td = document.createElement('td');
                    let number = res.data[i].id;
                    td.innerHTML = number;
                    td.id = `number_${i}`
                    tr.appendChild(td);

                    td = document.createElement('td');
                    let date = new Date(res.data[i].timestamp * 1000).toLocaleString({ timeZone: 'Asia/Tokyo' });
                    // dateをスペースで分割して、日付のみを取得する
                    date = date.split(' ')[0];
                    td.innerHTML = date;
                    td.id = `date_${i}`;
                    tr.appendChild(td);

                    td = document.createElement('td');
                    let date_and_time = new Date(res.data[i].timestamp * 1000).toLocaleString({ timeZone: 'Asia/Tokyo' });
                    td.innerHTML = date_and_time;
                    td.id = `date_and_time_${i}`;
                    tr.appendChild(td);
                    tbody.appendChild(tr);
                }
                table.appendChild(tbody);
                div.appendChild(table);

                // 学修番号をキーとした連想配列を作成する。以下のような感じの配列
                /*
                attendance[0123456789] = {
                  date: ["2022/4/18", "2022/4/25",,,,"2022/7/11"]
                }
                ただし、重複した日付は一つにまとめる。また日付は古い順にソートする
                */

                // This will hold the final result
                let result = {};

                // Iterate over the data array
                for (let i = 0; i < res.data.length; i++) {
                    let item = res.data[i];

                    // Convert timestamp to date string without time information in JST
                    let date = new Date(item.timestamp * 1000);
                    let jstDate = date.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });

                    // Construct the key from id and classname
                    let key = `${item.id}`;

                    // If the key does not exist in the result, create a new entry
                    if (!result[key]) {
                        result[key] = {
                            id: item.id,
                            classname: item.classname,
                            dates: [jstDate]
                        };
                    } else if (!result[key].dates.includes(jstDate)) { // If date is not already included, add it to the array
                        result[key].dates.push(jstDate);
                    }
                }

                // resultのdatesを日付順にソートする
                for (let key in result) {
                    result[key].dates.sort(function (a, b) {
                        return new Date(a) - new Date(b);
                    });
                }
                console.log(result);



                // console.log(attendances.length);

                // 日付を新しい順にソートする
                // for (let i = 0; i < attendances.length; i++) {
                //     attendances[i].sort(function (a, b) {
                //         return new Date(a) - new Date(b);
                //     });
                // }
                // console.log('attendances:', attendances);



                // button_totallingボタンをアクティブにする
                document.querySelector('#button_totalling').disabled = false;

            }
            else {
                alert(`Error: 「${document.querySelector('#classname').value
                    }」の出席データベースを取得できませんでした`);
            }
        }
        );


}

function deleteAttendanceDatabase() {

    // 本当に削除してよいか確認のダイアログを表示
    if (confirm(`「${document.querySelector('#classname').value}」の出席データベースを削除しますか？（この操作は取り消せません）`)) {
        // OKなら削除
    } else {
        // キャンセルなら何もしない
        return;
    }

    // 出席データベースを削除する
    const param = {
        type: 'delete_attendance_database',
        classname: encodeURIComponent(document.querySelector('#classname').value)
    };
    // EncodeDecode.phpに送信
    fetch('../EncodeDecode.php', { // 第1引数に送り先
        method: 'POST', // メソッド指定
        headers: { 'Content-Type': 'application/json' }, // jsonを指定
        body: JSON.stringify(param) // json形式に変換して添付
    })
        .then(response => response.json()) // 返ってきたレスポンスをjsonで受け取って次のthenへ渡す
        .then(res => {
            //console.log(res); // 返ってきたデータ
            if (res.message == "Success") {
                alert('出席データベースを削除しました');
            }
            else {
                alert(`Error: 「${document.querySelector('#classname').value}」の出席データベースを削除できませんでした`);
            }
        }
        );


}

function getAttendanceCode() {
    if (document.querySelector('#id').value == '') {
        alert("学修番号を入力してください");
        return;
    }

    let date = new Date(document.querySelector('#date').value);
    // 特別に生の学修番号からその時の出席コード作成を依頼
    let param;
    if (document.querySelector('#checkbox_date').checked == true) {
        param = {
            type: 'b83hgAnzjhdg1',
            id: document.querySelector('#id').value,
            date: Math.floor(date.getTime() / 1000),
            classname: encodeURIComponent(document.querySelector('#classname').value)
        };
    }
    else {
        param = {
            type: 'b83hgAnzjhdg1',
            id: document.querySelector('#id').value,
            date: 'no',
            classname: encodeURIComponent(document.querySelector('#classname').value)
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
                alert('error');
            }

        });
}



var id_interval;
window.addEventListener('load', (event) => {
    // 授業名を取得
    document.querySelector('#classname').value = localStorage.getItem('classname');
    startQR();

    fetch('getDBList.php')  // PHPスクリプトのURLを指定
        .then(response => response.json())
        .then(dbFiles => {
            console.log(dbFiles);  // dbFilesはSQLiteデータベースの名前の配列
            // dbFilesの中身を#db_listに表示する
            document.querySelector('#existed_dbs').innerHTML = dbFiles;

        })
        .catch(error => console.error('Error:', error));

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
                data: `${String(timestamp)}, ${encodeURIComponent(document.querySelector('#classname').value)
                    } `,
                //data: `${ String(timestamp) } `,
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