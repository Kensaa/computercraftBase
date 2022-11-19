local url = "ws://localhost:3694"
local ws, err = http.websocket(url)
if not err == nil then
    print(err)
    return
end

local clientType = "time-based grapher"
local clientName = "Energie Base 2"

--local dataType = '{"type":"energy storage","unit":"FE","keys":["energy","capacity"]}'
local dataType = {
    "type"="energy storage",
    "unit"="FE",
    "keys"= {
        "energy",
        "capacity"
    }
}

--local registerMsg = '{"action":"register","payload":{"id":"'..clientName..'","clientType":"'..clientType..'","dataType":'..dataType..'}}'
local registerMsg = {
    "action"="register",
    "payload"= {
        "id"=clientName,
        "clientType"=clientType,
        "dataType"=dataType
    }
}
ws.send(textutils.serializeJSON(registerMsg))


local cube = peripheral.wrap("back")

while true do
    --*0.4 to convert J to FE
    local storage = cube.getEnergy()*0.4
    local maxStorage = cube.getMaxEnergy()*0.4

    local dataMsg = {
        "action"="data",
        "payload"= {
            "data"= {
                "energy"=storage,
                "capacity"=maxStorage
            }
        }
    }

    ws.send(textutils.serializeJSON(dataMsg))
    sleep(1)
end