local url = "ws://localhost:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end
 
local clientType = "actuator"
local clientName = "redstone1"

local dataType = {
    type="digital redstone",
    unit="",
    keys={},
    actions={
        "on",
        "off"
    }
}

local registerMsg = {
    action="register",
    payload={
        id=clientName,
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
            redstone.setOutput("back", true)
        elseif action == "off" then
            redstone.setOutput("back", false)
        end
    end
end