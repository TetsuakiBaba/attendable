
function getStudentNumberFromKibacoID(id) {
  // 現在の年度下二桁を求める
  let year = new Date().getFullYear() - 2000;

  let y10 = parseInt(year.toString().slice(0, 1));
  let y1 = parseInt(year.toString().slice(1, 2));
  let ky1 = parseInt(id.slice(1, 2));
  let ky10 = 0;
  /**
  year: 10の段 y10, 1の段 y1
  kibaco year: 10の段 ky10, ky1
  */

  if (ky1 > y1) {
    ky10 = y10 - 1;
    if (y10 * 10 + y1 - (ky10 * 10 + ky1) > 8) {
      alert("在籍し得ないkibaco idです: " + id);
    }
  } else {
    ky10 = y10;
  }
  return ky10.toString() + id.slice(1);
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
  let dates_and_times = [];
  let dates = [];

  let trs = document.querySelectorAll('tr');

  /*
  学修番号、日時、日付　の順にテーブルを作成する
  */
  for (let i = 0; i < trs.length - 1; i++) {
    let number = String(document.querySelector(`#number_${i}`).innerText);
    // number = 'u' + number.slice(0);
    number = number.slice(0);
    let timestamp = String(document.querySelector(`#date_${i}`).innerText);
    numbers.push(String(number));
    dates_and_times.push(String(timestamp));
    if (attendance[number]) {
      attendance[number].dates_and_times.push(timestamp);
    }
    else {
      attendance[number] = { dates_and_times: [timestamp] };
    }
  }

  console.log(attendance);

  dates_and_times = new Set(dates_and_times);
  dates_and_times = Array.from(dates_and_times).sort();
  console.log(dates_and_times);

  numbers = new Set(numbers);
  numbers = Array.from(numbers).sort();
  for (num of numbers) {
    attendance[num].dates_and_times = new Set(attendance[num].dates_and_times);
    attendance[num].dates_and_times = Array.from(attendance[num].dates_and_times).sort();
  }


  document.querySelector('#resulttable').innerHTML = "";
  let htmldata = "";
  htmldata = '<table class="mt-4 table table-striped table-sm table-light table-hover" style="font-size:1rem">';
  htmldata += '<th>studen id</th>';
  for (let date_and_time of dates_and_times) {
    htmldata += `<th>${date_and_time}</th>`;
  }
  htmldata += `<th>sum</th>`;

  for (let number of numbers) {
    htmldata += `<tr>`;
    htmldata += `<th>${number}</th>`;
    // htmldata += `<td>${getStudentNumberFromKibacoID(number)}</td>`;
    for (let i = 0; i < dates_and_times.length; i++) {
      if (attendance[number].dates_and_times.includes(dates_and_times[i])) {
        htmldata += `<td>1</td>`;
      }
      else {
        htmldata += `<td>0</td>`;
      }
    }
    htmldata += `<td>${attendance[number].dates_and_times.length}</td>`
    htmldata += `</tr>`;
  }
  htmldata += "</table>"
  document.querySelector('#resulttable').innerHTML = htmldata;
  //htmldata += "<tr><th>出席コード</th><th>学修番号</th><th>日付</th></tr>";

  TableExport(document.getElementsByTagName("table"), {
    headers: true,                      // (Boolean), display table headers (th or td elements) in the <thead>, (default: true)
    footers: true,                      // (Boolean), display table footers (th or td elements) in the <tfoot>, (default: false)
    formats: ["csv", "txt"],    // (String[]), filetype(s) for the export, (default: ['xlsx', 'csv', 'txt'])
    filename: "attendable",                     // (id, String), filename for the downloaded file, (default: 'id')
    bootstrap: false,                   // (Boolean), style buttons using bootstrap, (default: true)
    exportButtons: true,                // (Boolean), automatically generate the built-in export buttons for each of the specified formats (default: true)
    position: "bottom",                 // (top, bottom), position of the caption element relative to table, (default: 'bottom')
    ignoreRows: null,                   // (Number, Number[]), row indices to exclude from the exported file(s) (default: null)
    ignoreCols: null,                   // (Number, Number[]), column indices to exclude from the exported file(s) (default: null)
    trimWhitespace: true,               // (Boolean), remove all leading/trailing newlines, spaces, and tabs from cell text in the exported file(s) (default: false)
    RTL: false,                         // (Boolean), set direction of the worksheet to right-to-left (default: false)
    sheetname: "id"                     // (id, String), sheet name for the exported spreadsheet, (default: 'id')
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
    await sleep(3);
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
        document.querySelector(`#number_${_i}`).innerHTML = String(results[2]);
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