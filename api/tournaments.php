<?php
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    $slug = $_GET['slug'] ?? null;
    if ($slug) {
        $tournament = DB::fetch("SELECT * FROM tournaments WHERE slug = ?", [$slug]);
        if (!$tournament) {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
            exit;
        }
        $tId = (int)$tournament['id'];
        $tournament['can_manage'] = can_manage_tournament($tId);
        $tournament['admins'] = DB::fetchAll("SELECT a.id, a.username FROM tournament_admins ta JOIN admins a ON ta.admin_id = a.id WHERE ta.tournament_id = ?", [$tId]);
        echo json_encode($tournament);
    } else if ($id) {
        $tournament = DB::fetch("SELECT * FROM tournaments WHERE id = ?", [$id]);
        if (!$tournament) {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
            exit;
        }
        $tId = (int)$tournament['id'];
        $tournament['can_manage'] = can_manage_tournament($tId);
        $tournament['admins'] = DB::fetchAll("SELECT a.id, a.username FROM tournament_admins ta JOIN admins a ON ta.admin_id = a.id WHERE ta.tournament_id = ?", [$tId]);
        echo json_encode($tournament);
    } else {
        $tournaments = DB::fetchAll("SELECT * FROM tournaments ORDER BY created_at DESC");
        foreach ($tournaments as &$t) {
            $t['can_manage'] = can_manage_tournament((int)$t['id']);
        }
        unset($t);
        echo json_encode($tournaments);
    }
} else if ($method === 'POST') {
    require_login();
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? 'create';

    if ($action === 'assign_admin') {
        $tournament_id = (int)($input['tournament_id'] ?? 0);
        $admin_id = (int)($input['admin_id'] ?? 0);
        
        require_tournament_admin($tournament_id);
        
        if (!$tournament_id || !$admin_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Tournament ID and Admin ID are required']);
            exit;
        }
        
        try {
            DB::query("INSERT OR IGNORE INTO tournament_admins (tournament_id, admin_id, created_at) VALUES (?, ?, ?)", [$tournament_id, $admin_id, time()]);
        } catch (\Exception $e) {
            DB::query("INSERT IGNORE INTO tournament_admins (tournament_id, admin_id, created_at) VALUES (?, ?, ?)", [$tournament_id, $admin_id, time()]);
        }
        
        echo json_encode(['success' => true]);
        exit;
    } else if ($action === 'remove_admin') {
        $tournament_id = (int)($input['tournament_id'] ?? 0);
        $admin_id = (int)($input['admin_id'] ?? 0);
        
        require_tournament_admin($tournament_id);
        
        if (!$tournament_id || !$admin_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Tournament ID and Admin ID are required']);
            exit;
        }
        
        DB::query("DELETE FROM tournament_admins WHERE tournament_id = ? AND admin_id = ?", [$tournament_id, $admin_id]);
        echo json_encode(['success' => true]);
        exit;
    }

    $name = $input['name'] ?? '';
    $slug = $input['slug'] ?? '';
    $type = $input['type'] ?? 'intradept';
    $time_control = $input['time_control'] ?? '10+5';
    $rounds_count = $input['rounds_count'] ?? 7;
    $admin_id = current_admin_id();
    
    if (!$name || !$slug) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and slug are required']);
        exit;
    }

    try {
        DB::query(
            "INSERT INTO tournaments (name, slug, type, time_control, rounds_count, admin_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [$name, $slug, $type, $time_control, $rounds_count, $admin_id, time()]
        );
        $id = DB::get()->lastInsertId();
        try {
            DB::query("INSERT OR IGNORE INTO tournament_admins (tournament_id, admin_id, created_at) VALUES (?, ?, ?)", [$id, $admin_id, time()]);
        } catch (\Exception $e) {
            DB::query("INSERT IGNORE INTO tournament_admins (tournament_id, admin_id, created_at) VALUES (?, ?, ?)", [$id, $admin_id, time()]);
        }
        
        $created = DB::fetch("SELECT * FROM tournaments WHERE id = ?", [$id]);
        $created['can_manage'] = true;
        echo json_encode($created);
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode(['error' => 'Slug already exists or database error: ' . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
