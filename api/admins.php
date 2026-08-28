<?php
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    require_login();
    // Super admins can view all admins; tournament owners can also query the list to assign arbiters
    $admins = DB::fetchAll("SELECT id, username, is_super, created_at FROM admins ORDER BY id ASC");
    
    // Attach assigned tournament IDs for each admin
    foreach ($admins as &$adm) {
        $assigned = DB::fetchAll("SELECT t.id, t.name, t.slug FROM tournament_admins ta JOIN tournaments t ON ta.tournament_id = t.id WHERE ta.admin_id = ?", [$adm['id']]);
        $adm['tournaments'] = $assigned;
        $adm['is_super'] = (int)$adm['is_super'];
    }
    unset($adm);
    
    echo json_encode($admins);
} else if ($method === 'POST') {
    require_super_admin();
    $input = json_decode(file_get_contents('php://input'), true);
    
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    $is_super = !empty($input['is_super']) ? 1 : 0;
    
    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password are required']);
        exit;
    }
    
    // Check if username already exists
    $existing = DB::fetch("SELECT id FROM admins WHERE username = ?", [$username]);
    if ($existing) {
        http_response_code(400);
        echo json_encode(['error' => 'An admin with this username already exists']);
        exit;
    }
    
    $hash = password_hash($password, PASSWORD_DEFAULT);
    
    try {
        DB::query("INSERT INTO admins (username, password_hash, is_super, created_at) VALUES (?, ?, ?, ?)", [
            $username,
            $hash,
            $is_super,
            time()
        ]);
        $newId = DB::get()->lastInsertId();
        
        // Optional initial tournament assignments
        if (!empty($input['tournament_ids']) && is_array($input['tournament_ids'])) {
            foreach ($input['tournament_ids'] as $tId) {
                DB::query("INSERT OR IGNORE INTO tournament_admins (tournament_id, admin_id, created_at) VALUES (?, ?, ?)", [$tId, $newId, time()]);
            }
        }
        
        echo json_encode(['success' => true, 'id' => $newId, 'username' => $username]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create admin: ' . $e->getMessage()]);
    }
} else if ($method === 'PUT') {
    require_super_admin();
    $input = json_decode(file_get_contents('php://input'), true);
    $adminId = (int)($input['id'] ?? 0);
    $newPassword = $input['password'] ?? null;
    
    if (!$adminId) {
        http_response_code(400);
        echo json_encode(['error' => 'Admin ID is required']);
        exit;
    }
    
    if (!empty($newPassword)) {
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        DB::query("UPDATE admins SET password_hash = ? WHERE id = ?", [$hash, $adminId]);
    }
    
    echo json_encode(['success' => true]);
} else if ($method === 'DELETE') {
    require_super_admin();
    $id = (int)($_GET['id'] ?? 0);
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'Admin ID is required']);
        exit;
    }
    
    if ($id === (int)$_SESSION['admin_id']) {
        http_response_code(400);
        echo json_encode(['error' => 'You cannot delete your own account']);
        exit;
    }
    
    $target = DB::fetch("SELECT * FROM admins WHERE id = ?", [$id]);
    if (!$target) {
        http_response_code(404);
        echo json_encode(['error' => 'Admin not found']);
        exit;
    }
    
    if ((int)$target['is_super'] === 1) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot delete a Super Admin account']);
        exit;
    }
    
    DB::query("DELETE FROM admins WHERE id = ?", [$id]);
    echo json_encode(['success' => true]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
