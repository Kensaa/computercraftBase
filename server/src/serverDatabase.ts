import * as Database from 'better-sqlite3'
import * as fs from 'fs'
import { Client, ClientInfo, Account, Data, Group } from './types'

const MAX_COUNT = 10000

export class ServerDatabase {
    filename: string
    db: Database.Database
    backupDelay: number

    /**
     * Create a new instance of the server database
     * @param filename path to the database file
     * @param backupDelay delay in seconds between saving to disk of the database (default 10sec)
     */
    constructor(filename: string, backupDelay = 10) {
        this.filename = filename
        this.backupDelay = backupDelay
        //This creates a new database of create an existing one
        const firstRun = !fs.existsSync(filename)
        const temp = new Database(filename)
        if (firstRun) {
            //Create tables
            temp.exec(`CREATE TABLE ClientInfos (
                id INTEGER NOT NULL, /*primary key, index of row in database*/
                type TEXT NOT NULL, /*type of client*/
                dataType TEXT, /*type of the data sent by the client*/
                dataUnit TEXT, /*unit of the data sent by the client*/
                dataKeys TEXT, /*stringified array of the keys (ex: [maxStorage, currentStorage]) (null if client doesn"t send data)*/
                actions TEXT, /*stringified array of the client's actions (null if client doesn"t have action*/
                PRIMARY KEY (id)
            )`)

            temp.exec(`CREATE TABLE Clients (
                name TEXT NOT NULL, /*primary key, name of the client*/
                hidden BOOLEAN NOT NULL, /*is client hidden in UI*/
                infoID INTEGER NOT NULL, /*foreign key, id of ClientInfos row*/
                PRIMARY KEY (name)
                FOREIGN KEY (infoID) REFERENCES ClientInfos(id)
            )`)

            temp.exec(`CREATE TABLE Groups (
                name TEXT NOT NULL, /*primary key, name of the group*/
                PRIMARY KEY (name)
            )`)

            temp.exec(`CREATE TABLE GroupMembers (
                groupName INTEGER NOT NULL, /*primary and foreign key, name of the group*/
                clientName INTEGER NOT NULL, /*primary and foreign key, name of the client*/
                PRIMARY KEY (groupName,clientName),
                FOREIGN KEY (groupName) REFERENCES Groups(name),
                FOREIGN KEY (clientName) REFERENCES Clients(name)
            )`)

            temp.exec(`CREATE TABLE Data (
                id INTEGER NOT NULL, /*primary key, index of row in database*/
                source TEXT NOT NULL, /*foreign key, name of the source client*/
                data TEXT NOT NULL, /*stringified object where keys are element of client's datakeys*/
                time TEXT NOT NULL, /*time when data was added*/
                PRIMARY KEY (id),
                FOREIGN KEY (source) REFERENCES Clients(name)
            )`)

            temp.exec(`CREATE TABLE Accounts (
                id INTEGER NOT NULL, /*primary key, index of row in database*/
                username TEXT NOT NULL, /*username of the account*/
                password TEXT NOT NULL, /*hashed password of the account*/
                PRIMARY KEY (id)
            )`)
        }

        this.db = new Database(temp.serialize())
        temp.close()

        setInterval(() => this.save(), backupDelay * 1000)
    }

    /**
     * Save database to file
     */
    async save() {
        await this.db.backup(this.filename)
    }

    /**
     * Insert a object into a table of a database
     * @param table The table to insert into
     * @param data The object of the data to insert
     * @returns The insert request response
     */
    insert(table: string, data: Record<string, unknown>): Database.RunResult {
        const keys = Object.keys(data).filter(e => data[e] !== undefined)
        const keysString = `(${keys.join(',')})`
        const values = keys
            .map(e => data[e])
            .map(e => {
                if (typeof e === 'boolean') return e ? 1 : 0
                return e as string
            })
            .map(e => `'${e.toString()}'`)
        const valuesString = `(${values.join(',')})`
        const request = `INSERT INTO ${table} ${keysString} VALUES ${valuesString}`
        return this.db.prepare(request).run()
    }

    /**
     * Check if a row exists in a table
     * @param table the table to check into
     * @param data the data to check for
     * @returns true if row exists
     */
    exists(table: string, data: Record<string, unknown>): boolean {
        return this.count(table, data) > 0
    }

    /**
     * Count rows from a table
     * @param table the table to check into
     * @param data the data to check for
     * @returns the count of row
     */
    count(table: string, data: Record<string, unknown>): number {
        const conditions = Object.keys(data).map(key => {
            const value = data[key]
            const v = typeof value === 'number' ? value : `'${value}'`
            return `${key} = ${v}`
        })
        const request = `SELECT * FROM ${table} WHERE ${conditions.join(
            ' AND '
        )}`
        return this.db.prepare(request).all().length
    }

    /**
     * Take a Object where some keys are stringified object and parse them back to objects
     * @param data the raw data to parse
     * @param keys the keys of the data that needs parsing
     * @returns the parsed data
     */
    parseData<T>(data: Record<string, unknown>, keys: string[]) {
        const out: Record<string, unknown> = {}
        Object.keys(data).map(key => {
            if (keys.includes(key)) {
                out[key] = JSON.parse(data[key] as string)
            } else {
                out[key] = data[key]
            }
        })
        return out as T
    }

    /**
     * Creates a new client in the database
     * @param name name of the client
     * @param hidden is the client hidden in the UI
     * @param type type of the client
     * @param dataType dataType of the client (the type of data sent by the client)
     * @param dataUnit unit of the data sent
     * @param dataKeys stringified array of the keys of the data send by the client (if it sends data)
     * @param actions stringified array of the actions of the client (if it has any)
     * @returns the id of the created client or undefined if the client already exists
     */
    createClient(
        name: Client['name'],
        hidden: Client['hidden'],
        type: ClientInfo['type'],
        dataType?: ClientInfo['dataType'],
        dataUnit?: ClientInfo['dataUnit'],
        dataKeys?: ClientInfo['dataKeys'],
        actions?: ClientInfo['actions']
    ) {
        if (this.exists('Clients', { name })) return undefined
        const clientInfoID = this.insert('ClientInfos', {
            type,
            dataType,
            dataUnit,
            dataKeys: JSON.stringify(dataKeys),
            actions: JSON.stringify(actions)
        }).lastInsertRowid
        const clientID = this.insert('Clients', {
            name,
            hidden,
            infoID: clientInfoID
        }).lastInsertRowid

        return clientID as number
    }

    /**
     * Get a client from the database using its name
     * @param name name of the client to get
     * @returns the client object
     */
    getClientByName(name: Client['name']) {
        const request = `SELECT Clients.name, Clients.hidden, ClientInfos.type, ClientInfos.dataType, ClientInfos.dataUnit, ClientInfos.dataKeys, ClientInfos.actions
                        FROM Clients 
                        INNER JOIN CLientInfos ON Clients.infoID = ClientInfos.id 
                        WHERE Clients.name = ?`
        const rawData = this.db.prepare(request).get(name) as Record<
            string,
            unknown
        >
        if (!rawData) return undefined

        return this.parseData<Client & ClientInfo>(rawData, [
            'dataKeys',
            'actions'
        ])
    }

    /**
     * Get all the clients from the database
     * @returns the clients
     */
    getClients() {
        const request = `SELECT Clients.name, Clients.hidden, ClientInfos.type, ClientInfos.dataType, ClientInfos.dataUnit, ClientInfos.dataKeys, ClientInfos.actions
        FROM Clients 
        INNER JOIN CLientInfos ON Clients.infoID = ClientInfos.id`
        const rawData = this.db.prepare(request).all() as Record<
            string,
            unknown
        >[]
        return rawData.map(data =>
            this.parseData<Client & ClientInfo>(data, ['dataKeys', 'actions'])
        )
    }

    /**
     * Creates a new group in the database
     * @param name the name of the group
     * @returns the id of the created group or undefined if the group already exists
     */
    createGroup(name: Group['name']) {
        if (this.groupExists(name)) return undefined
        return this.insert('Groups', { name }).lastInsertRowid as number
    }

    /**
     * Deletes a group
     * @param name name of the group
     * @returns true if operation succeeded, false otherwise
     */
    removeGroup(name: Group['name']): boolean {
        if (this.groupExists(name)) return false
        const request1 = 'DELETE FROM GroupMembers WHERE groupName = ?'
        const request2 = 'DELETE FROM Groups WHERE name = ?'
        this.db.prepare(request1).run(name)
        this.db.prepare(request2).run(name)
        return true
    }

    /**
     * Returns all groups
     * @returns a list of all the groups name
     */
    getGroups() {
        const groupNames = this.db
            .prepare('SELECT * FROM Groups')
            .all() as Group[]
        return groupNames
    }

    /**
     * Check if a group exists by its name
     * @param name name of the group
     * @returns true if group exists, false otherwise
     */
    groupExists(name: Group['name']) {
        return this.exists('Groups', { name })
    }

    /**
     * Get all the clients in a group
     * @param name name of the group
     * @returns list of all the clients in the group
     */
    getGroupMembers(name: Group['name']) {
        if (!this.exists('Groups', { name })) return undefined
        const request = `SELECT Clients.name, Clients.hidden, ClientInfos.type, ClientInfos.dataType, ClientInfos.dataUnit, ClientInfos.dataKeys, ClientInfos.actions 
                        FROM GroupMembers 
                        INNER JOIN Clients ON GroupMembers.clientName = Clients.name
                        INNER JOIN ClientInfos ON ClientInfos.id = Clients.infoID
                        WHERE GroupMembers.groupName = ?`
        const rawData = this.db.prepare(request).all(name) as Record<
            string,
            unknown
        >[]
        return rawData.map(data =>
            this.parseData<(Client & ClientInfo)[]>(data, [
                'dataKeys',
                'actions'
            ])
        )
    }

    /**
     * Add a client to a group
     * @param groupName name of the group
     * @param clientName name of the client
     * @returns true if operation succeeded, false otherwise
     */
    addClientToGroup(groupName: Group['name'], clientName: Client['name']) {
        if (this.exists('GroupMembers', { groupName, clientName })) return false
        if (!this.exists('Groups', { name: groupName })) return false
        if (!this.exists('Clients', { name: clientName })) return false
        this.insert('GroupMembers', { groupName, clientName })
        return true
    }

    /**
     * Remove a client from a group
     * @param groupName name of the group
     * @param clientName name of the client
     * @returns tue if operation succeeded, false otherwise
     */
    removeClientFromGroup(
        groupName: Group['name'],
        clientName: Client['name']
    ) {
        if (!this.exists('GroupMembers', { groupName, clientName }))
            return false
        const request =
            'DELETE FROM GroupMembers WHERE groupName = ? AND clientName = ?'
        this.db.prepare(request).run(groupName, clientName)
        return true
    }

    /**
     * Add data to client (update previous one if client is an instant-grapher)
     * @param source the name of the source client
     * @param data the data to add
     * @returns true if operation succeeded, false otherwise
     */
    addData(source: Client['name'], data: Data['data']) {
        const client = this.getClientByName(source)
        if (!client) return false
        if (client.type === 'instant grapher') {
            if (this.exists('Data', { source })) {
                this.db
                    .prepare(
                        'UPDATE Data SET data = ?, time = ? WHERE source = ?'
                    )
                    .run(JSON.stringify(data), new Date().toISOString(), source)
            } else {
                this.insert('Data', {
                    source,
                    data: JSON.stringify(data),
                    time: new Date().toISOString()
                })
            }
        } else {
            this.insert('Data', {
                source,
                data: JSON.stringify(data),
                time: new Date().toISOString()
            })
            const count = this.count('Data', { source })
            if (count > MAX_COUNT) {
                this.db
                    .prepare(
                        'DELETE FROM TimeData WHERE id IN (SELECT id FROM TimeData WHERE source = ? ORDER BY id ASC LIMIT ?)'
                    )
                    .run(source, count - MAX_COUNT)
            }
        }
        return true
    }

    /**
     * Get data (array or single object) from a client
     * @param source name of the client
     * @returns the data from the client (single data if client is an instant grapher, an aray otherwise)
     */
    getDataFromClient(source: Client['name'], maxCount = 100) {
        const client = this.getClientByName(source)
        if (!client) return []
        const rawData = this.db
            .prepare(
                'SELECT data, time FROM Data WHERE source = ? ORDER BY time DESC LIMIT ?'
            )
            .all(source, maxCount)
            .reverse() as Record<string, unknown>[]
        if (client.type === 'instant grapher') {
            return [this.parseData<Data>(rawData[0], ['data'])]
        } else {
            return rawData.map(data => this.parseData<Data>(data, ['data']))
        }
    }

    /**
     * Create a new account
     * @param username username of the account
     * @param password hashed password of the account
     * @returns id of the client or undefined if client already exists
     */
    createAccount(
        username: Account['username'],
        password: Account['password']
    ) {
        if (this.accountExists(username)) return false
        return this.insert('Accounts', { username, password })
            .lastInsertRowid as number
    }

    /**
     * Check if an account exists
     * @param username username of the account
     * @returns true if account exists, false otherwise
     */
    accountExists(username: Account['username']) {
        return this.exists('Accounts', { username })
    }

    /**
     * Try to login to an account (does username and password match)
     * @param username username of account to login to
     * @param password hashed password of the account to login to
     * @returns true if password is correct, false otherwise
     */
    login(username: Account['username'], password: Account['password']) {
        const res = this.db
            .prepare(
                'SELECT id FROM Accounts WHERE username = ? AND password = ?'
            )
            .get(username, password) as { id: number }
        if (!res) return undefined
        return res.id
    }

    /**
     * Return the account object from id (be aware that it also returns password)
     * @param id id of the account
     * @returns the account or undefined if it doesn't exist
     */
    getAccount(id: Account['id']): Account | undefined {
        return this.db
            .prepare('SELECT * FROM Accounts WHERE id = ?')
            .get(id) as Account
    }
}
