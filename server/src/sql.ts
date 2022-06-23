import {EnergyRate,EnergyStorage} from './types'
import { Database } from 'sqlite3'
import { promisify } from 'util'

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

    await db.runAsync(`CREATE TABLE IF NOT EXISTS EnergyRate (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        time TEXT NOT NULL,
        inputRate INTEGER NOT NULL,
        outputRate INTEGER NOT NULL,
        source TEXT NOT NULL
    );`)

    await db.runAsync(`CREATE TABLE IF NOT EXISTS EnergyStorage (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        time TEXT NOT NULL,
        storage INTEGER NOT NULL,
        maxStorage INTEGER NOT NULL,
        source TEXT NOT NULL
    );`)

    return db
}

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
}