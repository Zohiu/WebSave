import { removePrefix } from './helpers.js'

class Config {
    database: IDBDatabase

    constructor(database: IDBDatabase) {
        this.database = database
    }

    static async init(name: string, prefix: string) {
        const request = window.indexedDB.open(`${prefix}_${name}`, 1)
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

        return new Config(database)
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
}

export { Config }
