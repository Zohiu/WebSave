// All adapters need to be imported so they can register themselves.
import { DirectoryStorage } from './adapters/directory.js'

const storageAdapters = [DirectoryStorage]

import { Config } from '../config.js'
import { element, showWebsite, toggleableElement } from '../ui.js'
import { StorageAdapter } from './adapter.js'

function getAvailableStorageAdapters(): (typeof StorageAdapter)[] {
    const availableAdapters: (typeof StorageAdapter)[] = []
    for (const adapter of storageAdapters) {
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

export async function getChosenStorageAdapter(
    profile: Config
): Promise<StorageAdapter | undefined> {
    const storedAdapterType = getStorageAdapterByName(
        (await profile.get('storage')) as string
    )

    if (typeof storedAdapterType == 'undefined') {
        return undefined
    }

    const storedOptions = (await profile.get(
        'options'
    )) as typeof storedAdapterType.defaultOptions
    return new storedAdapterType(storedOptions)
}

export async function getActiveProfile(config: Config): Promise<Config> {
    let profileName = (await config.get('profile')) as string | undefined
    if (typeof profileName == 'undefined') {
        return await createProfile(config)
    }
    return Config.init(profileName, 'profiles')
}

export async function createProfile(config: Config): Promise<Config> {
    const storageSelect = element('#storage-type') as HTMLSelectElement
    storageSelect.innerHTML = ''
    storageAdapters.forEach((adapter) => {
        const option = document.createElement('option')
        option.value = adapter.name
        option.innerHTML = adapter.name
        option.disabled = !adapter.available()
        storageSelect.appendChild(option)
    })

    const section = toggleableElement('#create-profile')
    const form = section.element as HTMLFormElement
    section.show()
    toggleableElement('main').hide()

    await new Promise<null>((resolve) => {
        form.onsubmit = (event) => {
            event.preventDefault()
            resolve(null)
        }
    })

    const profileName = (element('#profile-name') as HTMLInputElement).value
    const chosenAdapter = storageAdapters.find((adapter) => {
        return adapter.name == storageSelect.value
    })!
    const options = chosenAdapter.defaultOptions

    // Try until it works. The site doesn't function otherwise.
    try {
        const instance = await chosenAdapter.setup(options)
        const profile = await Config.init(profileName, 'profiles')
        await profile.set('storage', chosenAdapter.name)
        await profile.set('options', instance.options)
        section.hide()
        toggleableElement('main').show()
        await config.set('profile', profileName)
        return profile
    } catch {
        console.error('Storage setup failed. Restarting!')
        return await createProfile(config)
    }
}


export async function populateFileList(storage: StorageAdapter) {
    const files = await storage.list()

    const fileList = element('#files')
    fileList.innerHTML = ''
    files.forEach((file) => {
        const fileSection = document.createElement('li')

        const link = document.createElement('a')
        link.innerText = file.name
        link.href = "#"
        link.onclick = async () => {
            showWebsite(file)
        }
        fileSection.appendChild(link)

        const deleteButton = document.createElement('button')
        deleteButton.innerText = 'Delete'
        deleteButton.onclick = async () => {
            await storage.delete(file.name)
            await populateFileList(storage)
        }
        fileSection.appendChild(deleteButton)

        fileList.appendChild(fileSection)
    })
    toggleableElement('#load-files').hide()
}
