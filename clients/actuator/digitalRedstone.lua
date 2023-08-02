local url = "ws://localhost:3695"
local clientType = "actuator"
local clientName = "redstone1"

local dataType = {
    type="digital redstone",
    actions={
        "on",
        "off"
    }
}

local registerMsg = {
    action="register",
    payload={
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
        sleep(0.5)
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

function main()
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
end

function ping()
    while true do
        send({action="ping", payload={}})
        sleep(5)
    end
end

parallel.waitForAny(main,ping)