<?php
// includes/db.php

// Load custom configuration if present
if (file_exists(__DIR__ . '/../config.php')) {
    require_once __DIR__ . '/../config.php';
}

if (!defined('DB_DRIVER')) define('DB_DRIVER', 'sqlite'); // 'mysql' or 'sqlite'
if (!defined('DB_HOST'))   define('DB_HOST', 'localhost');
if (!defined('DB_NAME'))   define('DB_NAME', 'celia_chess');
if (!defined('DB_USER'))   define('DB_USER', 'root');
if (!defined('DB_PASS'))   define('DB_PASS', '');

class DB {
    private static $pdo = null;
    private static $driver = null;

    public static function get() {
        if (self::$pdo === null) {
            $driver = strtolower(DB_DRIVER);
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                if ($driver === 'mysql') {
                    self::$driver = 'mysql';
                    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
                    self::$pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
                } else {
                    self::$driver = 'sqlite';
                    $dbPath = __DIR__ . '/../database.sqlite';
                    $dsn = "sqlite:" . $dbPath;
                    self::$pdo = new PDO($dsn, null, null, $options);
                    self::$pdo->exec('PRAGMA foreign_keys = ON;');
                }
            } catch (\PDOException $e) {
                throw new \PDOException($e->getMessage(), (int)$e->getCode());
            }
        }
        return self::$pdo;
    }

    public static function isMysql() {
        self::get();
        return self::$driver === 'mysql';
    }

    public static function query($sql, $params = []) {
        // Auto-adapt query syntax between MySQL and SQLite
        if (self::isMysql()) {
            $sql = str_ireplace('INSERT OR IGNORE INTO', 'INSERT IGNORE INTO', $sql);
        } else {
            $sql = str_ireplace('INSERT IGNORE INTO', 'INSERT OR IGNORE INTO', $sql);
        }
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