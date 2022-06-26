local url = "ws://kensa.fr:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "storage"
local clientName = "chest1"

local storageType = "item"

ws.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName..'","subtype":"'..storageType..'"}}')


local chest = peripheral.wrap('back')

while true do

    local storage = 0
    for i, item in pairs(chest.list()) do
        storage = storage + 1
    end
    --local name = chest.getStored().name
    local maxStorage = chest.size()

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

    ws.send('{"event":"pushStorage","payload":{"storage":'..storage..',"maxStorage":'..maxStorage..',"data":{"items":'..json..'}}}')
    sleep(1)
end