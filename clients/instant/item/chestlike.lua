local url = "ws://localhost:3695"
local clientType = "instant grapher"
local clientName = "chest1"

local dataType = {
    type="chest",
    unit="",
    keys= {
        {
            "storage",
            "capacity",
            "items"
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
        ws = connect(url, retry + 1)
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

local chest = peripheral.wrap('back')

while true do
    local storage = 0
    for i, item in pairs(chest.list()) do
        storage = storage + 1
    end
    local capacity = chest.size()

    local items = {}
    for i, item in pairs(chest.list()) do
        items[i] = chest.getItemDetail(i)
    end

    local items2 = {}

    for i, item in pairs(items) do
        table.insert(items2,{
            slot=i,
            count=item.count,
            displayName=item.displayName,
            maxCount=item.maxCount,
            name=item.name
        })
    end

    send({action="data",payload={
        data={
            storage=storage,
            capacity=capacity,
            items=items2
        }
    }})
    sleep(1)
end