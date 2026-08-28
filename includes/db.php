<?php
// includes/db.php

// Define MySQL connection parameters (can be extracted to config.php)
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'celia_chess');
define('DB_USER', 'root');
define('DB_PASS', '');

class DB {
    private static $pdo = null;

    public static function get() {
        if (self::$pdo === null) {
            $dbPath = __DIR__ . '/../database.sqlite';
            $dsn = "sqlite:" . $dbPath;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            try {
                self::$pdo = new PDO($dsn, null, null, $options);
                // Enable foreign keys for SQLite
                self::$pdo->exec('PRAGMA foreign_keys = ON;');
            } catch (\PDOException $e) {
                // Return generic error to avoid leaking credentials
                throw new \PDOException($e->getMessage(), (int)$e->getCode());
            }
        }
        return self::$pdo;
    }

    public static function query($sql, $params = []) {
        $stmt = self::get()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function fetch($sql, $params = []) {
        return self::query($sql, $params)->fetch();
    }

    public static function fetchAll($sql, $params = []) {
        return self::query($sql, $params)->fetchAll();
    }
}