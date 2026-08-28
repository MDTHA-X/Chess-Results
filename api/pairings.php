<?php
require_once __DIR__ . '/../includes/auth.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $pairing_id = $input['pairing_id'] ?? null;
    $result = $input['result'] ?? null; // '1-0', '0-1', '1/2', '+', '-'
    
    if (!$pairing_id || !$result) {
        http_response_code(400);
        echo json_encode(['error' => 'pairing_id and result are required']);
        exit;
    }

    $p = DB::fetch("SELECT r.tournament_id FROM pairings p JOIN rounds r ON p.round_id = r.id WHERE p.id = ?", [$pairing_id]);
    if (!$p) {
        http_response_code(404);
        echo json_encode(['error' => 'Pairing not found']);
        exit;
    }
    require_tournament_admin($p['tournament_id']);
    
    DB::query("UPDATE pairings SET result = ? WHERE id = ?", [$result, $pairing_id]);
    echo json_encode(['success' => true]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
