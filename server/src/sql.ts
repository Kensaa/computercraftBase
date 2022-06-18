import {EnergyRead,EnergyReadType} from './types'
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

    await db.runAsync(`CREATE TABLE IF NOT EXISTS EnergyReads (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE,
        time TEXT NOT NULL,
        rate INTEGER NOT NULL,
        source TEXT NOT NULL,
        type TEXT NOT NULL
    );`)
    
    return db
}

// EnergyRead --------------------------------------------------------------------------------------------------

export async function getEnergyRead(
    db: AsyncDatabase,
    id: EnergyRead['id']
): Promise<EnergyRead> {
    const result = await db.getAsync(`SELECT * FROM EnergyReads WHERE id = ?`, id) as EnergyRead
    return result
}

export async function getEnergyReads(
    db: AsyncDatabase
): Promise<EnergyRead[]> {
    const result = await db.allAsync(`SELECT * FROM EnergyReads`) as EnergyRead[]
    return result
}

export async function energyReadExists(
    db: AsyncDatabase,
    id: EnergyRead['id']
): Promise<boolean> {
    const result = await db.getAsync(`SELECT * FROM EnergyReads WHERE id = ?`, id)
    return result !== undefined
}

export async function addEnergyRead(
    db: AsyncDatabase,
    energyRead: EnergyRead
): Promise<void> {
    await db.runAsync(`INSERT INTO EnergyReads (time, rate, source, type) VALUES (?,?,?,?)`,
        energyRead.time,
        energyRead.rate,
        energyRead.source,
        energyRead.type
    )
}

export async function editEnergyRead(
    db: AsyncDatabase,
    newEnergyRead: EnergyRead
) : Promise<void> {
    const query = 'UPDATE EnergyReads SET time=?, rate=?, source=?, type=? WHERE id=?'
    await db.runAsync(query,
        newEnergyRead.time,
        newEnergyRead.rate,
        newEnergyRead.source,
        newEnergyRead.type,
        newEnergyRead.id
    )
}