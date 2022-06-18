local energy = peripheral.wrap('bottom')

local url = "ws://home.kensa.fr:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "energyLogger"
local clientName = "Energie Input"

ws.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName..'"}}')

while true do
    local transferRate = energy.getTransferRate()
    ws.send('{"event":"energyRate","payload":{"rate":'..transferRate..'}}')
    sleep(1)
end