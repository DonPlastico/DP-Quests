local QBCore = exports['qb-core']:GetCoreObject()

RegisterNetEvent('qb-quests:client:openMenu', function()
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "openMenu"
    })
end)

RegisterNetEvent('qb-quests:client:updateQuests', function(quests)
    SendNUIMessage({
        action = "updateQuests",
        quests = quests
    })
end)

RegisterCommand("quests", function()
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = "openMenu"
    })
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
    cb({ ok = true })
end)

RegisterNUICallback('getLocations', function(_, cb)
    TriggerServerEvent('dp-quests:getLocations')
    RegisterNetEvent('dp-quests:sendLocations', function(locations)
        cb(locations)
        -- Puedes quitar el event handler después si quieres
    end)
end)