import * as ws from 'ws'
import * as express from 'express'
import * as cors from 'cors'
import * as path from 'path'
import { Request,Response } from 'express'
import { WebsocketClient,SubtypedClient, WSMessage, RegisterPayload, StoragePayload, StorageType, RateType, SubtypedRegisterPayload, RatePayload } from './types'
import * as sql from './sql'

const SOCKETPORT = 3694;
const WEBSERVERPORT = SOCKETPORT+1;

(async ()=>{
    var websockets:WebsocketClient[] = []
    var database = await sql.loadDatabase('database.db')

    const wsServer = new ws.Server({ port: SOCKETPORT })
    console.log(`websocket server started on port ${SOCKETPORT}`)

    const expressServer = express()
    expressServer.use(express.json())
    expressServer.use(cors())
    expressServer.listen(WEBSERVERPORT,()=>console.log(`web server started on port ${WEBSERVERPORT}`))
    
    
    const awaitForResponse = (socket:ws.WebSocket)=> {
        return new Promise<string>((resolve,reject)=>{
            socket.once('response',resolve)
        })
    }
    
    wsServer.on('connection', ws => {
        ws.on('close',async ()=>{
            const websocket = websockets.find(c=>c.ws===ws)
            if(websocket){
                const {id} = websocket
                const client = await sql.getClient(database,id)
                console.log(`unregistering client with name "${client.name}" and type "${client.type}"`)
                await sql.removeClient(database,id)
            }
            websockets = websockets.filter(e=>e.ws!==ws);
    
        })
        ws.on('message', async (data) => {
            const message:WSMessage = JSON.parse(data.toString())

            if(message.event==='register'){
                const payload = message.payload as RegisterPayload
                
                const same = await sql.getClientByName(database,payload.name)
                if(same && same.type === payload.type){
                    return
                }

                var id;
                if(payload.type==='storage'){
                    const storagePayload = payload as SubtypedRegisterPayload<StorageType>
                    id = await sql.addClient(database,storagePayload.name,storagePayload.type,storagePayload.subtype)
                }else if(payload.type==='rate'){
                    const ratePayload = payload as SubtypedRegisterPayload<RateType>
                    id = await sql.addClient(database,ratePayload.name,ratePayload.type,ratePayload.subtype)
                }else{
                    id = await sql.addClient(database,payload.name,payload.type);
                }

                websockets.push({ws,id})
                console.log(`registered client with name "${payload.name}" and type "${payload.type}" (id:${id})`)
            }
            else if(message.event === 'pushStorage'){
                const payload = message.payload as StoragePayload
                const websocket = websockets.find(e=>e.ws===ws)
                if(websocket){
                    const {id} = websocket
                    const client = await sql.getClient(database,id) as SubtypedClient<StorageType>
                    sql.addStorage(database,payload.storage,payload.maxStorage,client.name,client.subtype,JSON.stringify(payload.data))
                }
            }else if(message.event === 'pushRate'){
                const payload = message.payload as RatePayload
                const websocket = websockets.find(e=>e.ws===ws)
                if(websocket){
                    const {id} = websocket
                    const client = await sql.getClient(database,id) as SubtypedClient<RateType>
                    sql.addRate(database,payload.rate,client.name,client.subtype)
                }
            }
        })
    })
    
    expressServer.get('/api/clients',async (req:Request,res:Response)=>{
        res.json(await sql.getClients(database))
    })
    
    expressServer.get('/api/door', async (req:Request,res:Response)=>{
        const doors = await sql.getClientsByType(database,'door');
        if(!doors)return res.sendStatus(404)
        res.send(doors.map(e=>e.name))
    })
    
    expressServer.post('/api/door' , async (req:Request,res:Response)=>{
        const validActions = ['open','close','enter']
        if(req.body.door === undefined || req.body.action === undefined){
            res.sendStatus(400)
            return
        }
        if(!validActions.includes(req.body.action)){
            res.sendStatus(400)
            return
        }
        const door = await sql.getClientByName(database,req.body.door)
        if(door){
            const {ws} = websockets.filter(e=>e.id===door.id)[0]
            ws.send(req.body.action)
            res.sendStatus(200)
        }else{
            res.status(404).send('door not found')
        }
    })

    expressServer.get('/api/reactor', async (req:Request,res:Response)=>{
        const reactors = await sql.getClientsByType(database,'reactor');
        if(!reactors)return res.sendStatus(404)
        res.send(reactors.map(e=>e.name))
    })

    expressServer.post('/api/reactor' , async (req:Request,res:Response)=>{
        const validActions = ['on','off']
        if(req.body.reactor === undefined || req.body.action === undefined){
            res.sendStatus(400)
            return
        }
        if(!validActions.includes(req.body.action)){
            res.sendStatus(400)
            return
        }
        const reactor = await sql.getClientByName(database,req.body.reactor)
        if(reactor){
            const {ws} = websockets.filter(e=>e.id===reactor.id)[0]
            ws.send(req.body.action)
            res.sendStatus(200)
        }else{
            res.status(404).send('reactor not found')
        }
    })

    expressServer.get('/api/storages/', async (req:Request,res:Response)=>{
        const storages = await sql.getClientsByType(database,'storage') as SubtypedClient<StorageType>[]
        if(!storages)return res.sendStatus(404)
        res.send(storages.map(e=>({type:e.subtype,name:e.name})))
    })

    expressServer.get('/api/storages/:name' , async (req:Request,res:Response)=>{
        var count = 100
        if(req.headers.count){
            count = parseInt(req.headers.count as string)
        }
        const client = await sql.getClientByName(database,req.params.name)
        if(!client)return res.status(404).send('client not found')

        const data = await sql.getStoragesBySource(database,client.name,count)
        if(!data)return res.status(404).send('no data available')
        
        res.send(data.map(e=>(e.data ? {...e,data:JSON.parse(e.data)} : e)))
    })

    expressServer.get('/api/rates/', async (req:Request,res:Response)=>{
        const storages = await sql.getClientsByType(database,'rate') as SubtypedClient<RateType>[]
        if(!storages)return res.sendStatus(404)
        res.send(storages.map(e=>({type:e.subtype,name:e.name})))
    })

    expressServer.get('/api/rates/:name' , async (req:Request,res:Response)=>{
        var count = 100
        if(req.headers.count){
            count = parseInt(req.headers.count as string)
        }
        const client = await sql.getClientByName(database,req.params.name)
        if(!client)return res.status(404).send('client not found')

        const data = await sql.getRatesBySource(database,client.name,count)
        if(!data)return res.status(404).send('no data available')
    
        res.send(data)
    })

    expressServer.use(express.static('public'))
    expressServer.get('*', (req: Request, res: Response) =>{
        res.sendFile(path.join(__dirname,'..','public','index.html'));
    });
})()