local QBCore = exports['qb-core']:GetCoreObject()

function json_pretty(obj, indent)
    indent = indent or 0
    local spacing = string.rep("    ", indent)
    if type(obj) == "table" then
        local isArray = (#obj > 0)
        local s = isArray and "[\n" or "{\n"
        local first = true
        for k, v in pairs(obj) do
            if not first then
                s = s .. ",\n"
            end
            first = false
            s = s .. spacing .. "    "
            if not isArray then
                s = s .. string.format("%q: ", k)
            end
            s = s .. json_pretty(v, indent + 1)
        end
        s = s .. "\n" .. spacing .. (isArray and "]" or "}")
        return s
    elseif type(obj) == "string" then
        return string.format("%q", obj)
    else
        return tostring(obj)
    end
end

-- Evento para guardar localizaciones
RegisterNetEvent('dp-quests:saveLocations', function(jsonData)
    SaveResourceFile(GetCurrentResourceName(), "locations.json", jsonData, -1)
    TriggerClientEvent('dp-quests:client:locationUpdated', -1) -- Notificar a todos los clientes
end)

-- Evento para cambiar estado de localización
RegisterNetEvent('dp-quests:toggleLocation', function(locationId, isActive)
    local src = source
    local data = LoadResourceFile(GetCurrentResourceName(), "locations.json") or "[]"
    local locations = json.decode(data)
    for idx, loc in ipairs(locations) do
        if (loc.id and loc.id == locationId) or (not loc.id and loc.name == locationId) then
            loc.active = isActive
            SaveResourceFile(GetCurrentResourceName(), "locations.json", json_pretty(locations), -1)
            -- Notifica solo el índice/ID cambiado
            TriggerClientEvent('dp-quests:client:locationUpdated', -1, idx, loc)
            break
        end
    end
end)

-- Evento para obtener localizaciones
RegisterNetEvent('dp-quests:getLocations', function()
    local src = source
    local data = LoadResourceFile(GetCurrentResourceName(), "locations.json") or "[]"
    TriggerClientEvent('dp-quests:sendLocations', src, json.decode(data))
end)
