// App State
let STORAGE_KEY="wineCellar";

let appData = loadFromStorage();

let currentShelfId = null;
let filteredWines = [];
let filteredShelfWines = [];

// Storage functions
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function loadFromStorage() {
    let default_data = {
        meta: {
            title: "My Wine Cellar",
            temperature: 13,
            color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        },
        shelves: [
            { id: 1, name: "Top Shelf", wines: [] },
            { id: 2, name: "Middle Shelf", wines: [] },
            { id: 3, name: "Bottom Shelf", wines: [] }
        ],
        history: [],
        nextShelfId: 4,
        nextWineId: 1
    };
    x = JSON.parse(localStorage.getItem(STORAGE_KEY))  || default_data
    return (x);
}

// Menu functions
function toggleMenu() {
    const menu = document.getElementById('menu');
    const overlay = document.getElementById('menuOverlay');
    menu.classList.toggle('open');
    overlay.style.display = menu.classList.contains('open') ? 'block' : 'none';
}

function closeMenu() {
    const menu = document.getElementById('menu');
    const overlay = document.getElementById('menuOverlay');
    menu.classList.remove('open');
    overlay.style.display = 'none';
}

// Screen functions
function showScreen(screenId) {
    document.getElementById(screenId).classList.add('active');
    closeMenu();
}

function closeScreen(screenId) {
    document.getElementById(screenId).classList.remove('active');
}

// Header functions
function updateHeader() {
    document.getElementById('cellarTitle').textContent = appData.meta.title;
    document.getElementById('cellarTemp').textContent = `Temperature: ${appData.meta.temperature}°C`;
    document.getElementById('appContainer').style.background = appData.meta.color;
}

// History functions
function addToHistory(action, description, data = null) {
    const historyItem = {
        id: Date.now(),
        action: action,
        description: description,
        timestamp: new Date(),
        data: data
    };
    appData.history.unshift(historyItem);
    
    if (appData.history.length > 100) {
        appData.history = appData.history.slice(0, 100);
    }
}

// Shelf functions
function renderShelves() {
    const container = document.getElementById('shelvesGrid');
    container.innerHTML = '';

    appData.shelves.forEach(shelf => {
        const shelfCard = document.createElement('div');
        shelfCard.className = 'shelf-card';
        shelfCard.innerHTML = `
                    <div class="shelf-header">
                        <div class="shelf-name">${shelf.name}</div>
                        <div class="shelf-count" onclick="showShelfWines(${shelf.id})">${shelf.wines.length} bottle${ ( shelf.wines.length > 1)?"s":"" }</div>
                    </div>
                    <div class="shelf-actions">
                        <button class="btn btn-success" onclick="showAddWine(${shelf.id})">+ Add Wine</button>
                        <button class="btn btn-primary" onclick="showShelfWines(${shelf.id})">View Wines</button>
                    </div>
                `;
        container.appendChild(shelfCard);
    });
}

function addShelf() {
    const name = document.getElementById('newShelfName').value.trim();
    if (!name) {
        alert('Please enter a shelf name');
        return;
    }

    const newShelf = {
        id: appData.nextShelfId++,
        name: name,
        wines: []
    };

    appData.shelves.push(newShelf);
    addToHistory('Add Shelf', `Added shelf "${name}"`);
    renderShelves();
    renderShelfManager();
    document.getElementById('newShelfName').value = '';
    saveToStorage();
}

function removeShelf(shelfId) {
    const shelf = appData.shelves.find(s => s.id === shelfId);
    if (shelf && shelf.wines.length > 0) {
        if (!confirm(`Shelf "${shelf.name}" contains ${shelf.wines.length} wines. Are you sure you want to remove it?`)) {
            return;
        }
    }

    appData.shelves = appData.shelves.filter(s => s.id !== shelfId);
    addToHistory('Remove Shelf', `Removed shelf "${shelf.name}"`);
    renderShelves();
    renderShelfManager();
    saveToStorage();
}

function renameShelf(shelfId) {
    shelf = appData.shelves.filter(s => s.id == shelfId)[0];
    new_name = window.prompt("New name for "+shelf.name, shelf.name);
    if (new_name && new_name != shelf.name) {
        shelf.name = new_name;
        saveToStorage();
        renderShelfManager();
        renderShelves();
    }
}

function swapShelves(i, j) {
    [ appData.shelves[i], appData.shelves[j] ] = [ appData.shelves[j], appData.shelves[i] ];
    saveToStorage();
    renderShelfManager();
    renderShelves();
}

function renderShelfManager() {
    const container = document.getElementById('shelfsList');
    container.innerHTML = '';

    appData.shelves.forEach((shelf, i) => {
        const shelfItem = document.createElement('div');
        shelfItem.className = 'wine-item';
        content = `
                    <div class="wine-name">${shelf.name}</div>
                    </div>
                    <div class="wine-details">${shelf.wines.length} bottles</div>
                    <div class="wine-actions">
                        <button class="btn btn-danger" onclick="removeShelf(${shelf.id})">Remove</button>
                        <button class="btn btn-danger" onclick="renameShelf(${shelf.id})">Rename</button>`;
        if (shelf != appData.shelves[0]){
            content += `<button class="btn" onclick="swapShelves(${i}, ${ i - 1 })">UP</button>` ;
        }
        if (shelf != appData.shelves[appData.shelves.length - 1]){
            content += `<button class="btn" onclick="swapShelves(${i}, ${i+1})">DOWN</button>`;
        }
        content += `</div>`;
        shelfItem.innerHTML = content;
        container.appendChild(shelfItem);
    });
}

function showShelfManager() {
    renderShelfManager();
    showScreen('shelfManagerScreen');
}

// Wine functions
function showAddWine(shelfId) {
    currentShelfId = shelfId;
    document.getElementById('addWineForm').reset();
    showScreen('addWineScreen');
}

function addWine(event) {
    event.preventDefault();
    
    const wine = {
        id: appData.nextWineId++,
        name: document.getElementById('wineName').value,
        region: document.getElementById('wineRegion').value,
        year: parseInt(document.getElementById('wineYear').value) || null,
        producer: document.getElementById('wineProducer').value,
        type: document.getElementById('wineType').value,
        price: parseFloat(document.getElementById('winePrice').value) || null,
        notes: document.getElementById('wineNotes').value,
        dateAdded: new Date().toISOString()
    };

    const shelf = appData.shelves.find(s => s.id === currentShelfId);
    shelf.wines.push(wine);
    
    addToHistory('Add Wine', `Added "${wine.name}" to ${shelf.name}`);
    renderShelves();
    closeScreen('addWineScreen');
    saveToStorage();
}

function removeWine(wineId, shelfId = null) {
    let shelf, wine, confirmed=false;
    for (let s of appData.shelves) {
        wine = s.wines.find(w => w.id === wineId);
        if (wine) {
            shelf = s;
            if (window.confirm("Confirm taking "+wine.name+"/"+wine.year+"?")) {
                s.wines = s.wines.filter(w => w.id !== wineId);
                confirmed = true;
            }
            break;
        }
    }

    if (wine && shelf && confirmed) {
        addToHistory('Remove Wine', `Removed "${wine.name}" from ${shelf.name}`, wine);
        renderShelves();
        renderAllWines();
        renderShelfWines();
        saveToStorage();
    }
}

function showAllWines(searchFocus = false) {
    renderAllWines();
    showScreen('allWinesScreen');
    if (searchFocus) {
        document.getElementById("wineSearchBar").focus();
    }
}

function renderSingleWine(wine) {
    rendered = `
                    <div class="wine-name">${wine.name}</div>
                    <div class="wine-details">
                        ${wine.year ? wine.year + ' • ' : ''}${wine.region || ''} • ${wine.shelfName}
                        ${wine.producer ? ' • ' + wine.producer : ''}
                        ${wine.type ? ' • ' + wine.type : ''}
                    </div>
                    ${wine.notes ? `<div class="wine-details">${wine.notes}</div>` : ''}
                    <div class="wine-actions">
                        <button class="btn btn-danger" onclick="removeWine(${wine.id})">Take Bottle</button>
                        <a target="_blank" href="https://www.idealwine.com/fr/acheter-du-vin/recherche-${wine.name}%20${ wine.year }"><button class="btn btn-danger" >IdealWine</button></a>
                    </div>
                `;
    return rendered;
}

function renderAllWines() {
    const container = document.getElementById('winesList');
    const searchTerm = document.getElementById('wineSearchBar').value.toLowerCase() || "";
    
    const allWines = [];
    appData.shelves.forEach(shelf => {
        shelf.wines.forEach(wine => {
            allWines.push({ ...wine, shelfName: shelf.name, shelfId: shelf.id });
        });
    });

    filteredWines = allWines;
    console.log(searchTerm.split(' '));
    searchTerm.split(' ').forEach (term => {
        tfiltered = allWines.filter(wine => {
            return wine.name.toLowerCase().includes(term) ||
                (wine.region && wine.region.toLowerCase().includes(term)) ||
                (wine.producer && wine.producer.toLowerCase().includes(term)) ||
                (wine.type && wine.type.toLowerCase().includes(term)) ||
                (wine.year && wine.year.toString().includes(term));
        });
        filteredWines = filteredWines.filter(value => tfiltered.includes(value));
    });

    container.innerHTML = '';
    filteredWines.forEach(wine => {
        const wineItem = document.createElement('div');
        wineItem.className = 'wine-item';
        wineItem.innerHTML = renderSingleWine(wine);
        container.appendChild(wineItem);
    });
}

function filterWines() {
    renderAllWines();
}

function showShelfWines(shelfId) {
    currentShelfId = shelfId;
    const shelf = appData.shelves.find(s => s.id === shelfId);
    document.getElementById('shelfWinesTitle').textContent = `${shelf.name} Wines`;
    renderShelfWines();
    showScreen('shelfWinesScreen');
}

function renderShelfWines() {
    const container = document.getElementById('shelfWinesList');
    const searchTerm = document.getElementById('shelfWineSearchBar').value.toLowerCase();
    const shelf = appData.shelves.find(s => s.id === currentShelfId);
    
    if (!shelf) return;

    filteredShelfWines = shelf.wines.filter(wine => {
        return wine.name.toLowerCase().includes(searchTerm) ||
            (wine.region && wine.region.toLowerCase().includes(searchTerm)) ||
            (wine.producer && wine.producer.toLowerCase().includes(searchTerm)) ||
            (wine.type && wine.type.toLowerCase().includes(searchTerm)) ||
            (wine.year && wine.year.toString().includes(searchTerm));
    });

    container.innerHTML = '';
    filteredShelfWines.forEach(wine => {
        const wineItem = document.createElement('div');
        wineItem.className = 'wine-item';
        wineItem.innerHTML = renderSingleWine(wine);
        container.appendChild(wineItem);
    });
}

function filterShelfWines() {
    renderShelfWines();
}

function showHistory() {
    renderHistory();
    showScreen('historyScreen');
}

function renderHistory() {
    const container = document.getElementById('historyList');
    container.innerHTML = '';

    appData.history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
                    <div class="history-action">${item.action}</div>
                    <div class="history-time">${item.timestamp.toLocaleString()}</div>
                    <div class="history-details">${item.description}</div>
                    ${item.data && item.action === 'Remove Wine' ? 
                        `<div class="wine-actions" style="margin-top: 10px;">
            <button class="btn btn-secondary" onclick="undoRemoveWine(${item.id})">Undo</button>
            </div>` : ''}
                `;
        container.appendChild(historyItem);
    });
}

function undoRemoveWine(historyId) {
    const historyItem = appData.history.find(h => h.id === historyId);
    if (!historyItem || !historyItem.data) return;

    const shelfName = historyItem.description.match(/from (.+)$/)?.[1];
    const shelf = appData.shelves.find(s => s.name === shelfName);
    
    if (shelf) {
        shelf.wines.push(historyItem.data);
        addToHistory('Undo Remove', `Restored "${historyItem.data.name}" to ${shelf.name}`);
        renderShelves();
        renderHistory();
        saveToStorage();
    }
}

// Import/Export functions
function showImport() {
    showScreen('importScreen');
}

function importInventory() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    const statusDiv = document.getElementById('importStatus');

    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.meta || !importedData.shelves || !Array.isArray(importedData.shelves)) {
                throw new Error('Invalid file format');
            }
            
            if (confirm('This will replace your current inventory. Continue?')) {
                appData = {
                    ...importedData,
                    history: appData.history,
                    nextShelfId: Math.max(...importedData.shelves.map(s => s.id)) + 1,
                    nextWineId: Math.max(...importedData.shelves.flatMap(s => s.wines.map(w => w.id))) + 1
                };
                
                addToHistory('Import', 'Imported inventory from file');
                renderShelves();
                updateHeader();
                updatePreferencesForm();
                saveToStorage();
                
                statusDiv.innerHTML = '<div style="color: green;">✓ Import successful!</div>';
            }
        } catch (error) {
            statusDiv.innerHTML = '<div style="color: red;">✗ Import failed: Invalid file format</div>';
        }
    };
    reader.readAsText(file);
}

function saveAppData() {

}

function exportInventory() {
    const exportData = appData;
    /*{
      meta: appData.meta,
      shelves: appData.shelves,
      exportDate: new Date().toISOString()
      };
    */

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `wine-cellar-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    addToHistory('Export', 'Exported inventory to file');
    closeMenu();
}

// Preferences functions
function showPreferences() {
    updatePreferencesForm();
    showScreen('preferencesScreen');
}

function updatePreferencesForm() {
    document.getElementById('prefTitle').value = appData.meta.title;
    document.getElementById('prefTemp').value = appData.meta.temperature;
    
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        if (option.style.background === appData.meta.color) {
            option.classList.add('selected');
        }
    });
}

function updateCellarTitle() {
    const newTitle = document.getElementById('prefTitle').value;
    appData.meta.title = newTitle;
    updateHeader();
    saveToStorage();
}

function updateCellarTemp() {
    const newTemp = parseFloat(document.getElementById('prefTemp').value);
    appData.meta.temperature = newTemp;
    updateHeader();
    saveToStorage();
}

function setCellarColor(color) {
    appData.meta.color = color;
    updateHeader();
    updatePreferencesForm();
    saveToStorage();
}

// Initialize app
function initApp() {
    loadFromStorage();
    renderShelves();
    updateHeader();
    updatePreferencesForm();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    document.getElementById('addWineForm').addEventListener('submit', addWine);
});

initApp()

