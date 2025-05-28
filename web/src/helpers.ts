import { Config } from './config.js'
import { StorageAdapter } from './storage.js'
import { DirectoryStorage } from './storage_adapters/directory.js'

export function removePrefix(str: string, prefix: string): string {
    if (str.startsWith(prefix)) {
        return str.slice(prefix.length)
    }
    return str
}

export function removeSuffix(str: string, suffix: string): string {
    if (str.endsWith(suffix)) {
        return str.slice(0, -suffix.length)
    }
    return str
}

function getAvailableStorageAdapters(): (typeof StorageAdapter)[] {
    const allAdapters = [DirectoryStorage]
    const availableAdapters: (typeof StorageAdapter)[] = []
    for (const adapter of allAdapters) {
        if (adapter.available()) availableAdapters.push(adapter)
    }

    return availableAdapters
}

function getStorageAdapterByName(
    name: string
): typeof StorageAdapter | undefined {
    const availableAdapters = getAvailableStorageAdapters()
    const match = availableAdapters.filter((adapter) => {
        return adapter.name == name
    })
    if (match.length > 0) return match[0]
    return undefined
}

async function chooseNewStorageAdapter(
    config: Config
): Promise<StorageAdapter> {
    const registerBTN = document.createElement('button')
    registerBTN.textContent = 'Click to start setup'
    document.body.appendChild(registerBTN)

    // User input is required somtimes.
    await new Promise((resolve) => {
        registerBTN.onclick = () => {
            resolve(true)
        }
    })

    const available = getAvailableStorageAdapters()
    const chosen = available[0]

    const options = chosen.defaultOptions
    const instance = await chosen.setup(options)

    await config.set('storage', chosen.name)
    await config.set('options', instance.options)
    return instance
}

export async function getChosenStorageAdapter(config: Config) {
    const storedAdapterType = getStorageAdapterByName(
        (await config.get('storage')) as string
    )

    if (typeof storedAdapterType == 'undefined') {
        const newStorage = await chooseNewStorageAdapter(config)
        return newStorage
    }

    const storedOptions = (await config.get(
        'options'
    )) as typeof storedAdapterType.defaultOptions
    return new storedAdapterType(storedOptions)
}
