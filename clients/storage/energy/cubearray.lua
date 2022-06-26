local cubeTier = 'ultimate'
local cubeCount = 3
local energyStorage = {}

local firstIndex = 0

local ind = 1
for i = firstIndex, firstIndex+cubeCount do
    energyStorage[ind] = peripheral.wrap(cubeTier..'EnergyCube_'..i)
    ind = ind + 1
end

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

while true do
    local totalStored = 0
    local totalCapacity = 0
    for i = 1,cubeCount do
        totalStored = totalStored + energyStorage[i].getEnergy()
        totalCapacity = totalCapacity + energyStorage[i].getMaxEnergy()
    end

    ws.send('{"event":"pushStorage","payload":{"storage":'..totalStored..',"maxStorage":'..totalCapacity..'}}')
    sleep(1)
end