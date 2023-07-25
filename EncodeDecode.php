<?PHP

// key.phpを読み込む
require_once('key.php');
//$key = '2gz0msd2hAhY1FNzcbanvZE20gtawc123';



$raw = file_get_contents('php://input'); // POSTされた生のデータを受け取る
$data = json_decode($raw); // json形式をphp変数に変換

//$res = $data; // やりたい処理
$type = $data->type;
//echo json_encode($data); // json形式にして返す
//return;
if( $type == "encode_generator"){
 
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
*/
else if( $type=="registration"){
    $timestamp = $data->timestamp;
    $id = $data->id;

    // タイムスタンプをデコード（読める形式になる）
    $timestamp = openssl_decrypt($timestamp, 'AES-128-ECB',  $key);
    
    if( (time()-$timestamp) < 31){
        $encoded_text = $timestamp.','.$id;
        $encoded_text = openssl_encrypt($encoded_text, 'AES-128-ECB',  $key);
        $res = array(
            "message" => 'Success',
            "encoded_text" => $encoded_text
        );
    }
    else{
        $res = array(
            "message" => 'Error: Timeout',
        );
    }
}
/* スペシャルクーポン発行
TAが学修番号を聞いて発行する特別な授業コード
*/
else if( $type == "b83hgAnzjhdg1" ){
    
    if( $data->date == "no"){
        $timestamp = time();
        $encoded_text = openssl_encrypt($timestamp.','.$data->id,'AES-128-ECB', $key);
    }
    else{
        $timestamp = $data->date;
        $encoded_text = openssl_encrypt($data->date.','.$data->id,'AES-128-ECB', $key);
    }

    $res = array(
        "message" => 'Success',
        "encoded_text" => $encoded_text,
        "timestamp" => $timestamp,
    );
}
else if( $type == "check"){
    $encoded_text = $data->encoded_text;
    $decoded_text = openssl_decrypt($encoded_text, 'AES-128-ECB',$key);
    if( $decoded_text == false ){
        $res = array(
            "message" => 'Error: Invalid encoded string',
            "decoded_text" => $decoded_text
        );
    }
    else{
        $res = array(
            "message" => 'Success',
            "decoded_text" => $decoded_text
        );
    }
    
}
else{
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
?>
