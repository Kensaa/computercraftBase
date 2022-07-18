import {DatabaseClient, Rate, RateType, Storage, StorageType, SubtypedClient, User} from './types'
import { Database } from 'sqlite3'
import { promisify } from 'util'

const MAXLENGTH = 200;

export interface AsyncDatabase extends Database {
    runAsync(sql: string): Promise<void>
    runAsync(sql: string, params: unknown): Promise<void>
    runAsync(sql: string, ...params: unknown[]): Promise<void>

    getAsync(sql: string): Promise<unknown>
    getAsync(sql: string, params: unknown): Promise<unknown>
    getAsync(sql: string, ...params: unknown[]): Promise<unknown>

    allAsync(sql: string): Promise<unknown[]>
    allAsync(sql: string, params: unknown): Promise<unknown[]>
    allAsync(sql: string, ...params: unknown[]): Promise<unknown[]>
}

export async function loadDatabase(
    src:string
): Promise<AsyncDatabase> {
    const db = new Database(src) as AsyncDatabase
    db.runAsync = promisify(db.run)
    db.getAsync = promisify(db.get)
    db.allAsync = promisify(db.all)

    //create table to store user
    await db.runAsync(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        permissions TEXT NOT NULL
    );`)

    await db.runAsync(`CREATE TABLE IF NOT EXISTS Clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        subtype TEXT
    );`)

    await db.runAsync('DELETE FROM Clients')

    await db.runAsync(`CREATE TABLE IF NOT EXISTS Rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        time INTEGER NOT NULL,
        rate INTEGER NOT NULL,
        source TEXT NOT NULL,
        type TEXT NOT NULL
    );`)

    await db.runAsync(`CREATE TABLE IF NOT EXISTS Storages (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        time INTEGER NOT NULL,
        storage INTEGER NOT NULL,
        maxStorage INTEGER NOT NULL,
        source TEXT NOT NULL,
        type TEXT NOT NULL,
        data TEXT
    );`)

    return db
}

//-----------------USER---------------\\

export async function getUserByName(
    db: AsyncDatabase,
    username: User['username']
): Promise<User> {
    const query = 'SELECT * FROM Users WHERE username=?'
    var queryResult = await db.getAsync(query, username) as {id:number,username:string,password:string,permissions:string}
    const result = {...queryResult, permissions: JSON.parse(queryResult.permissions)} as User
    return result
}

export async function getUserById(
    db: AsyncDatabase,
    id: User['id']
): Promise<User> {
    const query = 'SELECT * FROM Users WHERE id=?'
    const queryResult = await db.getAsync(query, id) as {id:number,username:string,password:string,permissions:string}
    const result = {...queryResult, permissions: JSON.parse(queryResult.permissions)} as User
    return result
}

export async function addUser(
    db: AsyncDatabase,
    username: User['username'],
    password: User['password'],
    permissions: User['permissions']
): Promise<void> {
    const query = 'INSERT INTO Users (username, password, permissions) VALUES (?, ?, ?)'
    await db.runAsync(query,
        username,
        password,
        JSON.stringify(permissions)
    )
}

export async function userExists(
    db: AsyncDatabase,
    username: User['username']
): Promise<boolean> {
    const query = 'SELECT EXISTS(SELECT 1 FROM Users WHERE username=?);'
    const res = await db.getAsync(query, username) as { [key: string]: number }
    return Boolean(Object.values(res)[0])
}

//-----------------CLIENT---------------\\


export async function getClient(
    db: AsyncDatabase,
    id: DatabaseClient['id']
) : Promise<DatabaseClient> {
    const query = `SELECT * FROM Clients WHERE id=?`
    const result = await db.getAsync(query, id) as DatabaseClient
    return result
}

export async function getClients(
    db: AsyncDatabase
) : Promise<DatabaseClient[]> {
    const query = `SELECT * FROM Clients`
    const result = await db.allAsync(query) as DatabaseClient[]
    return result
}

export async function getClientsByType(
    db: AsyncDatabase,
    type: DatabaseClient['type']
) : Promise<DatabaseClient[]> {
    const query = `SELECT * FROM Clients WHERE type = ?`
    const result = await db.allAsync(query, type) as DatabaseClient[]
    return result
}

export async function getClientByName(
    db: AsyncDatabase,
    name: DatabaseClient['name']
) : Promise<DatabaseClient> {
    const query = `SELECT * FROM Clients WHERE name = ?`
    const result = await db.getAsync(query, name) as DatabaseClient
    return result
}

export async function addClient(
    db: AsyncDatabase,
    name: DatabaseClient['name'],
    type: DatabaseClient['type'],
    subtype?: SubtypedClient<StorageType|RateType>['subtype']
) : Promise<DatabaseClient['id']> {
    const query = `INSERT INTO Clients (name, type, subtype) VALUES (?,?,?)`
    await db.runAsync(query,
        name,
        type,
        subtype
    )
    const id = (await db.getAsync('SELECT id FROM Clients ORDER BY id DESC LIMIT 1') as {id:number}).id as number
    return id
}

export async function removeClient(
    db: AsyncDatabase,
    id: DatabaseClient['id']
): Promise<void> {
    const query = `DELETE FROM Clients WHERE id = ?`
    await db.runAsync(query,id)
}



//-----------------STORAGE---------------\\

export async function getStorage(
    db: AsyncDatabase,
    id: Storage['id']
) : Promise<Storage> {
    const query = `SELECT * FROM Storages WHERE id=?`
    const result = await db.getAsync(query, id) as Storage
    return result
}

export async function getStoragesBySource(
    db: AsyncDatabase,
    source: Storage['source'],
    count?: number
) : Promise<Storage[]> {
    if(!count) count = 100
    const query = `SELECT * FROM Storages WHERE source = ? ORDER BY time DESC LIMIT ?`
    const result = await db.allAsync(query,source, count) as Storage[]
    return result.reverse()
}

export async function getStoragesByType(
    db: AsyncDatabase,
    type: Storage['type']
) : Promise<Storage[]> {
    const query = `SELECT * FROM Storages WHERE type = ?`
    const result = await db.allAsync(query, type) as Storage[]
    return result
}

export async function addStorage(
    db: AsyncDatabase,
    storage: Storage['storage'],
    maxStorage: Storage['maxStorage'],
    source: Storage['source'],
    type: Storage['type'],
    data?: Storage['data']
) : Promise<void> {
    const sourceData = await getStoragesBySource(db, source)
    if(sourceData.length > MAXLENGTH){
        const id = (await db.getAsync('SELECT id FROM Storages WHERE source=? ORDER BY time ASC LIMIT 1',source) as {id:number}).id
        await db.runAsync('DELETE FROM Storages WHERE id = ?',id)
    }
    const time = new Date().getTime().toString()
    const query = `INSERT INTO Storages (time, storage, maxStorage, source, type, data) VALUES (?,?,?,?,?,?)`
    await db.runAsync(query,
        time,
        storage,
        maxStorage,
        source,
        type,
        data
    )
}


//-----------------RATE---------------\\

export async function getRate(
    db: AsyncDatabase,
    id: Rate['id']
) : Promise<Rate> {
    const query = `SELECT * FROM Rates WHERE id = ?`
    const result = await db.getAsync(query, id) as Rate
    return result
}

export async function getRatesBySource(
    db: AsyncDatabase,
    source: Rate['source'],
    count?: number
) : Promise<Rate[]> {
    const query = `SELECT * FROM Rates WHERE source = ? ORDER BY time DESC LIMIT ?`
    const result = await db.allAsync(query,source, count) as Rate[]
    return result.reverse()
}

export async function getRatesByType(
    db: AsyncDatabase,
    type: Rate['type']
) : Promise<Rate[]> {
    const query = `SELECT * FROM Rates WHERE type = ?`
    const result = await db.allAsync(query, type) as Rate[]
    return result
}

export async function addRate(
    db: AsyncDatabase,
    rate: Rate['rate'],
    source: Rate['source'],
    type: Rate['type']
) : Promise<void> {
    const sourceData = await getStoragesBySource(db, source)
    if(sourceData.length > MAXLENGTH){
        const id = (await db.getAsync('SELECT id FROM Rates WHERE source=? ORDER BY time ASC LIMIT 1',source) as {id:number}).id
        await db.runAsync('DELETE FROM Rates WHERE id = ?',id)
    }
    const time = new Date().getTime().toString()
    const query = `INSERT INTO Rates (time, rate, source, type) VALUES (?,?,?,?)`
    await db.runAsync(query,
        time,
        rate,
        source,
        type
    )
}