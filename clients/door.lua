local url = "ws://kensa.fr:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "door"
local clientName = "Porte Base"

ws.send('{"event":"register","payload":{"type":"'..clientType..'","name":"'..clientName..'"}}')

while true do
    local _, url, response, isBinary = os.pullEvent("websocket_message")
    if isBinary then
        print('message is in binary')
    else
        print('Received: ' .. response)
        --do stuff

        if response == "enter" then
            print("opening then closing door")
            rs.setOutput("right", true)
            sleep(5)
            rs.setOutput("right", false)
        elseif response == "open" then
            print("opening door")
            rs.setOutput("right", true)
        elseif response == "close" then
            print("closing door")
            rs.setOutput("right", false)
        end
    end
end
