import {DatabaseClient, Rate, RateType, Storage, StorageType, SubtypedClient} from './types'
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



//-----------------CLIENT---------------\\


export async function getClient(
    db: AsyncDatabase,
    id: DatabaseClient['id']
) : Promise<DatabaseClient> {
    const result = await db.getAsync(`SELECT * FROM Clients WHERE id = ?`, id) as DatabaseClient
    return result
}

export async function getClients(
    db: AsyncDatabase
) : Promise<DatabaseClient[]> {
    const result = await db.allAsync(`SELECT * FROM Clients`) as DatabaseClient[]
    return result
}

export async function getClientsByType(
    db: AsyncDatabase,
    type: DatabaseClient['type']
) : Promise<DatabaseClient[]> {
    const result = await db.allAsync(`SELECT * FROM Clients WHERE type = ?`, type) as DatabaseClient[]
    return result
}

export async function getClientByName(
    db: AsyncDatabase,
    name: DatabaseClient['name']
) : Promise<DatabaseClient> {
    const result = await db.getAsync(`SELECT * FROM Clients WHERE name = ?`, name) as DatabaseClient
    return result
}

export async function addClient(
    db: AsyncDatabase,
    name: DatabaseClient['name'],
    type: DatabaseClient['type'],
    subtype?: SubtypedClient<StorageType|RateType>['subtype']
    ) : Promise<DatabaseClient['id']> {
    await db.runAsync(`INSERT INTO Clients (name, type, subtype) VALUES (?,?,?)`,
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
    await db.runAsync('DELETE FROM Clients WHERE id = ?',id)
}



//-----------------STORAGE---------------\\

export async function getStorage(
    db: AsyncDatabase,
    id: Storage['id']
) : Promise<Storage> {
    const result = await db.getAsync(`SELECT * FROM Storages WHERE id = ?`, id) as Storage
    return result
}

export async function getStoragesBySource(
    db: AsyncDatabase,
    source: Storage['source'],
    count?: number
) : Promise<Storage[]> {
    if(!count) count = 100
    const result = await db.allAsync(`SELECT * FROM Storages WHERE source = ? ORDER BY time DESC LIMIT ?`,source, count) as Storage[]
    return result.reverse()
}

export async function getStoragesByType(
    db: AsyncDatabase,
    type: Storage['type']
) : Promise<Storage[]> {
    const result = await db.allAsync(`SELECT * FROM Storages WHERE type = ?`, type) as Storage[]
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

    await db.runAsync(`INSERT INTO Storages (time, storage, maxStorage, source, type, data) VALUES (?,?,?,?,?,?)`,
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
    const result = await db.getAsync(`SELECT * FROM Rates WHERE id = ?`, id) as Rate
    return result
}

export async function getRatesBySource(
    db: AsyncDatabase,
    source: Rate['source'],
    count?: number
) : Promise<Rate[]> {
    const result = await db.allAsync(`SELECT * FROM Rates WHERE source = ? ORDER BY time DESC LIMIT ?`,source, count) as Rate[]
    return result.reverse()
}

export async function getRatesByType(
    db: AsyncDatabase,
    type: Rate['type']
) : Promise<Rate[]> {
    const result = await db.allAsync(`SELECT * FROM Rates WHERE type = ?`, type) as Rate[]
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

    await db.runAsync(`INSERT INTO Rates (time, rate, source, type) VALUES (?,?,?,?)`,
        time,
        rate,
        source,
        type
    )
}


/*
// EnergyRate --------------------------------------------------------------------------------------------------


export async function getEnergyRate(
    db: AsyncDatabase,
    id: EnergyRate['id']
): Promise<EnergyRate> {
    const result = await db.getAsync(`SELECT * FROM EnergyRate WHERE id = ?`, id) as EnergyRate
    return result
}

export async function getEnergyRates(
    db: AsyncDatabase,
    count?:number
): Promise<EnergyRate[]> {
    const result = await db.allAsync(`SELECT * FROM EnergyRate`) as EnergyRate[]
    return result
}

export async function getEnergyRateCount(
    db: AsyncDatabase
): Promise<number> {
    const result = await db.getAsync(`SELECT COUNT(*) FROM EnergyRate`) as number
    return result
}

export async function getEnergyRatesBySource(
    db: AsyncDatabase,
    source: EnergyRate['source'],
    count?: number
): Promise<EnergyRate[]> {
    let result;
    if(count){
        result = await db.allAsync(`SELECT * FROM EnergyRate WHERE source = ? ORDER BY Time DESC LIMIT ? `,source,count) as EnergyRate[]
    }else{
        result = await db.allAsync(`SELECT * FROM EnergyRate WHERE source = ? ORDER BY Time DESC`,source) as EnergyRate[]
    }
    return result.reverse()
}

export async function energyRateExists(
    db: AsyncDatabase,
    id: EnergyRate['id']
): Promise<boolean> {
    const result = await db.getAsync(`SELECT * FROM EnergyRate WHERE id = ?`, id)
    return result !== undefined
}

export async function addEnergyRate(
    db: AsyncDatabase,
    energyRead: EnergyRate
): Promise<void> {
    await db.runAsync(`INSERT INTO EnergyRate (time, inputRate,outputRate, source) VALUES (?,?,?,?)`,
        energyRead.time,
        energyRead.inputRate,
        energyRead.outputRate,
        energyRead.source
    )
    getEnergyRateCount(db).then((count)=>{
        if(count > 5000){
            db.runAsync(`DELETE FROM EnergyRate WHERE id IN (SELECT id FROM EnergyRate ORDER BY id ASC LIMIT 1)`)
        }
    })
}

export async function editEnergyRate(
    db: AsyncDatabase,
    newEnergyRead: EnergyRate
) : Promise<void> {
    const query = 'UPDATE EnergyRate SET time=?, inputRate=?, outputRate=?, source=? WHERE id=?'
    await db.runAsync(query,
        newEnergyRead.time,
        newEnergyRead.inputRate,
        newEnergyRead.outputRate,
        newEnergyRead.source,
        newEnergyRead.id
    )
}


// EnergyStorage --------------------------------------------------------------------------------------------------

export async function getEnergyStorage(
    db: AsyncDatabase,
    id: EnergyStorage['id']
): Promise<EnergyStorage> {
    const result = await db.getAsync(`SELECT * FROM EnergyStorage WHERE id = ?`, id) as EnergyStorage
    return result
}

export async function getEnergyStorages(
    db: AsyncDatabase,
    count?:number
): Promise<EnergyStorage[]> {
    const result = await db.allAsync(`SELECT * FROM EnergyStorage`) as EnergyStorage[]
    return result
}

export async function getEnergyStorageCount(
    db: AsyncDatabase
): Promise<number> {
    const result = await db.getAsync(`SELECT COUNT(*) FROM EnergyStorage`) as number
    return result
}

export async function getEnergyStoragesBySource(
    db: AsyncDatabase,
    source: EnergyStorage['source'],
    count?: number
): Promise<EnergyStorage[]> {
    let result;
    if(count){
        result = await db.allAsync(`SELECT * FROM EnergyStorage WHERE source = ? ORDER BY Time DESC LIMIT ? `,source,count) as EnergyStorage[]
    }else{
        result = await db.allAsync(`SELECT * FROM EnergyStorage WHERE source = ? ORDER BY Time DESC`,source) as EnergyStorage[]
    }
    return result.reverse()
}

export async function EnergyStorageExists(
    db: AsyncDatabase,
    id: EnergyStorage['id']
): Promise<boolean> {
    const result = await db.getAsync(`SELECT * FROM EnergyStorage WHERE id = ?`, id)
    return result !== undefined
}

export async function addEnergyStorage(
    db: AsyncDatabase,
    energyRead: EnergyStorage
): Promise<void> {
    await db.runAsync(`INSERT INTO EnergyStorage (time,storage,maxStorage,source) VALUES (?,?,?,?)`,
        energyRead.time,
        energyRead.storage,
        energyRead.maxStorage,
        energyRead.source
    )
    getEnergyStorageCount(db).then((count)=>{
        if(count > 5000){
            db.runAsync(`DELETE FROM EnergyStorage WHERE id IN (SELECT id FROM EnergyStorage ORDER BY id ASC LIMIT 1)`)
        }
    })
}

export async function editEnergyStorage(
    db: AsyncDatabase,
    newEnergyRead: EnergyStorage
) : Promise<void> {
    const query = 'UPDATE EnergyStorage SET time=?, storage=?, maxStorage=?, source=? WHERE id=?'
    await db.runAsync(query,
        newEnergyRead.time,
        newEnergyRead.storage,
        newEnergyRead.maxStorage,
        newEnergyRead.source,
        newEnergyRead.id
    )
}*/