local url = "ws://localhost:3695"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "instant grapher"
local clientName = "create meter 1"

local dataType = {
    type="create meter unit",
    unit="",
    keys= {
        "speed",
        "stress",
        "capacity"
    },
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

local adapter = peripheral.wrap('left')

function send()
    while true do
        local speed = adapter.getKineticSpeed('bottom')
        local stress = adapter.getKineticStress('top')
        local capacity = adapter.getKineticCapacity('top')

        local dataMsg = {
            action="data",
            payload= {
                data= {
                    speed=speed,
                    stress=stress,
                    capacity=capacity
                }
            }
        }
        ws.send(textutils.serializeJSON(dataMsg))
        sleep(1)
    end
end

function receive()
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
end

parallel.waitForAll(send, receive)