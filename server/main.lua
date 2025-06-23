RegisterNetEvent('dp-quests:saveLocations', function(json)
    SaveResourceFile(GetCurrentResourceName(), "locations.json", json, -1)
end)

RegisterNetEvent('dp-quests:getLocations', function()
    local src = source
    local data = LoadResourceFile(GetCurrentResourceName(), "locations.json") or "[]"
    local decoded = json.decode(data)
    if type(decoded) ~= "table" then
        decoded = {}
    end
    TriggerClientEvent('dp-quests:sendLocations', src, decoded)
end)