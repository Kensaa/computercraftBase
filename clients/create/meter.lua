local url = "ws://localhost:3695"
local clientType = "instant grapher"
local clientName = "create meter 1"

local dataType = {
    type="create meter unit",
    unit="",
    keys= {
        {
            "speed",
            "stress",
            "capacity"
        }
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

local ws = nil

function connect(url, retry)
    retry = retry or 0
    if retry > 5 then
        print('Server is not reachable, shutting down.')
        os.shutdown()
    end
    ws = http.websocket(url)
    if not ws then
        print('Unable to connect to server, retrying in 5 seconds')
        sleep(5)
        connect(url, retry + 1)
    else
        print('Connected !')
        send(registerMsg)
    end
end

function send(data)
    passed, err = pcall(
        function ()
            ws.send(textutils.serializeJSON(data))
        end)
    if not passed
     then
        print('An error has occured while sending data to server ! reconnecting ...')
        connect(url)
    end
end

connect(url)

local adapter = peripheral.wrap('left')

function sendProcess()
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
        send(dataMsg)
        sleep(1)
    end
end

function receiveProcess()
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

parallel.waitForAll(sendProcess, receiveProcess)