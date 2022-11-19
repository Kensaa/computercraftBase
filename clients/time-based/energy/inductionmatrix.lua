local url = "ws://localhost:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "time-based grapher"
local clientName = "Energie Base"


local dataType = {
    "type"="induction matrix",
    "unit"="FE",
    "keys"= {
        "energy",
        "capacity",
        "inputRate",
        "outputRate"
    }
}

local registerMsg = {
    "action"="register",
    "payload"= {
        "id"=clientName,
        "clientType"=clientType,
        "dataType"=dataType
    }
}
ws.send(textutils.serializeJSON(registerMsg))

local induction = peripheral.wrap('back')

while true do
    --*0.4 to convert J to FE
    local storage = induction.getEnergy()*0.4
    local maxStorage = induction.getMaxEnergy()*0.4
    local inputRate = induction.getLastInput()*0.4
    local outputRate = induction.getLastOutput()*0.4

    local dataMsg = {
        "action"="data",
        "payload"= {
            "data"= {
                "energy"=storage,
                "capacity"=maxStorage,
                "inputRate"=inputRate,
                "outputRate"=outputRate
            }
        }
    }
    ws.send(textutils.serializeJSON(dataMsg))
    sleep(1)
end