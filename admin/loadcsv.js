// 1: ボタンを取得してchangeイベントの設定
var loadBtn = document.querySelector("#loadBtn");
loadBtn.addEventListener("change", upload, false);

function upload(event) {
  // 2：chekFileReader関数でFileAPIにブラウザが対応してるかチェック
  if (!checkFileReader()) {
    alert("エラー：FileAPI非対応のブラウザです。");
  } else {
    // 3: 選択されたファイル情報を取得
    var file = event.target.files[0];
    var type = file.type; // MIMEタイプ
    var size = file.size; // ファイル容量（byte）
    var limit = 10000000; // byte, 10KB

    console.log(type);
    // MIMEタイプの判定
    if (type != "text/csv") {
      alert("csv以外は読み込めません");
      loadBtn.value = "";
      return;
    }

    //readerオブジェクトを作成
    var reader = new FileReader();
    // ファイル読み取りを実行
    reader.readAsText(file);

    // 4：CSVファイルを読み込む処理とエラー処理をする
    reader.onload = function (event) {
      var result = event.target.result;
      makeCSV(result);
    };

    //読み込めなかった場合のエラー処理
    reader.onerror = function () {
      alert("エラー：ファイルをロードできません。");
    };
  }
}

function createAttendanceTable() {

  // 学修番号をキーとした連想配列を作成する。以下のような感じの配列
  /*
  attendance[0123456789] = {
    date: ["2022/4/18", "2022/4/25",,,,"2022/7/11"]
  }
  */
  let attendance = [];
  let numbers = [];
  let dates = [];
  let trs = document.querySelectorAll('tr');

  for (let i = 0; i < trs.length - 1; i++) {
    let number = String(document.querySelector(`#number_${i}`).innerText);
    number = 'u' + number.slice(1);
    let timestamp = String(document.querySelector(`#date_${i}`).innerText);
    numbers.push(String(number));
    dates.push(String(timestamp));
    if (attendance[number]) {
      attendance[number].dates.push(timestamp);
    }
    else {
      attendance[number] = { dates: [timestamp] };
    }
  }
  dates = new Set(dates);
  dates = Array.from(dates).sort();
  console.log(dates);

  numbers = new Set(numbers);
  numbers = Array.from(numbers).sort();
  for (num of numbers) {
    attendance[num].dates = new Set(attendance[num].dates);
    attendance[num].dates = Array.from(attendance[num].dates).sort();
  }


  document.querySelector('#resulttable').innerHTML = "";
  let htmldata = "";
  htmldata = '<table class="mt-4 table table-striped table-sm table-light table-hover" style="font-size:0.1em">';
  htmldata += '<th>Number</th>';
  for (date of dates) {
    htmldata += `<th>${date}</th>`;
  }
  htmldata += `<th>sum</th>`;

  for (let number of numbers) {
    htmldata += `<tr>`;
    htmldata += `<th>${number}</th>`;
    for (let i = 0; i < dates.length; i++) {
      if (attendance[number].dates.includes(dates[i])) {
        htmldata += `<td>1</td>`;
      }
      else {
        htmldata += `<td>0</td>`;
      }
    }
    htmldata += `<td>${attendance[number].dates.length}</td>`
    htmldata += `</tr>`;
  }
  htmldata += "</table>"
  document.querySelector('#resulttable').innerHTML = htmldata;
  //htmldata += "<tr><th>出席コード</th><th>学修番号</th><th>日付</th></tr>";

  TableExport(document.getElementsByTagName("table"), {
    formats: ["csv"]
  });
}

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

(async () => {
  console.log('スタート');
  await sleep(1000);
  console.log('1秒経ってる!')
})();

async function decodeAllCode() {
  let tds = document.querySelectorAll('tr');
  console.log(tds.length);

  for (let i = 0; i < tds.length - 1; i++) {
    decodeCode(i);
    await sleep(30);
  }
}

function decodeCode(_i) {
  const param = {
    type: 'check',
    encoded_text: document.querySelector(`#attendance_code${_i}`).innerText
  };
  fetch('../EncodeDecode.php', { // 第1引数に送り先
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
        timestamp = timestamp.split(' ')[0];
        //console.log(results[1]);
        document.querySelector(`#date_${_i}`).innerHTML = String(timestamp);
        document.querySelector(`#number_${_i}`).innerHTML = String(results[1]);
      }
      else {
        //alert(res.message);
      }
    });
}

//csvをうまく出力する
function makeCSV(csvdata) {
  //csvデータを1行ごとに配列にする
  var tmp = csvdata.split("\n");

  //csvデータをそのままtableで出力する
  var tabledata = document.querySelector("#resulttable");
  let htmldata = '<table class="mt-4 table table-sm table-light table-hover">';
  htmldata += "<tr><th>出席コード</th><th>学修番号</th><th>日付</th></tr>";
  //６：1行のデータから各項目（各列）のデータを取りだして、2次元配列にする
  var data = [];
  for (var i = 0; i < tmp.length; i++) {
    //csvの1行のデータを取り出す
    var row_data = tmp[i];

    /*各行の列のデータを配列にする
    data[
        [1列目、2列目、3列目]　←1行目のデータ　
        [1列目、2列目、3列目]　←2行目のデータ　
        [1列目、2列目、3列目]　←3行目のデータ　
        ]
    */

    data[i] = row_data.split(",");
    //7：dataに入ってる各列のデータを出力する為のデータを作る

    htmldata += "<tr>";
    for (var j = 0; j < data[i].length; j++) {
      //各行の列のデータを個別に出力する
      htmldata += `<td id="attendance_code${i}">${data[i][j]}</td >`;
    }
    htmldata += `<td id="number_${i}"></td><td id="date_${i}"></td>`;
    htmldata += "</tr>";
  }

  // 8： データをWebページに出力する
  htmldata += "</table>";
  tabledata.innerHTML = htmldata;
  console.log(tabledata);
}
// ファイルアップロード判定
function checkFileReader() {
  var isUse = false;
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    isUse = true;
  }
  return isUse;
}


function exportTable() {
  TableExport(document.getElementsByTagName("table"), {
    formats: ["csv"]
  });
}