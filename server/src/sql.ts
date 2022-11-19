import { Database } from 'sqlite3'
import { promisify } from 'util'
import { Client, Group, InstantData, TimeData, User } from './type'

const MAXLENGTH = 1000

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

    await db.runAsync(`CREATE TABLE IF NOT EXISTS Clients (
        dbid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        id TEXT NOT NULL,
        clientType TEXT NOT NULL,
        dataType TEXT NOT NULL,
        connected INTEGER NOT NULL,
        hidden INTEGER NOT NULL
    );`)

    await db.runAsync(`CREATE TABLE IF NOT EXISTS Groups (
        dbid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        id TEXT NOT NULL,
        content TEXT NOT NULL
    )`)

    await db.runAsync(`CREATE TABLE IF NOT EXISTS TimeData (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        source TEXT NOT NULL,
        time TEXT NOT NULL,
        data TEXT NOT NULL
    );`)

    await db.runAsync(`CREATE TABLE IF NOT EXISTS InstantData (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        source TEXT NOT NULL,
        data TEXT NOT NULL
    );`)

    await db.runAsync(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        password TEXT NOT NULL
    );`)

    return db
}

export async function getClient(
    db: AsyncDatabase,
    dbid: Client['dbid']
) : Promise<Client> {
    const result = await db.getAsync('SELECT * FROM Clients WHERE dbid = ?', dbid) as Client
    return result
}

export async function getClients(
    db: AsyncDatabase
) : Promise<Client[]> {
    const result = await db.allAsync('SELECT * FROM Clients') as Client[]
    return result
}

export async function clientExists(
    db: AsyncDatabase,
    id: Client['id']
) : Promise<boolean> {
    const result = await db.allAsync('SELECT * FROM Clients WHERE id= ?', id) as Client[]
    return result.length > 0
}

export async function getClientWithIdentifier(
    db: AsyncDatabase,
    id: Client['id']
) : Promise<Client> {
    const result = await db.getAsync('SELECT * FROM Clients WHERE id = ?', id) as Client
    return result
}

export async function addClient(
    db: AsyncDatabase,
    id: Client['id'],
    clientType: Client['clientType'],
    dataType: Client['dataType'],
    connected: Client['connected'] = true,
    hidden: Client['hidden'] = false
    ) : Promise<number> {
    await db.runAsync('INSERT INTO Clients (id, clientType, dataType, connected, hidden) VALUES (?,?,?,?,?)',
        id,
        clientType,
        dataType,
        connected,
        hidden
    )
    const dbid = (await db.getAsync('SELECT id FROM Clients ORDER BY dbid DESC LIMIT 1') as { dbid: number }).dbid
    return dbid
}

export async function setClientConnected(
    database: AsyncDatabase,
    id: Client['id'],
    connected: Client['connected']
) : Promise<void> {
    await database.runAsync('UPDATE Clients SET connected = ? WHERE id = ?', connected, id)
}

// ------------------------------------------------------------------------------------------------------------------------ \\

export async function getGroup(
    db: AsyncDatabase,
    dbid: Group['dbid']
) : Promise<Group> {
    const result = await db.getAsync('SELECT * FROM Groups WHERE dbid = ?', dbid) as Group
    return result
}

export async function getGroups(
    db: AsyncDatabase
) : Promise<Group[]> {
    const result = await db.allAsync('SELECT * FROM Groups') as Group[]
    return result
}

export async function groupExists(
    db: AsyncDatabase,
    id: Group['id']
) : Promise<boolean> {
    const result = await db.allAsync('SELECT * FROM Groups WHERE id= ?', id) as Group[]
    return result.length > 0
}

export async function getGroupWithIdentifier(
    db: AsyncDatabase,
    id: Group['id']
) : Promise<Group> {
    const result = await db.getAsync('SELECT * FROM Groups WHERE id = ?', id) as Group
    return result
}

export async function addGroup(
    db: AsyncDatabase,
    id: Group['id'],
    members: Group['members']
) : Promise<number> {
    await db.runAsync('INSERT INTO Groups (id, members) VALUES (?,?)',
        id,
        members
    )
    const dbid = (await db.getAsync('SELECT id FROM Groups ORDER BY dbid DESC LIMIT 1') as { dbid: number }).dbid
    return dbid
}


// ------------------------------------------------------------------------------------------------------------------------ \\

export async function addTimeData(
    db: AsyncDatabase,
    source: Client['id'],
    time: string,
    data: string,
) : Promise<void> {
    await db.runAsync('INSERT INTO TimeData (source, time, data) VALUES (?,?,?)',
        source,
        time,
        data,
    )
    const count = (await db.getAsync('SELECT COUNT(*) FROM TimeData WHERE source = ?', source) as { 'COUNT(*)': number })['COUNT(*)']
    if (count > MAXLENGTH) {
        await db.runAsync('DELETE FROM TimeData WHERE id IN (SELECT id FROM TimeData WHERE source = ? ORDER BY id ASC LIMIT ?)',source, count - MAXLENGTH)
    }
}

export async function getTimeData(
    db: AsyncDatabase,
    source: Client['id'],
    count = 100
) : Promise<TimeData[]> {
    const result = await db.allAsync('SELECT * FROM TimeData WHERE source = ? ORDER BY time DESC LIMIT ?', source, count) as TimeData[]
    return result
}

// ------------------------------------------------------------------------------------------------------------------------ \\

export async function setInstantData(
    db: AsyncDatabase,
    id: Client['id'],
    data: string
) : Promise<void> {
    if(await instantDataExists(db, id)) {
        await db.runAsync('UPDATE InstantData SET data = ? WHERE source = ?', data, id)
    }else{
        await db.runAsync('INSERT INTO InstantData (source, data) VALUES (?,?)', id, data)
    }
}

export async function instantDataExists(
    db: AsyncDatabase,
    id: Client['id']
) : Promise<boolean> {
    const result = await db.allAsync('SELECT * FROM InstantData WHERE source= ?', id) as Client[]
    return result.length > 0
}

export async function getInstantData(
    db: AsyncDatabase,
    id: Client['id']
) : Promise<InstantData> {
    const result = await db.getAsync('SELECT * FROM InstantData WHERE source = ?', id) as InstantData
    return result
}

// ------------------------------------------------------------------------------------------------------------------------ \\

export async function getUserByName(
    database: AsyncDatabase,
    username: string
) : Promise<User> {
    const result = await database.getAsync('SELECT * FROM Users WHERE username = ?', username) as User
    return result
}

export async function userExists(
    database: AsyncDatabase,
    username: string
) : Promise<boolean> {
    const result = await database.allAsync('SELECT * FROM Users WHERE username= ?', username) as User[]
    return result.length > 0
}

export async function addUser(
    database: AsyncDatabase,
    username: string,
    password: string
) : Promise<void> {
    await database.runAsync('INSERT INTO Users (username, password) VALUES (?,?)',
        username,
        password
    )
}
