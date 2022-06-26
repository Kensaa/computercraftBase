local url = "ws://kensa.fr:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "storage"
local clientName = "fluid1"

local storageType = 'fluid'

ws.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName..'","subtype":"'..storageType..'"}}')


local tank = peripheral.wrap('back')

while true do
    local storage = tank.getStored().amount
    local name = tank.getStored().name
    local maxStorage = tank.getCapacity()

    ws.send('{"event":"pushStorage","payload":{"storage":'..storage..',"maxStorage":'..maxStorage..',"data":{"name":"'..name..'"}}}')
    sleep(1)
end