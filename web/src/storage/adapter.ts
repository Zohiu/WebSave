/* eslint-disable @typescript-eslint/no-unused-vars */

export class StorageAdapter {
    static defaultOptions = {}
    options: typeof StorageAdapter.defaultOptions = {}

    constructor(options: typeof StorageAdapter.defaultOptions) {
        this.options = options
    }

    static setup(
        this: void,
        options: object
    ): StorageAdapter | Promise<StorageAdapter> {
        return new StorageAdapter(options)
    }

    static available(): boolean | Promise<boolean> {
        return true
    }

    save(title: string, content: string): boolean | Promise<boolean> {
        return true
    }

    delete(title: string): boolean | Promise<boolean> {
        return true
    }

    list(): File[] | Promise<File[]> {
        return []
    }
}
