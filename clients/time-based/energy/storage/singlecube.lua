local url = "ws://localhost:3695"
local clientType = "time-based grapher"
local clientName = "cube1"

local dataType = {
    type="energy storage",
    unit="FE",
    keys= {
        "energy",
        "capacity"
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

local cube = peripheral.wrap("back")

while true do
    --*0.4 to convert J to FE
    local storage = cube.getEnergy()*0.4
    local maxStorage = cube.getMaxEnergy()*0.4

    local dataMsg = {
        action="data",
        payload= {
            data= {
                energy=storage,
                capacity=maxStorage
            }
        }
    }

    send(dataMsg)
    sleep(1)
end