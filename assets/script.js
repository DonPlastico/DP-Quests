const missionsSelect = document.getElementById('missions-select');
const asignadosList = document.getElementById('asignados-list');
let editingLocationIndex = null;
const coordsContainer = document.getElementById('coords-container');
let isActive = true;

function IsPedModelValid(model) {
    // Lista de algunos modelos válidos (puedes expandirla)
    const validModels = [
        'a_m_m_afriamer_01', 'a_m_m_beach_01', 'a_m_m_business_01',
        'a_m_m_eastsa_01', 'a_m_m_farmer_01', 'a_m_m_genfat_01',
        'a_m_m_golfer_01', 'a_m_m_hillbilly_01', 'a_m_m_indian_01',
        'a_m_m_paparazzi_01', 'a_m_m_prolhost_01', 'a_m_m_rurmeth_01',
        'a_m_m_salton_01', 'a_m_m_skater_01', 'a_m_m_skidrow_01',
        'a_m_m_socenlat_01', 'a_m_m_tourist_01', 'a_m_m_tramp_01',
        'a_m_o_acult_01', 'a_m_o_acult_02', 'a_m_o_beach_01',
        'a_m_o_genstreet_01', 'a_m_o_ktown_01', 'a_m_o_salton_01',
        'a_m_o_soucent_01', 'a_m_y_acult_01', 'a_m_y_beach_01',
        'a_m_y_beachvesp_01', 'a_m_y_beachvesp_02', 'a_m_y_bevhills_01',
        'a_m_y_bevhills_02', 'a_m_y_breakdance_01', 'a_m_y_busicas_01',
        'a_m_y_business_01', 'a_m_y_clubcust_01', 'a_m_y_cyclist_01'
        // Añade más modelos según necesites
    ];

    // Comprueba si el modelo está en la lista (no es perfecto pero ayuda)
    return validModels.includes(model.toLowerCase());
}

// Inicializa con un grupo de coordenadas si está vacío
function resetCoordsContainer(coordsArr = [{}]) {
    coordsContainer.innerHTML = '';
    coordsArr.forEach(c => coordsContainer.appendChild(createCoordsGroup(c)));
}

// Notificación de error
function showNotification(msg, timeout = 3500) {
    const popup = document.getElementById('popup-notification');
    const content = document.getElementById('popup-notification-content');
    content.textContent = msg;
    popup.style.display = 'flex';
    setTimeout(() => {
        popup.style.display = 'none';
    }, timeout);
}

// Confirmación personalizada (devuelve una promesa)
function showConfirm(msg) {
    return new Promise(resolve => {
        const popup = document.getElementById('popup-confirm');
        const message = document.getElementById('popup-confirm-message');
        const yesBtn = document.getElementById('popup-confirm-yes');
        const noBtn = document.getElementById('popup-confirm-no');
        message.textContent = msg;
        popup.style.display = 'flex';

        function cleanup(result) {
            popup.style.display = 'none';
            yesBtn.removeEventListener('click', onYes);
            noBtn.removeEventListener('click', onNo);
            resolve(result);
        }
        function onYes() { cleanup(true); }
        function onNo() { cleanup(false); }

        yesBtn.addEventListener('click', onYes);
        noBtn.addEventListener('click', onNo);
    });
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
    const currentCoords = document.querySelectorAll('#coords-container .coords-row');
    if (currentCoords.length >= 3) {
        showNotification('Máximo 3 coordenadas permitidas');
        return;
    }
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
            list.innerHTML = '<div class="list-empty">No hay locacizaciones por el momento.</div>';
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
    if (type === 'npc' && !IsPedModelValid(model)) error += 'El modelo de NPC no es válido.\n';
    if (coords.length === 0) error += 'Debes añadir al menos unas coordenadas.\n';
    if (error) {
        showNotification(error);
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
        showNotification(error);
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
    if (btn && btn.hasAttribute('data-index')) {
        const idx = parseInt(btn.getAttribute('data-index'));
        getLocations().then(locations => {
            if (!Array.isArray(locations)) locations = [];
            const newState = !locations[idx].active;
            locations[idx].active = newState;

            // Enviar el cambio al servidor
            fetch(`https://${GetParentResourceName()}/toggleLocation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locationId: locations[idx].id || locations[idx].name,
                    isActive: newState
                })
            });

            // Actualizar visualmente el botón
            btn.textContent = newState ? 'ACTIVA' : 'DESACTIVA';
            btn.classList.toggle('inactive', !newState);

            // Guardar los cambios (opcional, ya que el servidor maneja el estado)
            saveLocations(locations);
        });
    }

    // BOTÓN DE TP
    const tpBtn = e.target.closest('.fa-location-dot');
    if (tpBtn) {
        const idx = tpBtn.closest('.location-icon').parentElement.parentElement.parentElement.querySelector('.edit-location').getAttribute('data-index');
        getLocations().then(locations => {
            const loc = locations[idx];
            // Usa la primera coordenada del NPC
            if (loc && loc.coords && loc.coords[0]) {
                fetch(`https://${GetParentResourceName()}/tpToLocation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        x: loc.coords[0].x,
                        y: loc.coords[0].y,
                        z: loc.coords[0].z,
                        h: loc.coords[0].h
                    })
                });
            }
        });
        return;
    }

    // BOTÓN DE ELIMINAR
    const deleteBtn = e.target.closest('.fa-trash-can');
    if (deleteBtn) {
        const idx = deleteBtn.closest('.location-icon').parentElement.parentElement.parentElement.querySelector('.edit-location').getAttribute('data-index');
        showConfirm('¿Seguro que quieres eliminar esta localización?').then(confirm => {
            if (!confirm) return;
            getLocations().then(locations => {
                locations.splice(idx, 1);
                saveLocations(locations);
                renderLocationsList();
                // Opcional: notificar al servidor para refrescar NPCs
                fetch(`https://${GetParentResourceName()}/saveLocations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ json: JSON.stringify(locations) })
                });
            });
        });
        return;
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