local matrix = peripheral.wrap("back")

local url = "ws://kensa.fr:3694"

local ws1, err1 = http.websocket(url)
local ws2, err2 = http.websocket(url)


if not err1 == nil then
    print(err)
    return
end

if not err2 == nil then
    print(err)
    return
end

local clientType = "rate"
local clientName1 = "Base Input"
local clientName2 = "Base Output"

local rateType = 'energy'

ws1.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName1..'","subtype":"'..rateType..'"}}')
sleep(1)
ws2.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName2..'","subtype":"'..rateType..'"}}')

while true do
    local inputRate = matrix.getLastInput()*0.4
    local outputRate = matrix.getLastOutput()*0.4
    --local outputRate = matrix.getLastOutput()*0.4
    ws1.send('{"event":"pushRate","payload":{"rate":'..inputRate..'}}')
    ws2.send('{"event":"pushRate","payload":{"rate":'..outputRate..'}}')
    sleep(1)
end