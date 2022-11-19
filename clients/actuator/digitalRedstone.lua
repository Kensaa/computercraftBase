local url = "ws://localhost:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end
 
local clientType = "actuator"
local clientName = "redstone1"

local dataType = {
    "type"="digitalRedstone",
    "unit"="",
    "keys"= {
    },
    "actions"= {
        "on",
        "off"
    }
}

local registerMsg = {
    "action"="register",
    "payload"= {
        "id"=clientName,
        "clientType"=clientType,
        "dataType"=dataType
    }
}
ws.send(textutils.serializeJSON(registerMsg))
 
while true do
    local _, url, response, isBinary = os.pullEvent("websocket_message")
    print(response)
    if isBinary then
        print('message is in binary')
    else
        if response == "on" then
            redstone.setOutput("back", true)
        elseif response == "off" then
            redstone.setOutput("back", false)
        end
    end
end