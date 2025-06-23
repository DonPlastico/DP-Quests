const missionsSelect = document.getElementById('missions-select');
const asignadosList = document.getElementById('asignados-list');
let editingLocationIndex = null;
const coordsContainer = document.getElementById('coords-container');
let isActive = true;

// Inicializa con un grupo de coordenadas si está vacío
function resetCoordsContainer(coordsArr = [{}]) {
    coordsContainer.innerHTML = '';
    coordsArr.forEach(c => coordsContainer.appendChild(createCoordsGroup(c)));
}

// Lista de misiones
const missionNames = {
    mision1: "Rescatar al rehén",
    mision2: "Robo al banco",
    mision3: "Entrega de paquete",
    mision4: "Persecución policial",
    mision5: "Recoger pruebas",
    mision6: "Vigilar objetivo",
    mision7: "Desactivar bomba",
    mision8: "Transportar VIP",
    mision9: "Infiltración",
    mision10: "Sabotaje",
    mision11: "Recuperar vehículo",
    mision12: "Interrogar sospechoso",
    mision13: "Defender zona",
    mision14: "Huir de la policía",
    mision15: "Investigar escena"
};

missionsSelect.addEventListener('mousedown', function (e) {
    e.preventDefault();
    const option = e.target;
    if (option.tagName.toLowerCase() === 'option') {
        option.selected = !option.selected;
        // Limitar a 5 seleccionadas
        const selected = Array.from(missionsSelect.options).filter(opt => opt.selected);
        if (selected.length > 5) {
            option.selected = false;
        }
        updateAsignadosList();
    }
});

function updateActiveToggleBtn() {
    const btn = document.getElementById('active-toggle');
    if (isActive) {
        btn.textContent = 'ACTIVA';
        btn.classList.remove('inactive');
    } else {
        btn.textContent = 'DESACTIVA';
        btn.classList.add('inactive');
    }
}

document.getElementById('active-toggle').onclick = function () {
    isActive = !isActive;
    updateActiveToggleBtn();
};

function createCoordsGroup(values = {}) {
    const group = document.createElement('div');
    group.className = 'coords-row';
    group.style.marginBottom = '8px';

    group.innerHTML = `
        <input type="text" class="coord-x" placeholder="X" value="${values.x || ''}">
        <input type="text" class="coord-y" placeholder="Y" value="${values.y || ''}">
        <input type="text" class="coord-z" placeholder="Z" value="${values.z || ''}">
        <input type="text" class="coord-h" placeholder="H" value="${values.h || ''}">
        <button type="button" class="copy-coords-btn">COPIAR COORDENADAS</button>
        <button type="button" class="remove-coords-btn" title="Eliminar" style="margin-left:4px;">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;

    // Botón copiar coordenadas solo para este grupo
    group.querySelector('.copy-coords-btn').onclick = function () {
        fetch(`https://${GetParentResourceName()}/getPlayerCoords`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
        })
            .then(res => res.json())
            .then(data => {
                if (data && data.x !== undefined) {
                    group.querySelector('.coord-x').value = data.x;
                    group.querySelector('.coord-y').value = data.y;
                    group.querySelector('.coord-z').value = data.z;
                    group.querySelector('.coord-h').value = data.h;
                }
            });
    };

    // Botón eliminar grupo
    group.querySelector('.remove-coords-btn').onclick = function () {
        group.remove();
    };

    return group;
}

// Botón para añadir más grupos
document.getElementById('add-coords').onclick = function () {
    coordsContainer.appendChild(createCoordsGroup());
};

function updateAsignadosList() {
    asignadosList.innerHTML = '';
    Array.from(missionsSelect.options).forEach(option => {
        if (option.selected) {
            const div = document.createElement('div');
            div.className = 'asignado-item';
            div.textContent = option.text;
            const btn = document.createElement('button');
            btn.className = 'asignado-remove';
            btn.textContent = '✕';
            btn.onclick = function () {
                option.selected = false;
                updateAsignadosList();
            };
            div.appendChild(btn);
            asignadosList.appendChild(div);
        }
    });
}

// Guardar localizaciones en el servidor
function saveLocations(locations) {
    fetch(`https://${GetParentResourceName()}/saveLocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: JSON.stringify(locations) })
    });
}

// Cargar localizaciones desde el servidor (devuelve una promesa)
function getLocations() {
    return fetch(`https://${GetParentResourceName()}/getLocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
        .then(res => res.json())
        .then(data => Array.isArray(data) ? data : [])
        .catch(() => []);
}

function renderLocationsList() {
    const list = document.getElementById('locations-list');
    getLocations().then(locations => {
        list.innerHTML = '';
        if (locations.length === 0) {
            list.innerHTML = '<div class="list-empty">No locations added</div>';
            return;
        }
        locations.forEach((loc, idx) => {
            const div = document.createElement('div');
            div.className = 'location-card';
            div.innerHTML = `
                <div class="location-header">
                    <span class="location-title">${loc.name || 'SIN NOMBRE'}</span>
                    <div class="location-actions">
                        <span class="location-badge">${loc.type === 'npc' ? 'INTERACCIÓN' : loc.type.toUpperCase()}</span>
                        <button class="active-toggle-btn ${loc.active === false ? 'inactive' : ''}" data-index="${idx}">
                            ${loc.active === false ? 'DESACTIVA' : 'ACTIVA'}
                        </button>
                        <span class="location-icon edit-location" title="Editar" data-index="${idx}"><i class="fa-solid fa-pen-to-square"></i></span>
                        <span class="location-icon" title="Ubicación"><i class="fa-solid fa-location-dot"></i></span>
                        <span class="location-icon" title="Eliminar"><i class="fa-solid fa-trash-can"></i></span>
                    </div>
                </div>
                <div class="location-missions-box">
                    <div class="location-missions-list">
                        ${(loc.missions && loc.missions.length)
                    ? loc.missions.map(m => `<div class="mission-item">${missionNames[m] || m}</div>`).join('')
                    : '<span class="mission-item">Ninguna</span>'
                }
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    });
}

// Llama esto al cargar la página
renderLocationsList();

function setModalMode(mode) {
    if (mode === 'edit') {
        document.getElementById('save-location').style.display = '';
        document.getElementById('create-location').style.display = 'none';
    } else {
        document.getElementById('save-location').style.display = 'none';
        document.getElementById('create-location').style.display = '';
    }
}

// Previsualización del modelo
function renderModelPreview() {
    const type = document.getElementById('location-type').value;
    const model = document.getElementById('model-prop').value.trim();
    // Toma el primer grupo de coordenadas
    const firstRow = document.querySelector('#coords-container .coords-row');
    let x = '', y = '', z = '', h = '';
    if (firstRow) {
        x = firstRow.querySelector('.coord-x').value.trim();
        y = firstRow.querySelector('.coord-y').value.trim();
        z = firstRow.querySelector('.coord-z').value.trim();
        h = firstRow.querySelector('.coord-h').value.trim();
    }
    const preview = document.getElementById('model-preview');
    if (!model || !x || !y || !z) {
        preview.innerHTML = '';
        return;
    }
    if (type === 'npc') {
        preview.innerHTML = `<div style="color:#fff;padding:8px 0;">NPC: <b>${model}</b> en [${x}, ${y}, ${z}, ${h}]</div>
        <img src="https://docs.fivem.net/skins/${model}.png" alt="${model}" style="max-width:120px;max-height:120px;">`;
    } else if (type === 'prop') {
        preview.innerHTML = `<div style="color:#fff;padding:8px 0;">PROP: <b>${model}</b> en [${x}, ${y}, ${z}, ${h}]</div>
        <img src="https://gta-objects.xyz/images/${model}.webp" alt="${model}" style="max-width:120px;max-height:120px;">`;
    } else {
        preview.innerHTML = `<div style="color:#fff;padding:8px 0;">COORDENADAS: [${x}, ${y}, ${z}, ${h}]</div>`;
    }
}

// Inicializa la lista al cargar
updateAsignadosList();

// Mostrar modal para crear
document.getElementById('add-location').onclick = function () {
    // Limpia todos los campos del modal
    document.getElementById('location-name').value = '';
    document.getElementById('location-type').value = 'coords';
    document.getElementById('model-prop').value = '';
    document.getElementById('location-id').value = '';
    document.getElementById('interaction-distance').value = '';
    document.getElementById('player-accept').value = '';
    document.getElementById('player-start').value = '';
    document.getElementById('npc-logo').value = '';
    document.getElementById('npc-audio').value = '';
    document.getElementById('hide-on-complete').checked = false;
    Array.from(document.getElementById('missions-select').options).forEach(opt => opt.selected = false);
    updateAsignadosList();
    resetCoordsContainer([{}]);
    editingLocationIndex = null;
    isActive = true;
    updateActiveToggleBtn();
    setModalMode('create');
    document.getElementById('modal-location').style.display = 'flex';
    document.getElementById('location-type').dispatchEvent(new Event('change'));
};

// Mostrar campos según tipo y habilitar modelo siempre
document.getElementById('location-type').addEventListener('change', function () {
    const type = this.value;
    const isCoords = type === 'coords';

    // Modelo
    document.getElementById('model-prop').disabled = isCoords;

    // SOLO NPC
    document.getElementById('player-accept').disabled = isCoords;
    document.getElementById('player-start').disabled = isCoords;
    document.getElementById('npc-logo').disabled = isCoords;
    document.getElementById('npc-audio').disabled = isCoords;
});

// Ejecuta al cargar para el valor inicial
document.getElementById('location-type').dispatchEvent(new Event('change'));

// CREAR LOCALIZACIÓN
document.getElementById('create-location').onclick = function () {
    const name = document.getElementById('location-name').value.trim();
    const type = document.getElementById('location-type').value;
    const model = document.getElementById('model-prop').value.trim();
    const id = document.getElementById('location-id').value.trim();
    const distance = document.getElementById('interaction-distance').value.trim();
    const playerAccept = document.getElementById('player-accept').value.trim();
    const playerStart = document.getElementById('player-start').value.trim();
    const npcLogo = document.getElementById('npc-logo').value.trim();
    const npcAudio = document.getElementById('npc-audio').value.trim();
    const hideOnComplete = document.getElementById('hide-on-complete').checked;

    // Recoge todas las coordenadas
    const coords = [];
    document.querySelectorAll('#coords-container .coords-row').forEach(row => {
        const x = row.querySelector('.coord-x').value.trim();
        const y = row.querySelector('.coord-y').value.trim();
        const z = row.querySelector('.coord-z').value.trim();
        const h = row.querySelector('.coord-h').value.trim();
        if (x && y && z) {
            coords.push({ x, y, z, h });
        }
    });

    const missions = Array.from(document.getElementById('missions-select').options)
        .filter(opt => opt.selected)
        .map(opt => opt.value);

    // Validación básica
    let error = '';
    if (!name) error += 'El campo NOMBRE es obligatorio.\n';
    if ((type === 'npc' || type === 'prop') && !model) error += 'El campo MODELO es obligatorio.\n';
    if (coords.length === 0) error += 'Debes añadir al menos unas coordenadas.\n';
    if (error) {
        alert(error);
        return;
    }

    const newLocation = {
        name, type, model, id, distance, coords, playerAccept, playerStart, npcLogo, npcAudio, hideOnComplete, missions, active: isActive
    };

    getLocations().then(locations => {
        if (!Array.isArray(locations)) locations = [];
        locations.push(newLocation);
        saveLocations(locations);
        renderLocationsList();
        document.getElementById('modal-location').style.display = 'none';
    });
};

// GUARDAR CAMBIOS (EDITAR)
document.getElementById('save-location').onclick = function () {
    const name = document.getElementById('location-name').value.trim();
    const type = document.getElementById('location-type').value;
    const model = document.getElementById('model-prop').value.trim();
    const id = document.getElementById('location-id').value.trim();
    const distance = document.getElementById('interaction-distance').value.trim();
    const playerAccept = document.getElementById('player-accept').value.trim();
    const playerStart = document.getElementById('player-start').value.trim();
    const npcLogo = document.getElementById('npc-logo').value.trim();
    const npcAudio = document.getElementById('npc-audio').value.trim();
    const hideOnComplete = document.getElementById('hide-on-complete').checked;

    // Recoge todas las coordenadas
    const coords = [];
    document.querySelectorAll('#coords-container .coords-row').forEach(row => {
        const x = row.querySelector('.coord-x').value.trim();
        const y = row.querySelector('.coord-y').value.trim();
        const z = row.querySelector('.coord-z').value.trim();
        const h = row.querySelector('.coord-h').value.trim();
        if (x && y && z) {
            coords.push({ x, y, z, h });
        }
    });

    const missions = Array.from(document.getElementById('missions-select').options)
        .filter(opt => opt.selected)
        .map(opt => opt.value);

    // Validación básica
    let error = '';
    if (!name) error += 'El campo NOMBRE es obligatorio.\n';
    if ((type === 'npc' || type === 'prop') && !model) error += 'El campo MODELO es obligatorio.\n';
    if (coords.length === 0) error += 'Debes añadir al menos unas coordenadas.\n';
    if (error) {
        alert(error);
        return;
    }

    const newLocation = {
        name, type, model, id, distance, coords, playerAccept, playerStart, npcLogo, npcAudio, hideOnComplete, missions, active: isActive
    };

    getLocations().then(locations => {
        if (!Array.isArray(locations)) locations = [];
        if (editingLocationIndex !== null) {
            locations[editingLocationIndex] = newLocation;
            editingLocationIndex = null;
        }
        saveLocations(locations);
        renderLocationsList();
        document.getElementById('modal-location').style.display = 'none';
    });
};

// Editar localización
document.addEventListener('click', function (e) {
    if (e.target.closest('.edit-location')) {
        const idx = e.target.closest('.edit-location').getAttribute('data-index');
        getLocations().then(locations => {
            const loc = locations[idx];
            editingLocationIndex = idx;
            setModalMode('edit');

            // Rellena los campos del modal
            document.getElementById('location-name').value = loc.name || '';
            document.getElementById('location-type').value = loc.type || 'coords';
            document.getElementById('model-prop').value = loc.model || '';
            document.getElementById('location-id').value = loc.id || '';
            document.getElementById('interaction-distance').value = loc.distance || '';
            document.getElementById('player-accept').value = loc.playerAccept || '';
            document.getElementById('player-start').value = loc.playerStart || '';
            document.getElementById('npc-logo').value = loc.npcLogo || '';
            document.getElementById('npc-audio').value = loc.npcAudio || '';
            document.getElementById('hide-on-complete').checked = !!loc.hideOnComplete;

            // Estado activo
            isActive = loc.active !== false;
            updateActiveToggleBtn();

            // Misiones
            Array.from(document.getElementById('missions-select').options).forEach(opt => {
                opt.selected = loc.missions && loc.missions.includes(opt.value);
            });
            updateAsignadosList();

            // Coordenadas: limpia y agrega todos los grupos guardados
            if (Array.isArray(loc.coords) && loc.coords.length > 0) {
                resetCoordsContainer(loc.coords);
            } else {
                resetCoordsContainer([{}]);
            }

            // Abre el modal
            document.getElementById('modal-location').style.display = 'flex';
            document.getElementById('location-type').dispatchEvent(new Event('change'));
        });
    }
});

// Cambiar estado ACTIVA/DESACTIVA desde el listado
document.getElementById('locations-list').addEventListener('click', function (e) {
    const btn = e.target.closest('.active-toggle-btn');
    const delBtn = e.target.closest('.fa-trash-can');
    if (btn && btn.hasAttribute('data-index')) {
        const idx = parseInt(btn.getAttribute('data-index'));
        getLocations().then(locations => {
            if (!Array.isArray(locations)) locations = [];
            locations[idx].active = !locations[idx].active;
            saveLocations(locations);
            renderLocationsList();
        });
    }

    if (delBtn) {
        const idx = parseInt(delBtn.parentElement.getAttribute('data-index'));
        if (confirm('¿Seguro que quieres eliminar esta localización?')) {
            getLocations().then(locations => {
                if (!Array.isArray(locations)) locations = [];
                locations.splice(idx, 1);
                saveLocations(locations);
                renderLocationsList();
            });
        }
    }
});

// Cierra modal con ESC
document.addEventListener('keydown', function (e) {
    if (e.key === "Escape") {
        const modal = document.getElementById('modal-location');
        if (modal.style.display === 'flex') {
            modal.style.display = 'none';
            return;
        }
        fetch(`https://${GetParentResourceName()}/closeMenu`, { method: 'POST' });
        document.getElementById('container').style.display = 'none';
    }
});

// NUI mensaje para abrir menú
window.addEventListener('message', function (event) {
    if (event.data.action === "openMenu") {
        document.getElementById('container').style.display = 'flex';
    }
});