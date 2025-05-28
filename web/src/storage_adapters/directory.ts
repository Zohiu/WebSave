import { StorageAdapter } from '../storage.js'

// Typescript does not officially define these because they have limited availability.
// Since we test for availability, it's safe to define the types ourselves.
interface ModernFileSystemDirectoryHandle extends FileSystemDirectoryHandle {
    queryPermission(descriptor: object): Promise<PermissionState>
    requestPermission(descriptor: object): Promise<PermissionState>
}

interface ModernWindow extends Window {
    showDirectoryPicker(
        options?: object
    ): Promise<ModernFileSystemDirectoryHandle>
}

export class DirectoryStorage extends StorageAdapter {
    static defaultOptions = {
        _selectedDir: Object as unknown as ModernFileSystemDirectoryHandle,
        fileExtension: '.html',
    }
    options: typeof DirectoryStorage.defaultOptions

    constructor(options: typeof DirectoryStorage.defaultOptions) {
        super(options)
        this.options = options
    }

    static async setup(
        this: void,
        options: typeof DirectoryStorage.defaultOptions
    ): Promise<DirectoryStorage> {
        options._selectedDir = await (
            window as unknown as ModernWindow
        ).showDirectoryPicker()
        return new DirectoryStorage(options)
    }

    static available() {
        try {
            ;(window as unknown as ModernWindow).showDirectoryPicker.bind({})
            return true
        } catch {
            return false
        }
    }

    async save(title: string, content: string): Promise<boolean> {
        if (!(await this.requestPermission())) return false
        const file = await this.options._selectedDir.getFileHandle(
            `${title}${this.options.fileExtension}`,
            { create: true }
        )
        const writable = await file.createWritable()
        await writable.write(content)
        await writable.close()
        return true
    }

    async delete(title: string): Promise<boolean> {
        if (!(await this.requestPermission())) return false
        try {
            await this.options._selectedDir.removeEntry(
                `${title}${this.options.fileExtension}`
            )
            return true
        } catch (error) {
            console.error(error)
            return false
        }
    }

    async list(): Promise<File[]> {
        if (!(await this.requestPermission())) return []

        const values = this.options._selectedDir.values()
        const sites = []
        for await (const entry of values) {
            if (
                entry.kind === 'file' &&
                entry.name.endsWith(this.options.fileExtension)
            ) {
                sites.push(await (entry as FileSystemFileHandle).getFile())
            }
        }
        return sites
    }

    async requestPermission() {
        if (
            (await this.options._selectedDir.queryPermission({
                mode: 'readwrite',
            })) != 'granted' &&
            (await this.options._selectedDir.requestPermission({
                mode: 'readwrite',
            })) != 'granted'
        ) {
            return false
        }
        return true
    }
}
