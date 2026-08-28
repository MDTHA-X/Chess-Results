<?php
// includes/auth.php
require_once __DIR__ . '/db.php';

session_start();

function login($username, $password) {
    $admin = DB::fetch("SELECT * FROM admins WHERE username = ?", [$username]);
    if ($admin) {
        if (password_verify($password, $admin['password_hash'])) {
            $_SESSION['admin_id'] = (int)$admin['id'];
            $_SESSION['username'] = $admin['username'];
            $_SESSION['is_super'] = (int)($admin['is_super'] ?? 0);
            return true;
        }
    }
    return false;
}

function logout() {
    session_destroy();
}

function require_login() {
    if (!isset($_SESSION['admin_id'])) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}

function is_super_admin() {
    if (!isset($_SESSION['admin_id'])) return false;
    if (!isset($_SESSION['is_super'])) {
        $adm = DB::fetch("SELECT is_super FROM admins WHERE id = ?", [$_SESSION['admin_id']]);
        if ($adm) {
            $_SESSION['is_super'] = (int)$adm['is_super'];
        }
    }
    return !empty($_SESSION['is_super']);
}

function require_super_admin() {
    require_login();
    if (!is_super_admin()) {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Super Admin access required']);
        exit;
    }
}

function current_admin_id() {
    return $_SESSION['admin_id'] ?? null;
}

function can_manage_tournament($tournament_id) {
    if (!isset($_SESSION['admin_id'])) return false;
    if (is_super_admin()) return true;

    $admin_id = (int)$_SESSION['admin_id'];
    $t = DB::fetch("SELECT admin_id FROM tournaments WHERE id = ?", [$tournament_id]);
    if ($t && (int)$t['admin_id'] === $admin_id) return true;

    $assigned = DB::fetch("SELECT id FROM tournament_admins WHERE tournament_id = ? AND admin_id = ?", [$tournament_id, $admin_id]);
    return !empty($assigned);
}

function require_tournament_admin($tournament_id) {
    require_login();
    if (!can_manage_tournament($tournament_id)) {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: You are not assigned to manage this tournament']);
        exit;
    }
}
