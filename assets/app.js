document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app-root');
    const logoutBtn = document.getElementById('logoutBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

    function updateThemeIcon(theme) {
        if (!themeIcon) return;
        themeIcon.textContent = theme === 'light' ? '☀️' : '🌙';
        if (themeToggleBtn) {
            themeToggleBtn.setAttribute('title', theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode');
        }
    }

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeIcon(currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const nextTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('theme', nextTheme);
            updateThemeIcon(nextTheme);
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('api/login.php', { method: 'DELETE' });
            window.location.hash = '#login';
            window.location.reload();
        });
    }

    function renderLoading() {
        const tpl = document.getElementById('tpl-loading');
        appRoot.innerHTML = '';
        appRoot.appendChild(tpl.content.cloneNode(true));
    }

    async function navigate() {
        const hash = window.location.hash || '#tournaments';
        renderLoading();

        if (hash === '#login') {
            renderLogin();
        } else if (hash === '#change-password') {
            renderChangePassword();
        } else if (hash === '#tournaments') {
            renderTournaments();
        } else if (hash === '#admins') {
            if (!window.isSuper) {
                window.location.hash = '#tournaments';
                return;
            }
            renderAdmins();
        } else if (hash === '#new-tournament') {
            renderNewTournament();
        } else if (hash.startsWith('#tournament/')) {
            const id = hash.split('/')[1];
            renderTournamentDetail(id);
        } else {
            appRoot.innerHTML = '<div class="card text-center"><h1>404 Not Found</h1></div>';
        }
    }

    function renderChangePassword() {
        if (!window.isAdmin) {
            window.location.hash = '#login';
            return;
        }

        const username = window.currentUser && window.currentUser.username ? window.currentUser.username : 'Your Account';

        appRoot.innerHTML = `
            <div class="card" style="max-width: 440px; margin: 3rem auto; padding: 2rem;">
                <div class="text-center mb-4">
                    <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔑</div>
                    <h2 style="margin-bottom: 0.25rem;">Change Password</h2>
                    <p class="text-muted" style="font-size: 0.9rem;">Logged in as <strong>${username}</strong></p>
                </div>

                <div id="changePassAlert" style="display: none; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: 0.9rem;"></div>

                <form id="changePasswordForm">
                    <div class="form-group">
                        <label class="form-label">Current (Old) Password</label>
                        <input type="password" id="oldPassword" class="form-control" required placeholder="Enter current password" autocomplete="current-password">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <input type="password" id="newPassword" class="form-control" required placeholder="Enter new password" autocomplete="new-password">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Confirm New Password</label>
                        <input type="password" id="confirmPassword" class="form-control" required placeholder="Re-enter new password" autocomplete="new-password">
                    </div>

                    <button type="submit" id="btnSubmitChangePass" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">Update Password</button>
                </form>
            </div>
        `;

        const form = document.getElementById('changePasswordForm');
        const alertBox = document.getElementById('changePassAlert');
        const submitBtn = document.getElementById('btnSubmitChangePass');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            alertBox.style.display = 'none';

            const oldPass = document.getElementById('oldPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;

            if (newPass !== confirmPass) {
                alertBox.style.display = 'block';
                alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
                alertBox.style.color = '#ef4444';
                alertBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                alertBox.textContent = 'New passwords do not match. Please re-enter.';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';

            try {
                const res = await fetch('api/admins.php', {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        old_password: oldPass,
                        new_password: newPass,
                        confirm_password: confirmPass
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    alertBox.style.display = 'block';
                    alertBox.style.background = 'rgba(16, 185, 129, 0.15)';
                    alertBox.style.color = 'var(--success)';
                    alertBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                    alertBox.textContent = 'Password changed successfully! Redirecting...';
                    form.reset();
                    setTimeout(() => {
                        window.location.hash = '#tournaments';
                    }, 1200);
                } else {
                    alertBox.style.display = 'block';
                    alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
                    alertBox.style.color = '#ef4444';
                    alertBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                    alertBox.textContent = data.error || 'Failed to update password.';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Update Password';
                }
            } catch (err) {
                alertBox.style.display = 'block';
                alertBox.style.background = 'rgba(239, 68, 68, 0.15)';
                alertBox.style.color = '#ef4444';
                alertBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                alertBox.textContent = 'Network error while updating password.';
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update Password';
            }
        });
    }

    async function renderAdmins() {
        const [adminsRes, tourneysRes] = await Promise.all([
            fetch('api/admins.php'),
            fetch('api/tournaments.php')
        ]);
        
        if (!adminsRes.ok) {
            appRoot.innerHTML = '<div class="card text-center"><h1>Access Denied</h1><p class="text-muted">You must be a Super Admin to view this page.</p></div>';
            return;
        }

        const admins = await adminsRes.json();
        const tournaments = await tourneysRes.json();

        let html = `
            <div class="page-header">
                <div>
                    <h1>Admin & Arbiter Management</h1>
                    <p class="text-muted mt-2">Create arbiters and manage tournament permissions.</p>
                </div>
            </div>

            <div class="grid grid-cols-2 mb-4" style="align-items: start;">
                <!-- Create Admin Card -->
                <div class="card">
                    <h3 class="mb-4">Create New Admin / Arbiter</h3>
                    <form id="createAdminForm">
                        <div class="form-group">
                            <label class="form-label">Username</label>
                            <input type="text" id="newAdminUsername" class="form-control" required placeholder="e.g. arbiter_john">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password</label>
                            <input type="password" id="newAdminPassword" class="form-control" required placeholder="••••••••">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Role</label>
                            <select id="newAdminRole" class="form-control">
                                <option value="0">Arbiter (Assigned Tournaments Only)</option>
                                <option value="1">Super Admin (Full System Access)</option>
                            </select>
                        </div>
                        <div class="form-group" id="assignTourneysGroup">
                            <label class="form-label">Assign Tournaments (Optional)</label>
                            <div style="max-height: 140px; overflow-y: auto; background: var(--input-bg); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem;">
                                ${tournaments.length === 0 ? '<span class="text-muted" style="font-size: 0.85rem;">No tournaments created yet</span>' : tournaments.map(t => `
                                    <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; font-size: 0.9rem; cursor: pointer;">
                                        <input type="checkbox" class="assign-tourney-cb" value="${t.id}">
                                        ${t.name}
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">Create Account</button>
                    </form>
                </div>

                <!-- Admin List Card -->
                <div class="card">
                    <h3 class="mb-4">Registered Admins & Arbiters (${admins.length})</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Assigned</th>
                                    <th style="text-align: right; white-space: nowrap;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${admins.map(a => {
                                    const isSelf = window.currentUser && (String(window.currentUser.id) === String(a.id) || window.currentUser.username === a.username);
                                    const tourneysList = a.tournaments && a.tournaments.length > 0
                                        ? a.tournaments.map(t => `<span class="badge" style="background: var(--bg-card-hover); margin: 2px 2px; font-size: 0.75rem;">${t.name}</span>`).join(' ')
                                        : (a.is_super ? '<span class="text-muted" style="font-size: 0.8rem;">All Tournaments</span>' : '<span class="text-muted" style="font-size: 0.8rem;">None</span>');
                                    
                                    let actionBtn = '';
                                    if (isSelf) {
                                        actionBtn = `<a href="#change-password" class="btn btn-outline btn-sm">Change Password</a>`;
                                    } else {
                                        actionBtn = `<button class="btn btn-outline btn-sm btn-delete-admin" style="border-color: #ef4444; color: #ef4444;" data-id="${a.id}" data-name="${a.username}">Delete</button>`;
                                    }

                                    return `
                                        <tr>
                                            <td style="white-space: nowrap;">
                                                <strong>${a.username}</strong>
                                                ${isSelf ? ' <span class="text-muted" style="font-size: 0.8rem;">(You)</span>' : ''}
                                            </td>
                                            <td style="white-space: nowrap;">
                                                <span class="badge ${a.is_super ? 'badge-completed' : 'badge-draft'}">
                                                    ${a.is_super ? 'Super Admin' : 'Arbiter'}
                                                </span>
                                            </td>
                                            <td>${tourneysList}</td>
                                            <td style="white-space: nowrap; text-align: right;">
                                                ${actionBtn}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        appRoot.innerHTML = html;

        // Bind create form
        document.getElementById('createAdminForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('newAdminUsername').value.trim();
            const password = document.getElementById('newAdminPassword').value;
            const isSuper = parseInt(document.getElementById('newAdminRole').value) || 0;
            const selectedTourneys = Array.from(document.querySelectorAll('.assign-tourney-cb:checked')).map(cb => parseInt(cb.value));

            const res = await fetch('api/admins.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username,
                    password,
                    is_super: isSuper,
                    tournament_ids: selectedTourneys
                })
            });

            if (res.ok) {
                renderAdmins();
            } else {
                const err = await res.json();
                alert('Error creating admin: ' + (err.error || 'Unknown error'));
            }
        });

        // Bind delete buttons
        document.querySelectorAll('.btn-delete-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
                const admId = btn.dataset.id;
                const admName = btn.dataset.name;
                if (!confirm(`Are you sure you want to delete admin account "${admName}"?`)) return;

                const res = await fetch(`api/admins.php?id=${admId}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    renderAdmins();
                } else {
                    const err = await res.json();
                    alert('Error deleting admin: ' + (err.error || 'Unknown error'));
                }
            });
        });
    }

    function renderLogin() {
        appRoot.innerHTML = `
            <div class="card" style="max-width: 400px; margin: 4rem auto;">
                <h2 class="mb-4 text-center">Admin Login</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Username</label>
                        <input type="text" id="username" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%">Login</button>
                    <p id="loginError" style="color: var(--danger); margin-top: 1rem; text-align: center; display: none;">Invalid credentials</p>
                </form>
            </div>
        `;

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const res = await fetch('api/login.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: document.getElementById('username').value,
                    password: document.getElementById('password').value
                })
            });
            if (res.ok) {
                window.location.hash = '#tournaments';
                window.location.reload();
            } else {
                document.getElementById('loginError').style.display = 'block';
            }
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    async function renderTournaments() {
        const res = await fetch('api/tournaments.php');
        const tournaments = await res.json();
        
        let html = `
            <div class="page-header">
                <h1>Tournaments</h1>
                ${window.isAdmin ? '<a href="#new-tournament" class="btn btn-primary">+ New Tournament</a>' : ''}
            </div>
            <div class="flex" style="flex-direction: column; gap: 1rem;">
        `;

        if (tournaments.length === 0) {
            html += `<div class="card"><p class="text-muted text-center">No tournaments found.</p></div>`;
        } else {
            tournaments.forEach(t => {
                const canManage = Boolean(window.isSuper || t.can_manage);

                html += `
                    <div class="card flex justify-between items-center" style="padding: 1.2rem 1.5rem; transition: transform 0.2s, box-shadow 0.2s;">
                        <a href="#tournament/${t.id}" style="text-decoration: none; flex: 1; min-width: 0;">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 style="color: var(--text-main); margin: 0; font-size: 1.15rem;">${t.name}</h3>
                                <span class="badge badge-${t.status}">${t.status}</span>
                            </div>
                            <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">
                                Rounds: ${t.rounds_count} &nbsp;&bull;&nbsp; Time Control: ${t.time_control}
                            </p>
                        </a>
                        ${canManage ? `
                            <div class="flex gap-2 items-center" style="margin-left: 1.25rem; white-space: nowrap;">
                                <button class="btn btn-outline btn-sm btn-edit-tournament" data-id="${t.id}" data-name="${escapeHtml(t.name)}" data-time="${escapeHtml(t.time_control)}" data-rounds="${t.rounds_count}" data-status="${t.status}">
                                    Edit
                                </button>
                                <button class="btn btn-outline btn-sm btn-delete-tournament" style="border-color: #ef4444; color: #ef4444;" data-id="${t.id}" data-name="${escapeHtml(t.name)}">
                                    Delete
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }
        
        html += `</div>`;

        // Edit Tournament Modal markup
        html += `
            <div id="editTournamentModal" class="modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);">
                <div class="modal-content card" style="margin: 5% auto; padding: 25px; width: 90%; max-width: 500px; position: relative;">
                    <span class="close-edit-modal" style="position: absolute; right: 20px; top: 15px; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
                    <h3 class="mb-4">Edit Tournament Details</h3>
                    <form id="editTournamentForm">
                        <input type="hidden" id="editTournamentId">
                        <div class="form-group">
                            <label class="form-label">Tournament Name</label>
                            <input type="text" id="editTournamentName" class="form-control" required>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div class="form-group">
                                <label class="form-label">Total Rounds</label>
                                <input type="number" id="editTournamentRounds" class="form-control" min="1" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Time Control</label>
                                <input type="text" id="editTournamentTime" class="form-control" required placeholder="e.g. 10+5">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select id="editTournamentStatus" class="form-control">
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div class="flex justify-between items-center mt-4">
                            <button type="button" class="btn btn-outline close-edit-modal-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="btnSaveTournamentEdit">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        appRoot.innerHTML = html;

        // Modal bindings
        const editModal = document.getElementById('editTournamentModal');
        if (editModal) {
            const closeModal = () => { editModal.style.display = 'none'; };
            editModal.querySelectorAll('.close-edit-modal, .close-edit-modal-btn').forEach(el => el.addEventListener('click', closeModal));
            window.addEventListener('click', (e) => {
                if (e.target === editModal) closeModal();
            });

            document.querySelectorAll('.btn-edit-tournament').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.getElementById('editTournamentId').value = btn.dataset.id;
                    document.getElementById('editTournamentName').value = btn.dataset.name;
                    document.getElementById('editTournamentTime').value = btn.dataset.time;
                    document.getElementById('editTournamentRounds').value = btn.dataset.rounds;
                    document.getElementById('editTournamentStatus').value = btn.dataset.status;
                    editModal.style.display = 'block';
                });
            });

            document.getElementById('editTournamentForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const saveBtn = document.getElementById('btnSaveTournamentEdit');
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';

                const tId = parseInt(document.getElementById('editTournamentId').value);
                const name = document.getElementById('editTournamentName').value.trim();
                const time_control = document.getElementById('editTournamentTime').value.trim();
                const rounds_count = parseInt(document.getElementById('editTournamentRounds').value);
                const status = document.getElementById('editTournamentStatus').value;

                const res = await fetch('api/tournaments.php', {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        id: tId,
                        name,
                        time_control,
                        rounds_count,
                        status
                    })
                });

                if (res.ok) {
                    closeModal();
                    renderTournaments();
                } else {
                    const err = await res.json();
                    alert('Error updating tournament: ' + (err.error || 'Unknown error'));
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Save Changes';
                }
            });
        }

        // Delete Tournament bindings
        document.querySelectorAll('.btn-delete-tournament').forEach(btn => {
            btn.addEventListener('click', async () => {
                const tId = btn.dataset.id;
                const tName = btn.dataset.name;
                if (!confirm(`Are you sure you want to permanently delete tournament "${tName}"?\n\nWARNING: This will permanently delete all players, rounds, pairings, and match history for this tournament!`)) return;

                const res = await fetch(`api/tournaments.php?id=${tId}`, {
                    method: 'DELETE'
                });

                if (res.ok) {
                    renderTournaments();
                } else {
                    const err = await res.json();
                    alert('Error deleting tournament: ' + (err.error || 'Unknown error'));
                }
            });
        });
    }

    function renderNewTournament() {
        appRoot.innerHTML = `
            <div class="card" style="max-width: 600px; margin: 0 auto;">
                <h2 class="mb-4">Create Tournament</h2>
                <form id="newTournamentForm">
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" id="t-name" class="form-control" required placeholder="e.g. Summer Open 2026">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Slug</label>
                        <input type="text" id="t-slug" class="form-control" required placeholder="summer-open-2026">
                    </div>
                    <div class="grid grid-cols-2">
                        <div class="form-group">
                            <label class="form-label">Rounds</label>
                            <input type="number" id="t-rounds" class="form-control" value="7" min="1" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Time Control</label>
                            <input type="text" id="t-time" class="form-control" value="10+5" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary mt-4">Create</button>
                </form>
            </div>
        `;

        const nameInput = document.getElementById('t-name');
        const slugInput = document.getElementById('t-slug');
        
        nameInput.addEventListener('input', () => {
            if (!slugInput.value || slugInput.value === nameInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
                slugInput.value = nameInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            }
        });

        document.getElementById('newTournamentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const res = await fetch('api/tournaments.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: nameInput.value,
                    slug: slugInput.value,
                    rounds_count: document.getElementById('t-rounds').value,
                    time_control: document.getElementById('t-time').value
                })
            });
            if (res.ok) {
                const created = await res.json();
                window.location.hash = '#tournament/' + created.id;
            } else {
                alert('Error creating tournament');
            }
        });
    }

    async function renderTournamentDetail(id, initialTab = 'standings', initialRound = null) {
        // We fetch tournament info, players, rounds and standings
        const [tRes, pRes, rRes] = await Promise.all([
            fetch('api/tournaments.php?id=' + id),
            fetch('api/players.php?tournament_id=' + id),
            fetch('api/rounds.php?tournament_id=' + id + '&standings=true')
        ]);

        const t = await tRes.json();
        const players = await pRes.json();
        const data = await rRes.json();
        const rounds = data.rounds;
        const mainStandings = data.standings;

        let activeTab = initialTab;
        let activeRound = initialRound || (rounds.length > 0 ? rounds[rounds.length - 1].number : null);
        let activeSection = 'pairings'; // 'pairings' or 'standings'
        let editingPlayerId = null;
        const roundStandingsCache = {};

        async function fetchRoundStandings(roundNum) {
            if (roundStandingsCache[roundNum]) return;
            const res = await fetch('api/rounds.php?tournament_id=' + id + '&standings=true&after_round=' + roundNum);
            const rData = await res.json();
            roundStandingsCache[roundNum] = rData.standings;
            render();
        }

        function renderStandingsTable(stList, showTpr = false) {
            let sHtml = `<div class="card table-container"><table>
                <thead><tr>
                    <th>Rk</th><th>SNo</th><th>Title</th><th>Name</th><th>Rating</th><th>Pts</th><th>BH-1</th><th>BH</th><th>SB</th><th>Vict</th>${showTpr ? '<th>TPR</th>' : ''}
                </tr></thead><tbody>`;
            stList.forEach((st, i) => {
                const pl = players.find(x => x.id == st.playerId) || {};
                const title = st.title || pl.title || '';
                sHtml += `<tr>
                    <td>${i + 1}</td>
                    <td>${playerSeeds[st.playerId]}</td>
                    <td style="font-weight: 600; color: var(--primary);">${title}</td>
                    <td><a href="#" class="player-link" data-id="${st.playerId}" style="color: var(--primary); text-decoration: none;">${st.name}</a></td>
                    <td>${st.rating}</td>
                    <td style="font-weight: bold;">${st.score}</td>
                    <td>${st.medianBuchholz}</td>
                    <td>${st.buchholz}</td>
                    <td>${st.sonnebornBerger ?? 0}</td>
                    <td>${st.wins ?? 0}</td>
                    ${showTpr ? `<td>${st.tpr || '-'}</td>` : ''}
                </tr>`;
            });
            const colSpan = showTpr ? 11 : 10;
            if (stList.length === 0) sHtml += `<tr><td colspan="${colSpan}" class="text-center text-muted">No standings available yet</td></tr>`;
            sHtml += `</tbody></table></div>`;
            return sHtml;
        }

        // Pre-compute seeds based on rating
        const sortedForSeed = [...players].sort((a,b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return a.name.localeCompare(b.name);
        });
        const playerSeeds = {};
        sortedForSeed.forEach((p, idx) => {
            playerSeeds[p.id] = idx + 1;
        });
        
        function formatPlayerName(pId) {
            if (!pId) return 'Unknown';
            const pl = players.find(x => x.id == pId);
            if (!pl) return 'Unknown';
            const titleStr = pl.title ? pl.title + ' ' : '';
            return `(${playerSeeds[pl.id]}) <a href="#" class="player-link" data-id="${pl.id}" style="color: var(--primary); text-decoration: none;">${titleStr}${pl.name}</a> (${pl.rating})`;
        }

        function getFideDp(p) {
            if (p >= 1.0) return 800;
            if (p <= 0.0) return -800;
            return Math.round(-400 * Math.log(1/p - 1) / Math.LN10);
        }

        function showPlayerDetails(pId) {
            pId = parseInt(pId);
            const pl = players.find(x => x.id === pId);
            if (!pl) return;
            const st = mainStandings.find(x => x.playerId === pId);
            const rank = mainStandings.findIndex(x => x.playerId === pId) + 1;
            
            let games = [];
            rounds.filter(r => r.status === 'completed' || r.status === 'draft').forEach(r => {
                r.pairings.forEach(p => {
                    if (p.white_id === pId || p.black_id === pId || p.bye_for_id === pId) {
                        games.push({ round: r, pairing: p });
                    }
                });
            });

            let oppRatingsSum = 0;
            let oppCount = 0;
            let pointsScored = 0;
            let gamesHtml = `<div class="table-container" style="margin-top: 1rem;"><table>
                <thead><tr><th>Rd.</th><th>Bo.</th><th>SNo</th><th>Name</th><th>Rtg</th><th>Batch</th><th>Pts.</th><th>Res.</th></tr></thead>
                <tbody>`;

            games.forEach(g => {
                const isWhite = g.pairing.white_id === pId;
                const isBye = g.pairing.is_bye;
                let oppId = isWhite ? g.pairing.black_id : g.pairing.white_id;
                let opp = players.find(x => x.id === oppId);
                let oppSt = mainStandings.find(x => x.playerId === oppId);
                
                let sNo = isBye ? '-' : (playerSeeds[oppId] || '-');
                let oppName = isBye ? 'BYE' : (opp ? opp.name : '-');
                let oppRtg = isBye ? '-' : (opp ? opp.rating : '-');
                let oppBatch = isBye ? '-' : (opp ? (opp.batch || '-') : '-');
                let oppPts = isBye ? '-' : (oppSt ? oppSt.score : 0);
                
                let resStr = '-';
                if (g.round.status === 'completed' || g.pairing.result) {
                    if (isBye) {
                        pointsScored += 1;
                        resStr = '1';
                    } else if (g.pairing.result === '1-0') {
                        if (isWhite) { pointsScored += 1; resStr = '1'; } else { resStr = '0'; }
                    } else if (g.pairing.result === '0-1') {
                        if (!isWhite) { pointsScored += 1; resStr = '1'; } else { resStr = '0'; }
                    } else if (g.pairing.result === '1/2') {
                        pointsScored += 0.5;
                        resStr = '½';
                    }
                }
                
                if (!isBye && oppRtg !== '-') {
                    oppRatingsSum += parseInt(oppRtg);
                    oppCount++;
                }

                gamesHtml += `<tr>
                    <td>${g.round.number}</td>
                    <td>${g.pairing.board}</td>
                    <td>${sNo}</td>
                    <td><a href="#" class="player-link" data-id="${oppId}" style="color: var(--primary); text-decoration: none;">${oppName}</a></td>
                    <td>${oppRtg}</td>
                    <td>${oppBatch}</td>
                    <td>${oppPts}</td>
                    <td style="font-weight: bold;">${resStr}</td>
                </tr>`;
            });
            gamesHtml += `</tbody></table></div>`;

            let Ra = oppCount > 0 ? Math.round(oppRatingsSum / oppCount) : 0;
            let Rp = 0;
            if (oppCount > 0) {
                let p = pointsScored / oppCount;
                let dp = getFideDp(p);
                Rp = Ra + dp;
            }

            let html = `
                <h2 style="margin-bottom: 1rem; border-bottom: 2px solid var(--border); padding-bottom: 0.5rem; margin-top: 0;">Player info</h2>
                <div style="display: grid; grid-template-columns: 150px 1fr; gap: 0.5rem; line-height: 1.6; margin-bottom: 1rem; text-align: left;">
                    <div style="color: var(--text-muted);">Name</div><div style="font-weight: 500;">${pl.name}</div>
                    <div style="color: var(--text-muted);">Title</div><div>${pl.title || '-'}</div>
                    <div style="color: var(--text-muted);">Sex</div><div>${pl.sex || '-'}</div>
                    <div style="color: var(--text-muted);">Batch</div><div>${pl.batch || '-'}</div>
                    <div style="color: var(--text-muted);">Starting rank</div><div>${playerSeeds[pId]}</div>
                    <div style="color: var(--text-muted);">Rating</div><div>${pl.rating}</div>
                    <div style="color: var(--text-muted);">Performance</div><div>${oppCount > 0 ? Rp : '-'}</div>
                    <div style="color: var(--text-muted);">Points</div><div>${st ? st.score : 0}</div>
                    <div style="color: var(--text-muted);">Rank</div><div>${rank}</div>
                </div>
                ${gamesHtml}
            `;
            
            document.getElementById('playerModalBody').innerHTML = html;
            
            // Rebind player links inside the modal!
            document.getElementById('playerModalBody').querySelectorAll('.player-link').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (e.target.dataset.id && e.target.dataset.id !== 'undefined') {
                        showPlayerDetails(e.target.dataset.id);
                    }
                });
            });

            document.getElementById('playerModal').style.display = 'block';
        }
        
        const canManage = Boolean(window.isSuper || t.can_manage);

        function render() {
            let html = `
                <div class="page-header">
                    <div>
                        <h1>${t.name}</h1>
                        <p class="text-muted mt-4">Rounds: ${rounds.length} / ${t.rounds_count} &nbsp;&bull;&nbsp; Players: ${players.length}</p>
                    </div>
                </div>
                
                <div class="tabs">
                    <div class="tab ${activeTab === 'standings' ? 'active' : ''}" data-tab="standings">Standings</div>
                    <div class="tab ${activeTab === 'rounds' ? 'active' : ''}" data-tab="rounds">Rounds</div>
                    <div class="tab ${activeTab === 'players' ? 'active' : ''}" data-tab="players">Players</div>
                    ${canManage ? `<div class="tab ${activeTab === 'arbiters' ? 'active' : ''}" data-tab="arbiters">Arbiters</div>` : ''}
                </div>
            `;

            if (activeTab === 'standings') {
                const isFinished = rounds.length >= t.rounds_count && rounds.length > 0 && rounds[rounds.length - 1].status === 'completed';
                html += renderStandingsTable(mainStandings, isFinished);
            } else if (activeTab === 'rounds') {
                html += `<div class="card mb-4 flex justify-between items-center">
                    <h3 class="mt-4">Pairings & Results</h3>
                    ${canManage && (rounds.length === 0 || rounds[rounds.length-1].status === 'completed') && rounds.length < t.rounds_count ? `<button id="btnGenerateRound" class="btn btn-primary">Generate Next Round</button>` : ''}
                </div>`;
                
                if (rounds.length > 0) {
                    html += `<div class="card mb-4" style="padding: 1.25rem 1.5rem;">
                        <div class="flex items-center gap-4 mb-3" style="flex-wrap: wrap;">
                            <span style="font-weight: 700; min-width: 70px; color: var(--text-muted);">Pairing:</span>
                            <div class="flex gap-2" style="flex-wrap: wrap;">
                                ${rounds.map(r => `
                                    <button class="btn btn-sm ${activeSection === 'pairings' && activeRound == r.number ? 'btn-primary' : 'btn-outline'} btn-nav-round" data-section="pairings" data-round="${r.number}">Rd ${r.number}</button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="flex items-center gap-4" style="flex-wrap: wrap;">
                            <span style="font-weight: 700; min-width: 70px; color: var(--text-muted);">Results:</span>
                            <div class="flex gap-2" style="flex-wrap: wrap;">
                                ${rounds.map(r => `
                                    <button class="btn btn-sm ${activeSection === 'standings' && activeRound == r.number ? 'btn-primary' : 'btn-outline'} btn-nav-round" data-section="standings" data-round="${r.number}">Rd ${r.number}</button>
                                `).join('')}
                            </div>
                        </div>
                    </div>`;
                    
                    const r = rounds.find(rx => rx.number == activeRound) || rounds[rounds.length - 1];

                    if (activeSection === 'pairings') {
                        html += `<div class="card mb-4">
                            <div class="flex justify-between items-center mb-4">
                                <h4>Round ${r.number} Pairings</h4>
                                <span class="badge badge-${r.status}">${r.status}</span>
                            </div>
                            <div class="table-container"><table>
                                <thead><tr><th>Bd</th><th>White</th><th>Result</th><th>Black</th></tr></thead>
                                <tbody>`;
                        r.pairings.forEach(p => {
                            let wName = p.is_bye ? '' : formatPlayerName(p.white_id);
                            let bName = p.is_bye ? formatPlayerName(p.bye_for_id) : formatPlayerName(p.black_id);
                            
                            let resultHtml = p.result || '-';
                            if (r.status === 'draft' && !p.is_bye && canManage) {
                                resultHtml = `
                                    <select class="form-control result-select" data-pairing="${p.id}" style="width: 100px; padding: 0.2rem;">
                                        <option value="" ${!p.result ? 'selected' : ''}>-</option>
                                        <option value="1-0" ${p.result === '1-0' ? 'selected' : ''}>1-0</option>
                                        <option value="1/2" ${p.result === '1/2' ? 'selected' : ''}>1/2</option>
                                        <option value="0-1" ${p.result === '0-1' ? 'selected' : ''}>0-1</option>
                                    </select>
                                `;
                            }
                            
                            html += `<tr>
                                <td>${p.board}</td>
                                <td>${wName}</td>
                                <td style="font-weight: bold; text-align: center;">${resultHtml}</td>
                                <td>${bName}</td>
                            </tr>`;
                        });
                        html += `</tbody></table></div>`;
                        
                        if (r.status === 'draft' && canManage) {
                            html += `<div class="flex" style="justify-content: space-between; margin-top: 1.5rem; align-items: center;">`;
                            html += `<button class="btn btn-outline btn-discard-round" style="border-color: #ef4444; color: #ef4444;" data-round="${r.id}">Undo Pairings</button>`;
                            html += `<button class="btn btn-success btn-complete-round" data-round="${r.id}">Complete Round ${r.number}</button>
                            </div>`;
                        } else if (r.status === 'completed' && canManage && r.number === rounds[rounds.length - 1].number) {
                            html += `<div class="flex" style="justify-content: flex-end; margin-top: 1.5rem;">
                                <button class="btn btn-outline btn-reopen-round" data-round="${r.id}">Reopen Round to Edit Results</button>
                            </div>`;
                        }
                        html += `</div>`;
                    } else {
                        if (r.status === 'draft') {
                            html += `<div class="card"><div class="text-center text-muted" style="padding: 2rem 0;">Round ${r.number} is still in draft. Standings will be finalized once Round ${r.number} is completed.</div></div>`;
                        } else if (roundStandingsCache[r.number]) {
                            html += `<div class="mb-4">
                                <h3 class="mb-4">Standings after Round ${r.number}</h3>
                                ${renderStandingsTable(roundStandingsCache[r.number])}
                            </div>`;
                        } else {
                            html += `<div class="card loading-state"><div class="spinner"></div><p>Loading standings after Round ${r.number}...</p></div>`;
                            fetchRoundStandings(r.number);
                        }
                    }
                } else {
                    html += `<div class="card"><div class="text-center text-muted" style="padding: 2rem 0;">No rounds generated yet.</div></div>`;
                }
            } else if (activeTab === 'players') {
                if (canManage) {
                    if (rounds.length === 0) {
                        html += `<div class="card mb-4">
                            <h3 class="mb-4">Add Player</h3>
                            <form id="addPlayerForm" class="flex gap-2 items-center" style="flex-wrap: wrap;">
                                <input type="text" id="playerName" class="form-control" placeholder="Player Name" required style="flex: 1; min-width: 200px;">
                                <select id="playerTitle" class="form-control" style="width: 80px;">
                                    <option value="">Title</option>
                                    <option value="GM">GM</option>
                                    <option value="IM">IM</option>
                                    <option value="FM">FM</option>
                                    <option value="CM">CM</option>
                                    <option value="WGM">WGM</option>
                                    <option value="WIM">WIM</option>
                                    <option value="WFM">WFM</option>
                                    <option value="WCM">WCM</option>
                                </select>
                                <select id="playerSex" class="form-control" style="width: 80px;">
                                    <option value="M" selected>M</option>
                                    <option value="F">F</option>
                                </select>
                                <input type="text" id="playerBatch" class="form-control" placeholder="Batch" style="width: 100px;">
                                <input type="number" id="playerRating" class="form-control" placeholder="Rating" value="0" required style="width: 100px;">
                                <button type="submit" class="btn btn-primary">Add Player</button>
                            </form>
                        </div>`;
                    } else {
                        html += `<div class="card mb-4">
                            <h3 class="mb-4">Add Player</h3>
                            <p class="text-muted">Player additions are disabled after rounds have started.</p>
                        </div>`;
                    }
                }
                html += `<div class="card table-container"><table>
                    <thead><tr><th>Name</th><th>Title</th><th>Sex</th><th>Batch</th><th>Rating</th><th>Active</th>${canManage ? '<th>Actions</th>' : ''}</tr></thead>
                    <tbody>`;
                players.forEach(p => {
                    if (editingPlayerId === p.id) {
                        html += `<tr>
                            <td><input type="text" id="editName_${p.id}" class="form-control" value="${p.name}" style="width: 100%;"></td>
                            <td>
                                <select id="editTitle_${p.id}" class="form-control">
                                    <option value="" ${p.title === '' ? 'selected' : ''}></option>
                                    <option value="GM" ${p.title === 'GM' ? 'selected' : ''}>GM</option>
                                    <option value="IM" ${p.title === 'IM' ? 'selected' : ''}>IM</option>
                                    <option value="FM" ${p.title === 'FM' ? 'selected' : ''}>FM</option>
                                    <option value="CM" ${p.title === 'CM' ? 'selected' : ''}>CM</option>
                                    <option value="WGM" ${p.title === 'WGM' ? 'selected' : ''}>WGM</option>
                                    <option value="WIM" ${p.title === 'WIM' ? 'selected' : ''}>WIM</option>
                                    <option value="WFM" ${p.title === 'WFM' ? 'selected' : ''}>WFM</option>
                                    <option value="WCM" ${p.title === 'WCM' ? 'selected' : ''}>WCM</option>
                                </select>
                            </td>
                            <td>
                                <select id="editSex_${p.id}" class="form-control">
                                    <option value="" ${p.sex === '' ? 'selected' : ''}></option>
                                    <option value="M" ${p.sex === 'M' ? 'selected' : ''}>M</option>
                                    <option value="F" ${p.sex === 'F' ? 'selected' : ''}>F</option>
                                </select>
                            </td>
                            <td><input type="text" id="editBatch_${p.id}" class="form-control" value="${p.batch || ''}" style="width: 80px;"></td>
                            <td><input type="number" id="editRating_${p.id}" class="form-control" value="${p.rating}" style="width: 80px;"></td>
                            <td>
                                <select id="editActive_${p.id}" class="form-control">
                                    <option value="1" ${p.active ? 'selected' : ''}>Yes</option>
                                    <option value="0" ${!p.active ? 'selected' : ''}>No</option>
                                </select>
                            </td>
                            <td>
                                <button class="btn btn-success btn-sm btn-save-player" data-id="${p.id}" style="margin-right: 0.5rem;">Save</button>
                                <button class="btn btn-outline btn-sm btn-cancel-edit">Discard</button>
                            </td>
                        </tr>`;
                    } else {
                        html += `<tr class="${!p.active ? 'text-muted' : ''}">
                            <td><a href="#" class="player-link" data-id="${p.id}" style="color: var(--primary); text-decoration: none;">${p.name}</a></td>
                            <td>${p.title || ''}</td>
                            <td>${p.sex || ''}</td>
                            <td>${p.batch || ''}</td>
                            <td>${p.rating}</td>
                            <td>${p.active ? 'Yes' : 'No'}</td>
                            ${canManage ? `<td>
                                <button class="btn btn-outline btn-sm btn-edit-player" data-id="${p.id}" style="margin-right: 0.5rem;">Edit</button>
                                <button class="btn btn-outline btn-sm btn-delete-player" style="border-color: #ef4444; color: #ef4444;" data-id="${p.id}">Delete</button>
                            </td>` : ''}
                        </tr>`;
                    }
                });
                if (players.length === 0) html += `<tr><td colspan="7" class="text-center text-muted">No players added yet</td></tr>`;
                html += `</tbody></table></div>`;
            } else if (activeTab === 'arbiters') {
                const assignedAdmins = (t.admins || []).filter(a => !a.is_super);
                const isSuper = Boolean(window.isSuper);

                if (isSuper) {
                    html += `
                        <div class="grid grid-cols-2 mb-4" style="align-items: start;">
                            <div class="card">
                                <h3 class="mb-4">Assigned Arbiters (${assignedAdmins.length})</h3>
                                <p class="text-muted mb-4" style="font-size: 0.85rem;">Arbiters listed here have permission to add players, pair rounds, and enter match results for this tournament.</p>
                                <div class="table-container">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Arbiter</th>
                                                <th style="text-align: right; white-space: nowrap;">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${assignedAdmins.length === 0 ? '<tr><td colspan="2" class="text-center text-muted">No arbiters assigned yet</td></tr>' : assignedAdmins.map(a => `
                                                <tr>
                                                    <td><strong>${a.username}</strong></td>
                                                    <td style="text-align: right; white-space: nowrap;">
                                                        <button class="btn btn-outline btn-sm btn-remove-arbiter" style="border-color: #ef4444; color: #ef4444;" data-id="${a.id}" data-name="${a.username}">
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div class="card">
                                <h3 class="mb-4">Assign Existing Arbiter</h3>
                                <form id="assignArbiterForm">
                                    <div class="form-group">
                                        <label class="form-label">Select Arbiter Account</label>
                                        <select id="selectArbiterId" class="form-control" required>
                                            <option value="">-- Loading arbiters... --</option>
                                        </select>
                                    </div>
                                    <button type="submit" class="btn btn-primary" id="btnSubmitAssignArbiter" disabled>Assign to Tournament</button>
                                </form>
                                <p class="text-muted mt-4" style="font-size: 0.85rem;">Need a new arbiter account? Create one in <a href="#admins">Admin Management</a>.</p>
                            </div>
                        </div>
                    `;
                } else {
                    html += `
                        <div class="card mb-4" style="max-width: 600px;">
                            <h3 class="mb-4">Assigned Arbiters (${assignedAdmins.length})</h3>
                            <p class="text-muted mb-4" style="font-size: 0.85rem;">Arbiters authorized to manage this tournament:</p>
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Arbiter</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${assignedAdmins.length === 0 ? '<tr><td class="text-center text-muted">No arbiters assigned yet</td></tr>' : assignedAdmins.map(a => `
                                            <tr>
                                                <td><strong>${a.username}</strong></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }
            }
            
            html += `<div id="playerModal" class="modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5);">
                <div class="modal-content card" style="margin: 5% auto; padding: 20px; width: 80%; max-width: 800px; position: relative;">
                    <span class="close-modal" style="position: absolute; right: 20px; top: 15px; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
                    <div id="playerModalBody"></div>
                </div>
            </div>`;

            appRoot.innerHTML = html;

            // If on arbiters tab and super admin, fetch arbiters list to populate select dropdown
            if (activeTab === 'arbiters' && window.isSuper) {
                fetch('api/admins.php').then(r => r.json()).then(allAdmins => {
                    const assignedAdmins = (t.admins || []).filter(a => !a.is_super);
                    const select = document.getElementById('selectArbiterId');
                    const btn = document.getElementById('btnSubmitAssignArbiter');
                    if (!select) return;

                    const unassigned = (allAdmins || []).filter(a => !assignedAdmins.some(asg => asg.id === a.id) && !a.is_super);
                    if (unassigned.length === 0) {
                        select.innerHTML = '<option value="">(All arbiters are already assigned)</option>';
                        if (btn) btn.disabled = true;
                    } else {
                        select.innerHTML = '<option value="">-- Choose Arbiter --</option>' + unassigned.map(a => `<option value="${a.id}">${a.username}</option>`).join('');
                        if (btn) btn.disabled = false;
                    }
                }).catch(() => {});

                const assignForm = document.getElementById('assignArbiterForm');
                if (assignForm) {
                    assignForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const selId = document.getElementById('selectArbiterId').value;
                        if (!selId) return;

                        const res = await fetch('api/tournaments.php', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                action: 'assign_admin',
                                tournament_id: t.id,
                                admin_id: parseInt(selId)
                            })
                        });

                        if (res.ok) {
                            renderTournamentDetail(id, 'arbiters');
                        } else {
                            const err = await res.json();
                            alert('Error assigning arbiter: ' + (err.error || 'Unknown error'));
                        }
                    });
                }

                document.querySelectorAll('.btn-remove-arbiter').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const admId = btn.dataset.id;
                        const admName = btn.dataset.name;
                        if (!confirm(`Are you sure you want to remove arbiter "${admName}" from this tournament?`)) return;

                        const res = await fetch('api/tournaments.php', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                action: 'remove_admin',
                                tournament_id: t.id,
                                admin_id: parseInt(admId)
                            })
                        });

                        if (res.ok) {
                            renderTournamentDetail(id, 'arbiters');
                        } else {
                            const err = await res.json();
                            alert('Error removing arbiter: ' + (err.error || 'Unknown error'));
                        }
                    });
                });
            }

            document.querySelectorAll('.player-link').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    showPlayerDetails(e.target.dataset.id);
                });
            });
            
            const modal = document.getElementById('playerModal');
            if (modal) {
                modal.querySelector('.close-modal').addEventListener('click', () => {
                    modal.style.display = 'none';
                });
                window.addEventListener('click', (e) => {
                    if (e.target == modal) {
                        modal.style.display = 'none';
                    }
                });
            }

            // Bind events
            document.querySelectorAll('.tab[data-tab]').forEach(el => {
                el.addEventListener('click', (e) => {
                    activeTab = e.target.dataset.tab;
                    render();
                });
            });

            document.querySelectorAll('.btn-nav-round').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    activeSection = e.target.dataset.section;
                    activeRound = parseInt(e.target.dataset.round);
                    render();
                });
            });

            const addPlayerForm = document.getElementById('addPlayerForm');
            if (addPlayerForm) {
                addPlayerForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await fetch('api/players.php', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            tournament_id: t.id,
                            name: document.getElementById('playerName').value,
                            title: document.getElementById('playerTitle').value,
                            sex: document.getElementById('playerSex').value,
                            batch: document.getElementById('playerBatch').value,
                            rating: document.getElementById('playerRating').value
                        })
                    });
                    renderTournamentDetail(id, 'players');
                });
            }

            document.querySelectorAll('.btn-edit-player').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    editingPlayerId = parseInt(e.target.dataset.id);
                    render();
                });
            });

            document.querySelectorAll('.btn-cancel-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    editingPlayerId = null;
                    render();
                });
            });

            document.querySelectorAll('.btn-save-player').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const pId = e.target.dataset.id;
                    const newName = document.getElementById(`editName_${pId}`).value.trim();
                    if (!newName) {
                        alert('Name cannot be empty');
                        return;
                    }
                    await fetch('api/players.php', {
                        method: 'PUT',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            id: pId,
                            name: newName,
                            title: document.getElementById(`editTitle_${pId}`).value,
                            sex: document.getElementById(`editSex_${pId}`).value,
                            batch: document.getElementById(`editBatch_${pId}`).value,
                            rating: document.getElementById(`editRating_${pId}`).value,
                            active: document.getElementById(`editActive_${pId}`).value
                        })
                    });
                    editingPlayerId = null;
                    renderTournamentDetail(id, 'players');
                });
            });

            document.querySelectorAll('.btn-delete-player').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const pid = e.target.dataset.id;
                    if (!confirm(`Are you sure you want to completely delete this player?\nWARNING: This will also delete their match history!`)) return;

                    await fetch(`api/players.php?id=${pid}`, {
                        method: 'DELETE'
                    });
                    renderTournamentDetail(id, 'players');
                });
            });
            
            const btnGenerateRound = document.getElementById('btnGenerateRound');
            if (btnGenerateRound) {
                btnGenerateRound.addEventListener('click', async () => {
                    btnGenerateRound.disabled = true;
                    btnGenerateRound.textContent = 'Generating...';
                    const res = await fetch('api/rounds.php', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            action: 'generate',
                            tournament_id: t.id
                        })
                    });
                    if (res.ok) {
                        renderTournamentDetail(id, 'rounds');
                    } else {
                        const err = await res.json();
                        alert('Error generating round: ' + err.error);
                        btnGenerateRound.disabled = false;
                        btnGenerateRound.textContent = 'Generate Next Round';
                    }
                });
            }
            
            document.querySelectorAll('.result-select').forEach(sel => {
                sel.addEventListener('change', async (e) => {
                    const pairingId = e.target.dataset.pairing;
                    const result = e.target.value;
                    if (!result) return;
                    await fetch('api/pairings.php', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            pairing_id: pairingId,
                            result: result
                        })
                    });
                });
            });
            
            document.querySelectorAll('.btn-complete-round').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (!confirm('Are you sure you want to complete this round? Make sure all results are entered.')) return;
                    const roundId = btn.dataset.round;
                    const res = await fetch('api/rounds.php', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ action: 'complete', tournament_id: t.id, round_id: roundId })
                    });
                    if (res.ok) {
                        renderTournamentDetail(id, 'rounds', activeRound);
                    } else {
                        const err = await res.json();
                        alert('Error completing round: ' + err.error);
                    }
                });
            });

            document.querySelectorAll('.btn-discard-round').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (!confirm('Are you sure you want to undo pairings for this round? This will delete the current draft round.')) return;
                    const roundId = btn.dataset.round;
                    const res = await fetch('api/rounds.php', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ action: 'delete', tournament_id: t.id, round_id: roundId })
                    });
                    if (res.ok) {
                        renderTournamentDetail(id, 'rounds', activeRound - 1 > 0 ? activeRound - 1 : null);
                    } else {
                        const err = await res.json();
                        alert('Error discarding round: ' + err.error);
                    }
                });
            });

            document.querySelectorAll('.btn-reopen-round').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (!confirm('Are you sure you want to reopen this round? You will need to complete it again before generating the next round.')) return;
                    const roundId = btn.dataset.round;
                    const res = await fetch('api/rounds.php', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ action: 'reopen', tournament_id: t.id, round_id: roundId })
                    });
                    if (res.ok) {
                        renderTournamentDetail(id, 'rounds', activeRound);
                    } else {
                        const err = await res.json();
                        alert('Error reopening round: ' + err.error);
                    }
                });
            });
        }
        
        render();
    }

    // Initialize router
    window.addEventListener('hashchange', navigate);
    navigate();
});
