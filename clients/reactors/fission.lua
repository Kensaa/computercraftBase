local url = "ws://kensa.fr:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end
 
local clientType = "reactor"
local clientName = "fission"
 
ws.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName..'"}}')
 
reactor = peripheral.wrap('back')
 
while true do
    local _, url, response, isBinary = os.pullEvent("websocket_message")
    if isBinary then
        print('message is in binary')
    else
        print('Received: ' .. response)
 
        if response == "on" then
            print("starting reactor")
            reactor.activate()
        elseif response == "off" then
            print("stopping reactor")
            reactor.scram()
        end
    end
end