local url = "ws://localhost:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "time-based grapher"
local clientName = "Base Prod"

local dataType = '{"type":"energy rate","unit":"FE","keys":["rate"]}'

local registerMsg = '{"action":"register","payload":{"id":"'..clientName..'","clientType":"'..clientType..'","dataType":'..dataType..'}}'
ws.send(registerMsg)


local energyDetector = peripheral.wrap('back')


while true do
    local rate = energyDetector.getTransferRate()

    ws.send('{"action":"data","payload":{"data":{"rate":'..rate..'}}}')
    sleep(1)
end