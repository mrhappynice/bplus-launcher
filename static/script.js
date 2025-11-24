const API_URL = '/api/apps';
const modal = document.getElementById('modal');
const form = document.getElementById('app-form');
const grid = document.getElementById('app-grid');
const searchInput = document.getElementById('search-input');
const tagBar = document.getElementById('tag-bar');
const terminalInput = document.getElementById('terminal-input');

let isEditing = false;
let allApps = []; // Store all data locally for filtering
let activeTags = new Set();
let searchQuery = "";

document.addEventListener('DOMContentLoaded', fetchApps);

// --- Event Listeners ---

const consoleWrapper = document.getElementById('console-wrapper');
const consoleToggle = document.getElementById('console-toggle');
const minimizeBtn = document.getElementById('minimize-console');

// Function to toggle visibility
function toggleConsoleVisibility(show) {
    if (show) {
        consoleWrapper.classList.remove('minimized');
        consoleToggle.classList.add('hidden');
        // Auto-focus input when opening
        setTimeout(() => {
            const termInput = document.getElementById('terminal-input');
            if(termInput) termInput.focus();
        }, 300);
    } else {
        consoleWrapper.classList.add('minimized');
        consoleToggle.classList.remove('hidden');
    }
}

// Event Listeners
if (consoleToggle) {
    consoleToggle.addEventListener('click', () => toggleConsoleVisibility(true));
}

if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => toggleConsoleVisibility(false));
}

// 1. Search Input
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderApps();
    });
}

// 2. Keyboard Shortcut (Cmd/Ctrl + K for Search)
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
    }
});

// 3. Terminal Input (Enter Key)
if (terminalInput) {
    terminalInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const cmd = terminalInput.value.trim();
            if (cmd) {
                terminalInput.value = ''; // Clear input
                terminalInput.disabled = true; // Disable while running
                await runAdHocCommand(cmd);
                terminalInput.disabled = false;
                terminalInput.focus();
            }
        }
    });
}

// 4. Modal & Console Controls
document.getElementById('add-btn').addEventListener('click', () => openModal());
document.getElementById('cancel-btn').addEventListener('click', closeModal);

document.getElementById('clear-console').addEventListener('click', () => {
    document.getElementById('console-output').innerHTML = '<div class="log-entry text-muted">Console cleared.</div>';
});

// 5. Form Submission (Create/Update)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = {
        id: document.getElementById('app-id').value || undefined,
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        command: document.getElementById('command').value,
        url: document.getElementById('url').value
    };

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `${API_URL}/${formData.id}` : API_URL;

    try {
        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        closeModal();
        fetchApps();
    } catch (err) {
        console.error('Error saving app:', err);
        alert('Failed to save application');
    }
});

// --- Core Logic ---

async function fetchApps() {
    try {
        const res = await fetch(API_URL);
        allApps = await res.json();
        buildTags();
        renderApps();
    } catch (err) {
        console.error("Failed to fetch apps:", err);
    }
}

function buildTags() {
    // 1. Extract all unique tags from all apps
    const allTags = new Set();
    allApps.forEach(app => {
        const tags = extractTags(app.description || '');
        tags.forEach(t => allTags.add(t));
    });

    // 2. Render Tag Bar
    if (!tagBar) return;
    tagBar.innerHTML = '';
    
    // Sort tags alphabetically
    Array.from(allTags).sort().forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'tag-filter';
        if (activeTags.has(tag)) btn.classList.add('active');
        
        btn.textContent = tag; // Display name (without #)
        
        btn.addEventListener('click', () => {
            if (activeTags.has(tag)) {
                activeTags.delete(tag);
                btn.classList.remove('active');
            } else {
                activeTags.add(tag);
                btn.classList.add('active');
            }
            renderApps();
        });
        
        tagBar.appendChild(btn);
    });
}

function extractTags(text) {
    if (!text) return [];
    const match = text.match(/#[\w-]+/g);
    if (!match) return [];
    return match.map(t => t.substring(1).toLowerCase()); // remove # and lowercase
}

function cleanDescription(text) {
    if (!text) return '';
    return text.replace(/#[\w-]+/g, '').trim();
}

function renderApps() {
    grid.innerHTML = '';

    const filtered = allApps.filter(app => {
        // Safety: Hide the phantom app if it got stuck in the DB
        if (app.name === '__TEMP_CMD__') return false;

        const appTags = extractTags(app.description || '');
        
        // 1. Search Text Match
        const matchesSearch = !searchQuery || 
            app.name.toLowerCase().includes(searchQuery) || 
            (app.description || '').toLowerCase().includes(searchQuery);

        // 2. Tag Match
        const matchesTags = activeTags.size === 0 || 
            appTags.some(t => activeTags.has(t));

        return matchesSearch && matchesTags;
    });

    filtered.forEach(app => {
        const appTags = extractTags(app.description || '');
        const displayDesc = cleanDescription(app.description || '');

        const card = document.createElement('div');
        card.className = 'card';
        
        const badgeHtml = appTags.map(t => `<span class="badge">${t}</span>`).join('');

        card.innerHTML = `
            <div>
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h3>${escapeHtml(app.name)}</h3>
                </div>
                <div class="card-badges">${badgeHtml}</div>
                <div class="card-code">${escapeHtml(app.command)}</div>
                <p>${escapeHtml(displayDesc)}</p>
            </div>
            <div class="btn-group">
                <button onclick="launchApp('${app.id}')" class="btn primary">Launch</button>
                <a href="${app.url}" target="_blank" class="btn">Open URL</a>
            </div>
            <div class="btn-group" style="margin-top: 20px; border-top: 1px solid #333; padding-top: 10px;">
                <button onclick='editApp(${JSON.stringify(app).replace(/'/g, "&#39;")})' class="btn" style="font-size: 0.8rem">Edit</button>
                <button onclick="deleteApp('${app.id}')" class="btn danger" style="font-size: 0.8rem">Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color: #666;">No apps found matching filters.</div>';
    }
}

// --- Command Execution Logic ---

// 1. Standard App Launch
async function launchApp(id) {
    const consoleDiv = document.getElementById('console-output');
    const loadingId = Date.now();
    consoleDiv.innerHTML += `<div id="loading-${loadingId}" class="log-entry text-muted">Executing command...</div>`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;

    try {
        const res = await fetch(`${API_URL}/${id}/launch`, { method: 'POST' });
        const data = await res.json(); 
        
        const loader = document.getElementById(`loading-${loadingId}`);
        if(loader) loader.remove();

        logOutput(data.command, data.stdout, data.stderr, data.success, data.message);

    } catch (err) {
        console.error(err);
        const loader = document.getElementById(`loading-${loadingId}`);
        if(loader) loader.remove();
        consoleDiv.innerHTML += `<div class="log-entry log-err">Error: ${escapeHtml(err.toString())}</div>`;
    }
}

// 2. Ad-Hoc Terminal Command ("Phantom App")
async function runAdHocCommand(command) {
    const consoleDiv = document.getElementById('console-output');
    
    // Visual feedback immediately
    consoleDiv.innerHTML += `<div class="log-entry"><span class="log-cmd">$ ${escapeHtml(command)}</span> <span class="text-muted">(running...)</span></div>`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;

    try {
        // A. Create Temporary App
        const createRes = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "__TEMP_CMD__", 
                description: "Ad-hoc command",
                command: command,
                url: "http://localhost"
            })
        });
        
        const tempApp = await createRes.json();

        // B. Launch it
        const launchRes = await fetch(`${API_URL}/${tempApp.id}/launch`, { method: 'POST' });
        const data = await launchRes.json();

        // C. Log Output (We don't reprint the command line to keep it looking like a terminal)
        let html = `<div class="log-entry">`;
        if (data.stdout) html += `<div class="log-out">${escapeHtml(data.stdout)}</div>`;
        if (data.stderr) html += `<div class="log-err">${escapeHtml(data.stderr)}</div>`;
        if (!data.success) html += `<div class="log-err">[Exit Status: Failed] ${escapeHtml(data.message)}</div>`;
        html += `</div>`;
        
        consoleDiv.innerHTML += html;
        consoleDiv.scrollTop = consoleDiv.scrollHeight;

        // D. Clean up (Delete the temp app)
        await fetch(`${API_URL}/${tempApp.id}`, { method: 'DELETE' });

    } catch (err) {
        consoleDiv.innerHTML += `<div class="log-entry log-err">Error executing ad-hoc command: ${escapeHtml(err.toString())}</div>`;
    }
}

// Helper to format log output for standard launches
function logOutput(cmd, stdout, stderr, success, msg) {
    const consoleDiv = document.getElementById('console-output');
    let html = `<div class="log-entry">`;
    html += `<div class="log-cmd">$ ${escapeHtml(cmd)}</div>`;
    
    if (stdout) html += `<div class="log-out">${escapeHtml(stdout)}</div>`;
    if (stderr) html += `<div class="log-err">${escapeHtml(stderr)}</div>`;
    
    if (!success) {
        html += `<div class="log-err">[Exit Status: Failed] ${escapeHtml(msg)}</div>`;
    }
    
    html += `</div>`;
    consoleDiv.innerHTML += html;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// --- Helper Functions ---

window.editApp = (app) => openModal(app); 

window.deleteApp = async (id) => {
    if(!confirm('Are you sure?')) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchApps();
};

function openModal(app = null) {
    modal.classList.remove('hidden');
    isEditing = !!app;
    document.getElementById('modal-title').textContent = isEditing ? 'Edit App' : 'Add App';
    
    if (app) {
        document.getElementById('app-id').value = app.id;
        document.getElementById('name').value = app.name;
        // Use raw description (with tags) for editing
        document.getElementById('description').value = app.description || '';
        document.getElementById('command').value = app.command;
        document.getElementById('url').value = app.url;
    } else {
        form.reset();
        document.getElementById('app-id').value = '';
    }
}

function closeModal() {
    modal.classList.add('hidden');
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
