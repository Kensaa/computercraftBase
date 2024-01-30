local url = "ws://localhost:3695"
local clientType = "time-based grapher"
local clientName = "Tank 1"

local dataType = {
    type="fluid storage",
    unit="mb",
    keys= {
        {
             "storage",
             "capacity"
        }
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

local tank = peripheral.wrap('back')

while true do
    local storage = tank.getStored().amount
    local capacity = tank.getCapacity()

    local dataMsg = {
        action="data",
        payload= {
            data= {
                storage=storage,
                capacity=capacity
            }
        }
    }

    send(dataMsg)
    sleep(1)
end