local url = "ws://home.kensa.fr:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "door"
local clientName = "porteBase"

ws.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName..'"}}')

while true do
    local _, url, response, isBinary = os.pullEvent("websocket_message")
    if isBinary then
        print('message is in binary')
    else
        print('Received: ' .. response)
        --do stuff
    end
end
