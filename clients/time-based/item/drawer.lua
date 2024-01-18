local url = "ws://localhost:3695"
local clientType = "time-based grapher"
local clientName = "Drawer"

local dataType = {
    type="drawer",
    unit="items",
    keys= {
        {
            "capacity",
            "count"
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

local drawer = peripheral.wrap('back')

while true do
    --*0.4 to convert J to FE
    local capacity = drawer.getItemLimit(1)
    local detail = drawer.getItemDetail(1)
    local count = 0
    if detail then
        count = detail.count
    end

    local dataMsg = {
        action="data",
        payload= {
            data= {
                capacity=capacity,
                count=count
            }
        }
    }
    send(dataMsg)
    sleep(1)
end