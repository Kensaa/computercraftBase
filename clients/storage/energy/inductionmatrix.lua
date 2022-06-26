local url = "ws://kensa.fr:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "storage"
local clientName = "Energie Base"

local storageType = 'energy'

ws.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName..'","subtype":"'..storageType..'"}}')


local induction = peripheral.wrap('back')

while true do
    local storage = induction.getEnergy()
    local maxStorage = induction.getMaxEnergy()

    ws.send('{"event":"pushStorage","payload":{"storage":'..storage..',"maxStorage":'..maxStorage..'}}')
    sleep(1)
end