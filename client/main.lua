local QBCore = exports['qb-core']:GetCoreObject()
local spawnedNPCs = {} -- Tabla para guardar referencias de NPCs por localización
local pendingLocationsCb = nil
local activeNPCs = {} -- Para guardar info de NPCs y su distancia de interacción
local showingTextUI = false
local currentNPC = nil

local function ShowTextUI(msg)
    exports['qb-core']:DrawText(msg, 'left')
end

local function HideTextUI()
    exports['qb-core']:HideText()
end

-- Función mejorada para crear NPCs
local function createNPC(model, coords, heading, locationId, npcIndex, interactDist)
    local npcId = tostring(locationId) .. "_" .. tostring(npcIndex)

    -- Eliminar NPC existente si ya hay uno
    if spawnedNPCs[npcId] and DoesEntityExist(spawnedNPCs[npcId]) then
        DeletePed(spawnedNPCs[npcId])
    end

    local hash = GetHashKey(model)
    RequestModel(hash)
    while not HasModelLoaded(hash) do
        Wait(0)
    end

    -- Obtener altura del suelo con múltiples intentos
    local found, groundZ
    for i = 0, 10 do
        found, groundZ = GetGroundZFor_3dCoord(coords.x, coords.y, coords.z + (i / 10), false)
        if found then
            break
        end
    end
    local finalZ = found and (groundZ + 0.05) or coords.z

    -- Crear el NPC:
    local npc = CreatePed(4, hash, coords.x, coords.y, finalZ, heading, false, true)
    SetEntityHeading(npc, heading)
    SetEntityInvincible(npc, true)
    SetBlockingOfNonTemporaryEvents(npc, true)
    FreezeEntityPosition(npc, true)
    SetPedDefaultComponentVariation(npc) -- <--- Añade esto aquí

    -- Guardar referencia
    spawnedNPCs[npcId] = npc
    activeNPCs[npcId] = {
        npc = npc,
        coords = coords,
        interactDist = interactDist or 1.5
    }

    -- Verificación final de posición
    Citizen.CreateThread(function()
        Wait(1000)
        if DoesEntityExist(npc) then
            local finalCoords = GetEntityCoords(npc)
            local _, finalGroundZ = GetGroundZFor_3dCoord(finalCoords.x, finalCoords.y, finalCoords.z, false)
            if finalGroundZ then
                SetEntityCoords(npc, finalCoords.x, finalCoords.y, finalGroundZ + 0.05)
            end
        end
    end)

    return npc
end

-- Función para eliminar un NPC específico
local function deleteNPC(id)
    if spawnedNPCs[id] then
        if DoesEntityExist(spawnedNPCs[id]) then
            DeletePed(spawnedNPCs[id])
        end
        spawnedNPCs[id] = nil
    end
end

-- Función para cargar todos los NPCs activos
local function loadAllNPCs()
    -- Primero eliminar todos los NPCs existentes
    for id, npc in pairs(spawnedNPCs) do
        if DoesEntityExist(npc) then
            DeletePed(npc)
        end
    end
    spawnedNPCs = {}

    -- Cargar localizaciones del servidor
    TriggerServerEvent('dp-quests:getLocations')
end

RegisterNUICallback('getLocations', function(_, cb)
    pendingLocationsCb = cb
    TriggerServerEvent('dp-quests:getLocations')
end)

RegisterNUICallback("tpToLocation", function(data, cb)
    local ped = PlayerPedId()
    local x, y, z, h = tonumber(data.x), tonumber(data.y), tonumber(data.z), tonumber(data.h) or 0.0
    if x and y and z then
        SetEntityCoords(ped, x, y, z, false, false, false, false)
        SetEntityHeading(ped, h)
        QBCore.Functions.Notify("Teletransportado a la localización.", "success")
    else
        QBCore.Functions.Notify("Coordenadas inválidas.", "error")
    end
    cb({ ok = true })
end)

-- Evento para recibir las localizaciones
RegisterNetEvent('dp-quests:sendLocations', function(locations)
    -- Elimina todos los NPCs existentes antes de crear nuevos
    for id, npc in pairs(spawnedNPCs) do
        if DoesEntityExist(npc) then
            DeletePed(npc)
        end
    end
    spawnedNPCs = {}
    activeNPCs = {}

    for locIdx, loc in ipairs(locations) do
        if loc.active ~= false and loc.type == 'npc' and loc.model and loc.coords then
            local locationId = loc.id ~= "" and loc.id or (loc.name ~= "" and loc.name or tostring(locIdx))
            local interactDist = tonumber(loc.distance) or 1.5
            interactDist = math.max(0, math.min(interactDist, 5.0)) -- Limita entre 0 y 5
            for i = 1, math.min(#loc.coords, 3) do
                local coord = loc.coords[i]
                local x, y, z = tonumber(coord.x), tonumber(coord.y), tonumber(coord.z)
                local h = tonumber(coord.h) or 0.0

                if x and y and z then
                    createNPC(loc.model, vector3(x, y, z), h, locationId, i, interactDist)
                end
            end
        end
    end

    if pendingLocationsCb then
        pendingLocationsCb(locations)
        pendingLocationsCb = nil
    end
end)

-- Manejar el cambio de estado
RegisterNetEvent('dp-quests:client:locationUpdated', function()
    loadAllNPCs() -- Recargar todos los NPCs cuando hay cambios
end)

-- Función para cambiar el estado de una localización
RegisterNetEvent('dp-quests:client:toggleLocation', function(locationId, isActive)
    -- Recargar todos los NPCs cuando cambia el estado
    loadAllNPCs()
end)

-- Iniciar al cargar el recurso
AddEventHandler('onResourceStart', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        loadAllNPCs()
    end
end)

-- Limpiar al detener el recurso
AddEventHandler('onResourceStop', function(resourceName)
    if GetCurrentResourceName() == resourceName then
        for _, npc in pairs(spawnedNPCs) do
            if DoesEntityExist(npc) then
                DeletePed(npc)
            end
        end
    end
end)

-- Recargar NPCs cuando se actualizan las localizaciones
RegisterNetEvent('dp-quests:client:updateQuests', function(quests)
    loadAllNPCs()
end)

RegisterNetEvent('dp-quests:client:openMenu', function()
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "openMenu"
    })
end)

RegisterCommand("quests", function()
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "openMenu"
    })
end, false)

-- Comando para probar la visibilidad de NPCs (opcional)
RegisterCommand("togglenpcs", function()
    TriggerServerEvent('dp-quests:getLocations')
end, false)

RegisterNUICallback("closeMenu", function()
    SetNuiFocus(false, false)
end)

RegisterNUICallback("getPlayerCoords", function(_, cb)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    cb({
        x = string.format("%.2f", coords.x),
        y = string.format("%.2f", coords.y),
        z = string.format("%.2f", coords.z),
        h = string.format("%.2f", heading)
    })
end)

RegisterNUICallback('saveLocations', function(data, cb)
    TriggerServerEvent('dp-quests:saveLocations', data.json or "[]")
    cb({
        ok = true
    })
end)

Citizen.CreateThread(function()
    while true do
        Wait(0)
        local playerPed = PlayerPedId()
        local playerCoords = GetEntityCoords(playerPed)
        local found = false

        for id, data in pairs(activeNPCs) do
            if DoesEntityExist(data.npc) then
                local npcCoords = GetEntityCoords(data.npc)
                local dist = #(playerCoords - npcCoords)
                if dist <= (data.interactDist or 1.5) then
                    ShowTextUI("E - Hablar")
                    showingTextUI = true
                    currentNPC = id
                    found = true
                    if IsControlJustPressed(0, 38) then -- E
                        TriggerEvent("dp-quests:client:onInteractWithNPC", id, data.npc)
                    end
                    break
                end
            end
        end

        if not found and showingTextUI then
            HideTextUI()
            showingTextUI = false
            currentNPC = nil
        end
    end
end)

RegisterNetEvent("dp-quests:client:onInteractWithNPC", function(npcId, npcEntity)
    QBCore.Functions.Notify("¡Has interactuado con el NPC!", "success")
end)
