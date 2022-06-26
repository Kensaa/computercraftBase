local url = "ws://kensa.fr:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "rate"
local clientName = "Rate Base"

local rateType = 'energy'

ws.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName..'","rateType":"'..rateType..'"}}')

while true do
    local totalStored = 0
    local totalCapacity = 0
    for i = 1,cubeCount do
        totalStored = totalStored + energyStorage[i].getEnergy()
        totalCapacity = totalCapacity + energyStorage[i].getMaxEnergy()
    end

    ws.send('{"event":"pushStorage","payload":{"storage":'..totalStored..',"maxStorage":'..totalCapacity..',"type":"'..storageType..'"}}')
    sleep(1)
end