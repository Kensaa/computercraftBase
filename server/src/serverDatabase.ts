import * as Database from 'better-sqlite3'
import * as fs from 'fs'

export interface Client {
    name: string
    hidden: boolean
    infoID: number
}

export interface ClientInfo {
    id: number
    type: string
    dataType: string
    dataUnit: string
    dataKeys: string
    actions: string
}

export interface Group {
    name: string
}

export interface GroupMember {
    groupName: number
    clientName: number
}

class ServerDatabase {
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
        //this creates a new database of create an existing one
        const firstRun = !fs.existsSync(filename)
        const temp = new Database(filename)
        if (firstRun) {
            //create tables
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
     * save database to file
     */
    async save() {
        await this.db.backup(this.filename)
    }

    /**
     * insert a object into a table of a database
     * @param table The table to insert into
     * @param data The object of the data to insert
     * @returns The insert request response
     */
    insert(table: string, data: Record<string, any>): Database.RunResult {
        const keys = Object.keys(data).filter(e => data[e] !== undefined)
        const keysString = `(${keys.join(',')})`
        const values = keys
            .map(e => data[e])
            .map(e => {
                if (typeof e == 'boolean') return e ? 1 : 0
                return e
            })
            .map(e => `'${e.toString()}'`)
        const valuesString = `(${values.join(',')})`
        const request = `INSERT INTO ${table} ${keysString} VALUES ${valuesString}`
        return this.db.prepare(request).run()
    }

    /**
     * Check if a row exists in a table based on a single column
     * @param table the table to check into
     * @param column the column to check into
     * @param value the value to check for
     * @returns true if row exists
     */
    exists(table: string, data: Record<string, any>): boolean {
        const conditions = Object.keys(data).map(key => {
            const value = data[key]
            const v = typeof value == 'number' ? value : `'${value}'`
            return `${key} = ${v}`
        })
        const request = `SELECT * FROM ${table} WHERE ${conditions.join(
            ' AND '
        )}`
        return this.db.prepare(request).all().length > 0
    }

    /**
     * creates a new client in the database
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
            dataKeys,
            actions
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
        return this.db.prepare(request).get(name) as Omit<
            Client & ClientInfo,
            'infoID' | 'id'
        >
    }

    /**
     * Get all the clients from the database
     * @returns the clients
     */
    getClients() {
        const request = `SELECT Clients.name, Clients.hidden, ClientInfos.type, ClientInfos.dataType, ClientInfos.dataUnit, ClientInfos.dataKeys, ClientInfos.actions
        FROM Clients 
        INNER JOIN CLientInfos ON Clients.infoID = ClientInfos.id`
        return this.db.prepare(request).all() as Omit<
            Client & ClientInfo,
            'infoID' | 'id'
        >[]
    }

    /**
     * Creates a new group in the database
     * @param name the name of the group
     * @returns the id of the created group or undefined if the group already exists
     */
    createGroup(name: Group['name']) {
        if (this.exists('Groups', { name })) return undefined
        return this.insert('Groups', { name }).lastInsertRowid as number
    }

    /**
     * Deletes a group
     * @param name name of the group
     * @returns true if operation succeeded, false otherwise
     */
    removeGroup(name: Group['name']): boolean {
        if (!this.exists('Groups', { name })) return false
        const request1 = `DELETE FROM GroupMembers WHERE groupName = ?`
        const request2 = `DELETE FROM Groups WHERE name = ?`
        this.db.prepare(request1).run(name)
        this.db.prepare(request2).run(name)
        return true
    }

    /**
     * Returns all groups and their members
     * @returns a dict with the key being the group name and the value an array of the members of said group
     */
    getGroups() {
        const groupNames = this.db.prepare('SELECT name FROM Groups').all() as {
            name: string
        }[]

        const groups: Record<
            string,
            Omit<Client & ClientInfo, 'infoID' | 'id'>[]
        > = {}
        for (const { name } of groupNames) {
            groups[name] = this.db
                .prepare(
                    `SELECT Clients.name, Clients.hidden, ClientInfos.type, ClientInfos.dataType, ClientInfos.dataUnit, ClientInfos.dataKeys, ClientInfos.actions
                        FROM GroupMembers 
                        INNER JOIN Clients ON Clients.name = GroupMembers.clientName
                        INNER JOIN CLientInfos ON Clients.infoID = ClientInfos.id 
                        WHERE GroupMembers.groupName = ?
                        `
                )
                .all(name) as Omit<Client & ClientInfo, 'infoID' | 'id'>[]
        }
        return groups
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
        return this.db.prepare(request).all(name) as Omit<
            Client & ClientInfo,
            'infoID' | 'id'
        >[]
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
     * remove a client from a group
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
        const request = `DELETE FROM GroupMembers WHERE groupName = ? AND clientName = ?`
        this.db.prepare(request).run(groupName, clientName)
        return true
    }
}

const test = new ServerDatabase('test.db')
test.createClient(
    'client1',
    false,
    'feur',
    'quoicoubeh',
    'FE',
    '["caca","pipi"]',
    undefined
)
test.createClient(
    'client2',
    false,
    'feur',
    'quoicoubeh',
    'FE',
    '["caca","pipi"]',
    undefined
)
test.createClient(
    'client3',
    false,
    'feur',
    'quoicoubeh',
    'FE',
    '["caca","pipi"]',
    undefined
)
test.createClient(
    'client4',
    false,
    'feur',
    'quoicoubeh',
    'FE',
    '["caca","pipi"]',
    undefined
)
test.createClient(
    'client5',
    false,
    'feur',
    'quoicoubeh',
    'FE',
    '["caca","pipi"]',
    undefined
)
test.createClient(
    'client6',
    false,
    'feur',
    'quoicoubeh',
    'FE',
    '["caca","pipi"]',
    undefined
)

test.createGroup('group1')
test.createGroup('group2')
test.createGroup('group3')
test.addClientToGroup('group1', 'client1')
test.addClientToGroup('group1', 'client2')
test.addClientToGroup('group2', 'client3')
test.addClientToGroup('group2', 'client4')
test.addClientToGroup('group3', 'client5')
test.addClientToGroup('group3', 'client6')

console.log(test.getGroups())
