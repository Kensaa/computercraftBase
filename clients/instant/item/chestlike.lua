local url = "ws://localhost:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "instant grapher"
local clientName = "chest1"

local dataType = {
    type="chest",
    unit="",
    keys= {
        "storage",
        "capacity",
        "items"
    }
}

local registerMsg = {
    action="register",
    payload= {
        id=clientName,
        clientType=clientType,
        dataType=dataType
    }
}
ws.send(textutils.serializeJSON(registerMsg))

local chest = peripheral.wrap('back')

while true do
    local storage = 0
    for i, item in pairs(chest.list()) do
        storage = storage + 1
    end
    local capacity = chest.size()

    local items = {}
    for i, item in pairs(chest.list()) do
        items[i] = chest.getItemDetail(i)
    end

    local json = '['
    local first = true
    for i, item in pairs(items) do
        if first then
            first = false
        else
            json = json .. ','
        end
        json = json .. '{'
        json = json .. '"slot":' .. i .. ','
        json = json .. '"count":' .. item.count .. ','
        json = json .. '"displayName":"' .. item.displayName .. '",'
        json = json .. '"maxCount":' .. item.maxCount .. ','
        json = json .. '"name":"' .. item.name .. '"'
        json = json .. '}'
    end
    json = json .. ']'

    ws.send('{"action":"data","payload":{"data":{"storage":'..storage..',"capacity":'..capacity..',"items":'..json..'}}}')
    sleep(1)
end