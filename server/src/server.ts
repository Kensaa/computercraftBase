import * as ws from 'ws'
import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import * as cors from 'cors'
import * as path from 'path'
import { Request,Response,NextFunction } from 'express'
import { WebsocketClient,SubtypedClient, WSMessage, RegisterPayload, StoragePayload, StorageType, RateType, SubtypedRegisterPayload, RatePayload,Permissions } from './types'
import * as sql from './sql'
import {randomBytes} from 'crypto'

const SOCKETPORT = 3694
const WEBSERVERPORT = SOCKETPORT+1

// Get fucked ^^ 
const authTokenSecret = randomBytes(64).toString('hex')

function authenticateJWT(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization
    if (authHeader) {
        jwt.verify(authHeader.split(' ')[1], authTokenSecret, (err, user) => {
            if (err) return res.sendStatus(403)
            res.locals.user = user
            next()
        })
    } else {
        res.sendStatus(401)
    }
}

(async ()=>{
    let websockets:WebsocketClient[] = []
    const database = await sql.loadDatabase('database.db')

    /*
    To make use "Kensa" admin
    const u = await sql.getUserByName(database,'Kensa')
    u.permissions.admin = 1
    await sql.editUser(database,u)
    */
    /*
    const u = await sql.getUserByName(database,'Kensa')
    u.password = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
    await sql.editUser(database,u)
    */

    const wsServer = new ws.Server({ port: SOCKETPORT })
    console.log(`websocket server started on port ${SOCKETPORT}`)

    const expressServer = express()
    expressServer.use(express.json())
    expressServer.use(cors())
    expressServer.listen(WEBSERVERPORT,()=>console.log(`web server started on port ${WEBSERVERPORT}`))
    
    // WEBSOCKET HANDLERS

    wsServer.on('connection', ws => {
        ws.on('close',async ()=>{
            const websocket = websockets.find(c=>c.ws===ws)
            if(websocket){
                const {id} = websocket
                const client = await sql.getClient(database,id)
                console.log(`unregistering client with name "${client.name}" and type "${client.type}"`)
                await sql.removeClient(database,id)
            }
            websockets = websockets.filter(e=>e.ws!==ws)
    
        })
        ws.on('message', async (data) => {
            const message:WSMessage = JSON.parse(data.toString())

            if(message.event==='register'){
                const payload = message.payload as RegisterPayload
                
                const same = await sql.getClientByName(database,payload.name)
                if(same && same.type === payload.type){
                    return
                }

                let id
                if(payload.type==='storage'){
                    const storagePayload = payload as SubtypedRegisterPayload<StorageType>
                    id = await sql.addClient(database,storagePayload.name,storagePayload.type,storagePayload.subtype)
                }else if(payload.type==='rate'){
                    const ratePayload = payload as SubtypedRegisterPayload<RateType>
                    id = await sql.addClient(database,ratePayload.name,ratePayload.type,ratePayload.subtype)
                }else{
                    id = await sql.addClient(database,payload.name,payload.type)
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

    // WEB SERVER HANDLERS

    function checkPermissions(permissions:Permissions,key:string,level:number,exact=false){
        if(!Object.keys(permissions).includes(key))return false
        if(permissions.admin === 1)return true
        if(exact){
            return permissions[key]===level
        }
        return permissions[key]>=level
    }


    expressServer.post('/api/user/login',async (req:Request,res:Response)=>{
        const { username, password } = req.body
        if (!username || !password) {
            res.sendStatus(400)
            return
        }

        if (!await sql.userExists(database,username)) {
            return res.sendStatus(404)
        }
        const user = await sql.getUserByName(database, username)

        if(user.password === password){
            const token = jwt.sign({ id:user.id, permissions:user.permissions }, authTokenSecret)
            const { password:_, ...userInfo } = user
            res.status(200).json({ token, user:userInfo })
        }else{
            res.sendStatus(401)
        }
    })

    expressServer.post('/api/user/register',async (req:Request,res:Response)=>{
        const { username, password } = req.body

        if(!username || !password){
            return res.sendStatus(400)
        }

        if(await sql.userExists(database,username)){
            return res.sendStatus(409)
        }
        const defaultPermissions = {
            door:0,
            reactor:0,
            storage:0,
            rate:0,
            admin:0
        } as Permissions
        await sql.addUser(database,username,password,defaultPermissions)
        
        const user = await sql.getUserByName(database,username)

        const token = jwt.sign({ id:user.id, permissions:user.permissions }, authTokenSecret)
    
        const { password:_, ...userInfo } = user
        res.status(200).json({ token, user:userInfo })
    })

    expressServer.get('/api/user/', authenticateJWT, async (req:Request,res:Response)=>{
        const { id } = res.locals.user
        const { password:_, ...userInfo } = await sql.getUserById(database,id)
        res.status(200).json(userInfo)
    })

    expressServer.get('/api/users/', authenticateJWT, async (req:Request,res:Response)=>{
        if(res.locals.user.permissions.admin !== 1)return res.sendStatus(403)
        const users = (await sql.getUsers(database))
        res.status(200).json(users)
    })

    expressServer.patch('/api/user/',authenticateJWT, async (req:Request,res:Response)=>{
        let target = res.locals.user.id
        if(req.body.id){
            if(res.locals.user.permissions.admin === 1){
                target = req.body.id
            }else{
                return res.sendStatus(403)
            }
        }
        if(req.body.permissions && res.locals.user.permissions.admin !== 1) return res.sendStatus(403)

        const user = await sql.getUserById(database,target)
        if(!await sql.userExists(database,user.username)){
            return res.sendStatus(404)
        }
        for (const key of Object.keys(req.body)) {
            if (!Object.keys(user).includes(key)) {
                return res.status(400).send('invalid key')
            }
        }
        const newUser = { ...user, ...req.body }
        await sql.editUser(database,newUser)
        res.sendStatus(200)


    })

    // ------------------- CLIENTS ------------------- \\
    // ----------------------------------------------- \\
    
    expressServer.get('/api/clients', authenticateJWT, async (req:Request,res:Response)=>{
        res.json(await sql.getClients(database))
    })

    // ------------------- DOOR ------------------- \\
    
    expressServer.get('/api/doors', authenticateJWT, async (req:Request,res:Response)=>{
        if(!checkPermissions(res.locals.user.permissions,'door',1)) return res.sendStatus(403)
        const doors = await sql.getClientsByType(database,'door')
        if(!doors)return res.sendStatus(404)
        res.send(doors.map(e=>e.name))
    })
    
    expressServer.post('/api/door',authenticateJWT, async (req:Request,res:Response)=>{
        if(!checkPermissions(res.locals.user.permissions,'door',2))return res.sendStatus(403)

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

    // ------------------- REACTOR ------------------- \\

    expressServer.get('/api/reactors', authenticateJWT, async (req:Request,res:Response)=>{
        if(!checkPermissions(res.locals.user.permissions,'reactor',1))return res.sendStatus(403)

        const reactors = await sql.getClientsByType(database,'reactor')
        if(!reactors)return res.sendStatus(404)
        res.send(reactors.map(e=>e.name))
    })

    expressServer.post('/api/reactor', authenticateJWT, async (req:Request,res:Response)=>{
        if(!checkPermissions(res.locals.user.permissions,'reactor',2))return res.sendStatus(403)

        const validActions = [
            {action:'on',level:2},
            {action:'off',level:2},
            {action:'setRate',level:3},
        ]
        if(req.body.reactor === undefined || req.body.action === undefined){
            res.sendStatus(400)
            return
        }

        // Check if action is in validActions list
        if(validActions.filter(e=>req.body.action.includes(e.action)).length === 0)return res.sendStatus(400)

        // Check if user as the permission to perform the action
        if(validActions.filter(e=>req.body.action.includes(e.action))[0].level > res.locals.user.permissions.reactor) return res.sendStatus(403)

        const reactor = await sql.getClientByName(database,req.body.reactor)
        if(reactor){
            const {ws} = websockets.filter(e=>e.id===reactor.id)[0]
            ws.send(req.body.action)
            res.sendStatus(200)
        }else{
            res.status(404).send('reactor not found')
        }
    })

    // ------------------- STORAGE ------------------- \\

    expressServer.get('/api/storages/', authenticateJWT, async (req:Request,res:Response)=>{
        if(!checkPermissions(res.locals.user.permissions,'storage',1))return res.sendStatus(403)

        const storages = await sql.getClientsByType(database,'storage') as SubtypedClient<StorageType>[]
        if(!storages)return res.sendStatus(404)
        res.send(storages.map(e=>({type:e.subtype,name:e.name})))
    })

    expressServer.get('/api/storages/:name', authenticateJWT, async (req:Request,res:Response)=>{
        if(!checkPermissions(res.locals.user.permissions,'storage',1))return res.sendStatus(403)

        let count = 100
        if(req.headers.count){
            count = parseInt(req.headers.count as string)
        }
        const client = await sql.getClientByName(database,req.params.name)
        if(!client)return res.status(404).send('client not found')

        const data = await sql.getStoragesBySource(database,client.name,count)
        if(!data)return res.status(404).send('no data available')
        const storageType = data[0].type
        if(storageType === 'energy'){
            if(checkPermissions(res.locals.user.permissions,'storage',2,true) || checkPermissions(res.locals.user.permissions,'storage',5)){
                return res.send(data.map(e=>(e.data ? {...e,data:JSON.parse(e.data)} : e)))
            }else{
                return res.sendStatus(403)
            }
        }else if(storageType === 'fluid'){
            if(checkPermissions(res.locals.user.permissions,'storage',3,true) || checkPermissions(res.locals.user.permissions,'storage',5)){
                return res.send(data.map(e=>(e.data ? {...e,data:JSON.parse(e.data)} : e)))
            }else{
                return res.sendStatus(403)
            }
        }else if(storageType === 'item'){
            if(checkPermissions(res.locals.user.permissions,'storage',4,true) || checkPermissions(res.locals.user.permissions,'storage',5)){
                return res.send(data.map(e=>(e.data ? {...e,data:JSON.parse(e.data)} : e)))
            }else{
                return res.sendStatus(403)
            }
        }
        res.sendStatus(500)
        
    })

    // ------------------- RATE ------------------- \\

    expressServer.get('/api/rates/', authenticateJWT, async (req:Request,res:Response)=>{
        if(!checkPermissions(res.locals.user.permissions,'rate',1))return res.sendStatus(403)

        const storages = await sql.getClientsByType(database,'rate') as SubtypedClient<RateType>[]
        if(!storages)return res.sendStatus(404)
        res.send(storages.map(e=>({type:e.subtype,name:e.name})))
    })

    expressServer.get('/api/rates/:name', authenticateJWT, async (req:Request,res:Response)=>{
        if(!checkPermissions(res.locals.user.permissions,'rate',2))return res.sendStatus(403)

        let count = 100
        if(req.headers.count){
            count = parseInt(req.headers.count as string)
        }
        const client = await sql.getClientByName(database,req.params.name)
        if(!client)return res.status(404).send('client not found')

        const data = await sql.getRatesBySource(database,client.name,count)
        if(!data)return res.status(404).send('no data available')
    
        res.send(data)
    })

    // ------------------- UI SERVE ------------------- \\

    expressServer.use(express.static('public'))
    expressServer.get('*', (req: Request, res: Response) =>{
        res.sendFile(path.join(__dirname,'..','public','index.html'))
    })
})()