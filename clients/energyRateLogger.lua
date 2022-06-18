local inputID = '3'
local outputID = '4'

local input = peripheral.wrap('energyDetector_'..inputID)
local output = peripheral.wrap('energyDetector_'..outputID)

local url = "ws://home.kensa.fr:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "energyRateLogger"
local clientName = "Energie Base"

ws.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName..'"}}')

while true do
    local inputRate = input.getTransferRate()
    local outputRate = output.getTransferRate()

    ws.send('{"event":"energyRate","payload":{"inputRate":'..inputRate..',"outputRate":'..outputRate..'}}')
    sleep(1)
end