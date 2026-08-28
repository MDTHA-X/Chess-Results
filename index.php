<?php
require_once __DIR__ . '/includes/auth.php';

// Auto-sync is_super for active sessions
if (isset($_SESSION['admin_id'])) {
    $adm = DB::fetch("SELECT is_super FROM admins WHERE id = ?", [$_SESSION['admin_id']]);
    if ($adm) {
        $_SESSION['is_super'] = (int)$adm['is_super'];
    }
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chess Results - Tournament Manager</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/style.css">
    <script>
        (function() {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            document.documentElement.setAttribute('data-theme', savedTheme);
        })();
    </script>
</head>
<body>
    <nav class="navbar">
        <div class="nav-container">
            <a href="#" class="brand">♔ Chess Results</a>
            <div class="nav-links flex items-center gap-2">
                <button id="themeToggleBtn" class="btn btn-outline" title="Toggle Theme" style="padding: 0.45rem 0.8rem; font-size: 1.1rem; line-height: 1; border-radius: 8px;">
                    <span id="themeIcon">🌙</span>
                </button>
                <?php if (isset($_SESSION['admin_id'])): ?>
                    <?php if (!empty($_SESSION['is_super'])): ?>
                        <a href="#admins" class="btn btn-outline">Admins</a>
                    <?php endif; ?>
                    <a href="#change-password" class="btn btn-outline btn-sm" title="Change Password" style="padding: 0.4rem 0.7rem; font-size: 0.85rem;">🔑 Password</a>
                    <span class="user-badge"><?= htmlspecialchars($_SESSION['username']) ?></span>
                    <button id="logoutBtn" class="btn btn-outline">Logout</button>
                <?php else: ?>
                    <a href="#login" class="btn btn-primary">Login</a>
                <?php endif; ?>
            </div>
        </div>
    </nav>

    <main id="app-root" class="container">
        <!-- Content injected by app.js -->
    </main>

    <!-- Templates -->
    <template id="tpl-loading">
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
    </template>

    <script>
        window.currentUser = <?= json_encode([
            'id' => $_SESSION['admin_id'] ?? null,
            'username' => $_SESSION['username'] ?? null,
            'is_super' => !empty($_SESSION['is_super'])
        ]) ?>;
        window.isAdmin = <?= isset($_SESSION['admin_id']) ? 'true' : 'false' ?>;
        window.isSuper = <?= !empty($_SESSION['is_super']) ? 'true' : 'false' ?>;
    </script>
    <script src="assets/app.js"></script>
</body>
</html>
