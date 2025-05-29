import { removePrefix } from './helpers.js'

class Config {
    database: IDBDatabase
    name: string
    private fullName: string

    constructor(database: IDBDatabase, name: string, fullName: string) {
        this.database = database
        this.name = name
        this.fullName = fullName
    }

    static async init(name: string, prefix: string) {
        const fullName = `${prefix}_${name}`
        const request = window.indexedDB.open(fullName, 1)
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onerror = () => {
                reject(request.error!)
            }

            request.onupgradeneeded = () => {
                const db = request.result

                if (!db.objectStoreNames.contains('app')) {
                    db.createObjectStore('app', { keyPath: 'key' })
                }
            }
        })

        return new Config(database, name, fullName)
    }

    static async all(prefix: string) {
        return (await window.indexedDB.databases())
            .filter((db) => {
                return db.name?.startsWith(prefix)
            })
            .map((db) => {
                return removePrefix(db.name!, `${prefix}_`)
            })
    }

    get objectStore() {
        const transaction = this.database.transaction('app', 'readwrite')
        return transaction.objectStore('app')
    }

    async set(key: string, value: unknown): Promise<unknown> {
        const request = this.objectStore.put({ key, value })
        return new Promise<unknown>((resolve) => {
            request.onsuccess = () => {
                resolve(request.result)
            }
        })
    }

    async get(key: string): Promise<unknown> {
        const request = this.objectStore.get(key)
        return new Promise<unknown>((resolve) => {
            request.onsuccess = () => {
                resolve(
                    (
                        request.result as
                            | { key: string; value: unknown }
                            | undefined
                    )?.value
                )
            }
        })
    }

    async remove(key: string): Promise<unknown> {
        const request = this.objectStore.delete(key)
        return new Promise<unknown>((resolve) => {
            request.onsuccess = () => {
                resolve(true)
            }
        })
    }

    async close() {
        this.database.close()
    }

    async delete(): Promise<boolean> {
        const request = window.indexedDB.deleteDatabase(this.fullName)
        return new Promise<boolean>((resolve) => {
            request.onsuccess = () => {
                resolve(true)
            }
            request.onerror = function (event) {
                console.error('Error deleting config:', event)
                resolve(false)
            }

            request.onblocked = function (event) {
                console.error('Config deletion blocked:', event)
                resolve(false)
            }
        })
    }
}

export { Config }
