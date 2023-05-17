import * as Database from 'better-sqlite3'
import * as fs from 'fs'

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
        const temp = new Database(filename)
        if (!fs.existsSync(filename)) {
            //create tables
        }

        this.db = new Database(temp.serialize())
        temp.close()

        setInterval(this.save, backupDelay * 1000)
    }

    async save() {
        await this.db.backup(this.filename)
    }
}
