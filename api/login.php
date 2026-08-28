<?php
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';

    if (login($username, $password)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
    }
} else if ($method === 'DELETE') {
    logout();
    echo json_encode(['success' => true]);
    if (current_admin_id()) {
        echo json_encode([
            'logged_in' => true,
            'id' => $_SESSION['admin_id'],
            'username' => $_SESSION['username'],
            'is_super' => !empty($_SESSION['is_super'])
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
