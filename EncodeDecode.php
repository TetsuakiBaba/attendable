<?PHP

// key.phpを読み込む
require_once('key.php');

$raw = file_get_contents('php://input'); // POSTされた生のデータを受け取る
$data = json_decode($raw); // json形式をphp変数に変換

//$res = $data; // やりたい処理
$type = $data->type;
//echo json_encode($data); // json形式にして返す
//return;
if ($type == "encode_generator") {

    $text_for_encode = time();

    //openssl
    $encoded_text = openssl_encrypt($text_for_encode, 'AES-128-ECB', $key);
    //    $p_t = openssl_decrypt($c_t, 'AES-128-ECB', $key);
    $res = array(
        "message" => 'Success',
        "timestamp" => $encoded_text
    );
}

/*
レジストレーション

timestamp（暗号化）, idが送信されてくる。timestampをデコードして時間のズレが問題ない（30秒以内）であれば
「デコードしたtimestamp,id」をエンコードし、そのテキストを返す
*/ else if ($type == "registration") {
    $timestamp = $data->timestamp;
    $id = $data->id;
    $classname = $data->classname;

    // タイムスタンプをデコード（読める形式になる）
    $timestamp = openssl_decrypt($timestamp, 'AES-128-ECB',  $key);

    if ((time() - $timestamp) < 31) {
        $encoded_text = $timestamp . ',' . $classname . ',' . $id;
        $encoded_text = openssl_encrypt($encoded_text, 'AES-128-ECB',  $key);
        $res = array(
            "message" => 'Success',
            "encoded_text" => $encoded_text,
        );
        // 出席を認めたらデータベースに記録する
        $db_filename = $classname . '.db';
        if (file_exists($db_filename)) {
            // echo "Database file $db_filename exists.\n";
            $db = new SQLite3($db_filename);
            // $db->exec('CREATE TABLE users (timestamp TEXT, id TEXT, classname TEXT)');
            $stmt = $db->prepare('INSERT INTO users (timestamp, id, classname) VALUES (:timestamp, :id, :classname)');
            $stmt->bindValue(':timestamp', $timestamp);
            $stmt->bindValue(':classname', $classname);
            $stmt->bindValue(':id', $id);
            $stmt->execute();
            // Your existing database-handling code here.
        } else {
            // echo "Database file $db_filename does not exist. Creating a new one.\n";
            $db = new SQLite3($db_filename);
            $db->exec('CREATE TABLE users (timestamp TEXT, id TEXT, classname TEXT)');
            $stmt = $db->prepare('INSERT INTO users (timestamp, id, classname) VALUES (:timestamp, :id, :classname)');
            $stmt->bindValue(':timestamp', $timestamp);
            $stmt->bindValue(':classname', $classname);
            $stmt->bindValue(':id', $id);
            $stmt->execute();
            // Additional setup code here.
        }
    } else {
        $res = array(
            "message" => 'Error: Timeout',
        );
    }
}
/* スペシャルクーポン発行
TAが学修番号を聞いて発行する特別な授業コード
*/ else if ($type == $coupon_code) {
    $id = $data->id;
    $classname = $data->classname;

    if ($data->date == "no") {
        $timestamp = time();
        $encoded_text = openssl_encrypt($timestamp . ',' . $classname . ',' . $id, 'AES-128-ECB', $key);
    } else {
        $timestamp = $data->date;
        $encoded_text = openssl_encrypt($timestamp . ',' . $classname . ',' . $id, 'AES-128-ECB', $key);
    }

    $res = array(
        "message" => 'Success',
        "encoded_text" => $encoded_text,
        "timestamp" => $timestamp,
    );

    // 出席を認めたらデータベースに記録する
    $db_filename = $classname . '.db';
    if (file_exists($db_filename)) {
        $db = new SQLite3($db_filename);
    } else {
        $db = new SQLite3($db_filename);
        $db->exec('CREATE TABLE users (timestamp TEXT, id TEXT, classname TEXT)');
    }
    $stmt = $db->prepare('INSERT INTO users (timestamp, id, classname) VALUES (:timestamp, :id, :classname)');
    $stmt->bindValue(':timestamp', $timestamp);
    $stmt->bindValue(':classname', $classname);
    $stmt->bindValue(':id', $id);
    $stmt->execute();
} else if ($type == "check") {
    $encoded_text = $data->encoded_text;
    $decoded_text = openssl_decrypt($encoded_text, 'AES-128-ECB', $key);
    if ($decoded_text == false) {
        $res = array(
            "message" => 'Error: Invalid encoded string',
            "decoded_text" => $decoded_text
        );
    } else {
        $res = array(
            "message" => 'Success',
            "decoded_text" => $decoded_text
        );
    }
} else if ($type == "delete_attendance_database") {
    // データベースを削除する
    $classname = $data->classname;
    $db_filename = $classname . '.db';
    if (file_exists($db_filename)) {
        unlink($db_filename);
        $res = array(
            "message" => 'Success',
        );
    } else {
        $res = array(
            "message" => 'Error: Database not found',
        );
    }
} else if ($type == "get_all_attendance_code") {
    // データベースにある全ての出席コードを取得する
    $classname = $data->classname;
    $db_filename = $classname . '.db';
    if (file_exists($db_filename)) {
        $db = new SQLite3($db_filename);
        $results = $db->query('SELECT * FROM users');
        $res = array(
            "message" => 'Success',
            "data" => array()
        );
        while ($row = $results->fetchArray()) {
            $timestamp = $row['timestamp'];
            $id = $row['id'];
            $classname = $row['classname'];
            $encoded_text = openssl_encrypt($timestamp . ',' . $classname . ',' . $id, 'AES-128-ECB', $key);
            array_push($res["data"], array(
                "encoded_text" => $encoded_text,
                "timestamp" => $timestamp,
            ));
        }
    } else {
        $res = array(
            "message" => 'Error: Database not found',
        );
    }
} else if ($type == "get_all_attendance_data") {
    // データベースの情報を取得する
    $classname = $data->classname;
    $db_filename = $classname . '.db';
    if (file_exists($db_filename)) {
        $db = new SQLite3($db_filename);
        $results = $db->query('SELECT * FROM users');
        $res = array(
            "message" => 'Success',
            "data" => array()
        );
        while ($row = $results->fetchArray()) {
            array_push($res["data"], array(
                "timestamp" => $row['timestamp'],
                "id" => $row['id'],
                "classname" => $row['classname']
            ));
        }
    } else {
        $res = array(
            "message" => 'Error: Database not found',
        );
    }
} else {
    $res = array(
        "message" => 'Error: Invalid Access',
    );
}

// echoすると返せる
echo json_encode($res); // json形式にして返す

//print("hello from service.php");
//print($_SERVER["REMOTE_ADDR"]);
//print("end from service.php");
// if( $_SERVER["REMOTE_ADDR"] != '157.7.106.95' ){
//     print('Error: Invalid access');
// }
// else{
//     print("Access Granted");
// }
