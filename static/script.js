const API_URL = '/api/apps';
const modal = document.getElementById('modal');
const form = document.getElementById('app-form');
const grid = document.getElementById('app-grid');
const searchInput = document.getElementById('search-input');
const tagBar = document.getElementById('tag-bar');

let isEditing = false;
let allApps = []; // Store all data locally for filtering
let activeTags = new Set();
let searchQuery = "";

document.addEventListener('DOMContentLoaded', fetchApps);

// --- Event Listeners ---

// Search
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderApps(); // Re-render with filter
});

// Keyboard Shortcut for Search (Cmd/Ctrl + K)
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
});

document.getElementById('add-btn').addEventListener('click', () => openModal());
document.getElementById('cancel-btn').addEventListener('click', closeModal);

document.getElementById('clear-console').addEventListener('click', () => {
    document.getElementById('console-output').innerHTML = '<div class="log-entry text-muted">Console cleared.</div>';
});

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

// --- Logic ---

async function fetchApps() {
    const res = await fetch(API_URL);
    allApps = await res.json(); // Save to global variable
    buildTags();
    renderApps();
}

function buildTags() {
    // 1. Extract all unique tags from all apps
    const allTags = new Set();
    allApps.forEach(app => {
        const tags = extractTags(app.description || '');
        tags.forEach(t => allTags.add(t));
    });

    // 2. Render Tag Bar
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
    // Finds #word patterns
    const match = text.match(/#[\w-]+/g);
    if (!match) return [];
    return match.map(t => t.substring(1).toLowerCase()); // remove # and lowercase
}

function cleanDescription(text) {
    // Removes tags from description for cleaner display
    if(!text) return '';
    return text.replace(/#[\w-]+/g, '').trim();
}

function renderApps() {
    grid.innerHTML = '';

    // Filter Logic
    const filtered = allApps.filter(app => {
        const appTags = extractTags(app.description || '');
        
        // 1. Search Text Match (Name or Description)
        const matchesSearch = !searchQuery || 
            app.name.toLowerCase().includes(searchQuery) || 
            (app.description || '').toLowerCase().includes(searchQuery);

        // 2. Tag Match (If tags selected, app must have AT LEAST ONE of the selected tags)
        // Alternatively: use .every() if you want strict AND matching
        const matchesTags = activeTags.size === 0 || 
            appTags.some(t => activeTags.has(t));

        return matchesSearch && matchesTags;
    });

    filtered.forEach(app => {
        const appTags = extractTags(app.description || '');
        const displayDesc = cleanDescription(app.description || '');

        const card = document.createElement('div');
        card.className = 'card';
        
        // Generate Badge HTML
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

// Standard CRUD functions (launchApp, editApp, etc) remain mostly same
// but editApp handles the raw description (with tags)
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
        // Note: We put the FULL description (with tags) back into the edit box
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

// Re-using existing launchApp code...
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

        let html = `<div class="log-entry">`;
        html += `<div class="log-cmd">$ ${escapeHtml(data.command)}</div>`;
        if (data.stdout) html += `<div class="log-out">${escapeHtml(data.stdout)}</div>`;
        if (data.stderr) html += `<div class="log-err">${escapeHtml(data.stderr)}</div>`;
        if (!data.success) html += `<div class="log-err">[Exit Status: Failed] ${escapeHtml(data.message)}</div>`;
        html += `</div>`;

        consoleDiv.innerHTML += html;
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
    } catch (err) {
        console.error(err);
        const loader = document.getElementById(`loading-${loadingId}`);
        if(loader) loader.remove();
        consoleDiv.innerHTML += `<div class="log-entry log-err">Error: ${escapeHtml(err.toString())}</div>`;
    }
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