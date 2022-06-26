local ID = '3'

--local energyDetector = peripheral.wrap('energyDetector_'..ID)
local energyDetector = peripheral.wrap('back')

local url = "ws://kensa.fr:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "rate"
local clientName = "Prod Base"

local rateType = 'energy'

ws.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName..'","subtype":"'..rateType..'"}}')

while true do
    local rate = energyDetector.getTransferRate()
    
    ws.send('{"event":"pushRate","payload":{"rate":'..rate..'}}')
    sleep(1)
end