<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=10000', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS celia_chess CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "Database created or exists.\n";
    
    // Select database
    $pdo->exec("USE celia_chess");
    
    // Load schema
    $schema = file_get_contents('schema.sql');
    if ($schema) {
        $pdo->exec($schema);
        echo "Schema imported successfully.\n";
    } else {
        echo "Could not read schema.sql\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
