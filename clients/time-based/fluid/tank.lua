local url = "ws://localhost:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "time-based grapher"
local clientName = "Tank 1"

local dataType = '{"type":"fluid storage","unit":"mb","keys":["storage","capacity","name"]}'

local registerMsg = '{"action":"register","payload":{"id":"'..clientName..'","clientType":"'..clientType..'","dataType":'..dataType..'}}'
ws.send(registerMsg)


local tank = peripheral.wrap('back')

while true do
    local storage = tank.getStored().amount
    local capacity = tank.getCapacity()
    local name = tank.getStored().name

    ws.send('{"action":"data","payload":{"data":{"storage":'..storage..',"capacity":'..capacity..',"name":"'..name..'"}}}')
    sleep(1)
end