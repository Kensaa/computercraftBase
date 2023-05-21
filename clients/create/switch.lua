local url = "ws://localhost:3695"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "actuator"
local clientName = "create switch 1"

local dataType = {
    type="create switch",
    actions= {
        "on",
        "off"
    }
}

local registerMsg = {
    action="register",
    payload= {
        name=clientName,
        clientType=clientType,
        dataType=dataType
    }
}
ws.send(textutils.serializeJSON(registerMsg))


while true do
    local _, url, responseStr, isBinary = os.pullEvent("websocket_message")
    if isBinary then
        print('message is in binary')
    else
        local res = textutils.unserializeJSON(responseStr)
        local action = res['action']
        local data = res['data']
        print(action)
        if action == "on" then
            redstone.setOutput("top", false)
        elseif action == "off" then
            redstone.setOutput("top", true)
        end
    end
end
