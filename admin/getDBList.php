<?php
$dir = "../"; // ディレクトリのパスを指定

$files = scandir($dir);
$db_files = [];

foreach ($files as $file) {
    if (pathinfo($file, PATHINFO_EXTENSION) === 'db') {
        $db_files[] = $file;
    }
}

echo json_encode($db_files);
