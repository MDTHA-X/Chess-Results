<?php
require_once __DIR__ . '/includes/db.php';

try {
    $pdo = DB::get();
    $schema = file_get_contents(__DIR__ . '/schema_sqlite.sql');
    if ($schema) {
        // SQLite PDO doesn't always support multiple statements in a single exec call reliably if they are complex, but for basic schemas it usually works.
        // Let's split by ';' just in case.
        $statements = explode(';', $schema);
        foreach ($statements as $statement) {
            $sql = trim($statement);
            if (!empty($sql)) {
                $pdo->exec($sql);
            }
        }
        echo "SQLite database initialized successfully.\n";
    } else {
        echo "Could not read schema_sqlite.sql\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
