const API_URL = '/api/apps';
const modal = document.getElementById('modal');
const form = document.getElementById('app-form');
const grid = document.getElementById('app-grid');

let isEditing = false;

document.addEventListener('DOMContentLoaded', fetchApps);

// Modal Controls
document.getElementById('add-btn').addEventListener('click', () => openModal());
document.getElementById('cancel-btn').addEventListener('click', closeModal);

// Clear Console Button
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

// The NEW launchApp function (Handles Console Output)
async function launchApp(id) {
    const consoleDiv = document.getElementById('console-output');
    
    // User feedback that something is happening
    const loadingId = Date.now();
    consoleDiv.innerHTML += `<div id="loading-${loadingId}" class="log-entry text-muted">Executing command...</div>`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;

    try {
        const res = await fetch(`${API_URL}/${id}/launch`, { method: 'POST' });
        
        // We expect JSON from the server now
        const data = await res.json(); 

        // Remove loading text
        const loader = document.getElementById(`loading-${loadingId}`);
        if(loader) loader.remove();

        // Format the Output
        let html = `<div class="log-entry">`;
        html += `<div class="log-cmd">$ ${escapeHtml(data.command)}</div>`;
        
        if (data.stdout) {
            html += `<div class="log-out">${escapeHtml(data.stdout)}</div>`;
        }
        if (data.stderr) {
            html += `<div class="log-err">${escapeHtml(data.stderr)}</div>`;
        }
        
        if (!data.success) {
            html += `<div class="log-err">[Exit Status: Failed] ${escapeHtml(data.message)}</div>`;
        }
        
        html += `</div>`;

        // Append and scroll
        consoleDiv.innerHTML += html;
        consoleDiv.scrollTop = consoleDiv.scrollHeight;

    } catch (err) {
        console.error(err);
        const loader = document.getElementById(`loading-${loadingId}`);
        if(loader) loader.remove();
        consoleDiv.innerHTML += `<div class="log-entry log-err">Error: ${escapeHtml(err.toString())}</div>`;
    }
}

function openModal(app = null) {
    modal.classList.remove('hidden');
    isEditing = !!app;
    document.getElementById('modal-title').textContent = isEditing ? 'Edit App' : 'Add App';
    
    if (app) {
        document.getElementById('app-id').value = app.id;
        document.getElementById('name').value = app.name;
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

async function fetchApps() {
    const res = await fetch(API_URL);
    const apps = await res.json();
    renderApps(apps);
}

function renderApps(apps) {
    grid.innerHTML = '';
    apps.forEach(app => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div>
                <h3>${escapeHtml(app.name)}</h3>
                <div class="card-code">${escapeHtml(app.command)}</div>
                <p>${escapeHtml(app.description || '')}</p>
            </div>
            <div class="btn-group">
                <button onclick="launchApp('${app.id}')" class="btn primary">Launch</button>
                <a href="${app.url}" target="_blank" class="btn">Open URL</a>
            </div>
            <div class="btn-group" style="margin-top: 20px; border-top: 1px solid #333; padding-top: 10px;">
                <button onclick='editApp(${JSON.stringify(app)})' class="btn" style="font-size: 0.8rem">Edit</button>
                <button onclick="deleteApp('${app.id}')" class="btn danger" style="font-size: 0.8rem">Delete</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.editApp = (app) => openModal(app); 

window.deleteApp = async (id) => {
    if(!confirm('Are you sure?')) return;
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    fetchApps();
};

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}