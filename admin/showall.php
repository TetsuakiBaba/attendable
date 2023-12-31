<?php

// Connect to the SQLite database
$db = new SQLite3('../ID2023.db');

// Get the list of all tables in the database
$tablesQuery = $db->query("SELECT name FROM sqlite_master WHERE type='table';");

echo "<h1>Database Contents</h1>";

while ($table = $tablesQuery->fetchArray(SQLITE3_ASSOC)) {
    $tableName = $table['name'];

    echo "<h2>Table: $tableName</h2>";

    // Get all records from the table
    $result = $db->query("SELECT * FROM $tableName");

    // Fetch column names (assuming at least one row exists)
    $columns = $result->numColumns();
    $columnNames = [];
    for ($i = 0; $i < $columns; $i++) {
        array_push($columnNames, $result->columnName($i));
    }

    // Print table headers
    echo "<table border='1'><tr>";
    foreach ($columnNames as $name) {
        echo "<th>$name</th>";
    }
    echo "</tr>";

    // Print table rows
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        echo "<tr>";
        foreach ($columnNames as $name) {
            echo "<td>{$row[$name]}</td>";
        }
        echo "</tr>";
    }

    echo "</table>";
}
