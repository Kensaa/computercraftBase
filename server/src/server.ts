import * as ws from 'ws'
import * as express from 'express'
import * as cors from 'cors'
import * as path from 'path'
import { Request,Response } from 'express'
import {Client,WSMessage,RegisterPayload,EnergyRatePayload,TypedRequest} from './types'
import * as sql from './sql'

const SOCKETPORT = 3694;
const WEBSERVERPORT = SOCKETPORT+1;

(async ()=>{
    var clients:Client[] = []
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
        ws.on('close',()=>{
            const client = clients.find(c=>c.ws===ws)
            if(client){
                console.log(`unregistering client with name "${client.name}" and type "${client.type}"`)
            }
            clients = clients.filter(e=>e.ws!==ws);
    
        })
        ws.on('message', (data) => {
            const message:WSMessage = JSON.parse(data.toString())
            if(message.event==='register'){
                const payload = message.payload as RegisterPayload
                if(clients.find(e=>e.name===payload.name && e.type===payload.type))return
                const client:Client = {...payload,ws}
                clients.push(client)
                console.log(`registered client with name "${client.name}" and type "${client.type}"`)
            }else if (message.event==='energyRate'){
                const {rate} = message.payload as EnergyRatePayload
                const client = clients.find(e=>e.ws===ws)
                if(client){
                    const {name} = client
                    const time = new Date().getTime()
                    
                    sql.addEnergyRead(database,{rate,time:time+"",source:name,type:'rate'})
                }
            }
        })
    })
    
    
    expressServer.get('/api/door', async (req:Request,res:Response)=>{
        const doors = clients.filter(e=>e.type==='door')
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
        const door = clients.filter(e=>e.type==='door' && e.name===req.body.door)[0]
        if(door){
            door.ws.send(req.body.action)
            res.sendStatus(200)
        }else{
            res.status(404).send('door not found')
        }
    })

    expressServer.get('/api/energyLoggers', async (req:Request,res:Response)=>{
        const loggers = clients.filter(e=>e.type==='energyLogger').map(e=>e.name)
        res.send(loggers);
    })

    expressServer.get('/api/energyReads/:name/:count', async (req:Request,res:Response)=>{
        const name = req.params.name
        if(name === undefined || clients.find(e=>e.name===name && e.type==='energyLogger')===undefined){
            res.status(404).send('logger not found')
            return
        } 
        var count = parseInt(req.params.count)
        if(count === undefined || isNaN(count) || count<1)count = 100
        const energyReads = (await sql.getEnergyReads(database)).filter(e=>e.source===name).sort((a,b)=>parseInt(a.time)-parseInt(b.time))
        res.send(energyReads.slice(0,count))
    })

    expressServer.use(express.static('public'))
    expressServer.get('*', (req: Request, res: Response) =>{
        res.sendFile(path.join(__dirname,'..','public','index.html'));
    });
})()