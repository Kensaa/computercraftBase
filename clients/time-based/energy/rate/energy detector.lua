local url = "ws://localhost:3695"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "time-based grapher"
local clientName = "Base Prod"

local dataType = {
    type="energy rate",
    unit="FE",
    keys= {
        "rate"
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


local energyDetector = peripheral.wrap('back')


while true do
    local rate = energyDetector.getTransferRate()
    local dataMsg = {
        action="data",
        payload= {
            data= {
                rate=rate
            }
        }
    }
    ws.send(textutils.serializeJSON(dataMsg))
    sleep(1)
end