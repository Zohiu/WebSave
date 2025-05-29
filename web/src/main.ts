import { Config } from './config.js'
import { fixWebsiteString, getWebsiteTitle } from './helpers.js'
import {
    getActiveProfile,
    getChosenStorageAdapter,
    populateFileList,
} from './storage/storage.js'
import { element, toggleableElement, loadingElement } from './ui.js'

const websiteCache = {
    title: '',
    content: '',
    clear() {
        this.title = ''
        this.content = ''
    },
}

async function main() {
    // Since main gets called to refresh the app, it needs to hide loading.
    loadingElement.hide()

    // General app config
    const config = await Config.init('state', 'app')

    // Profile config
    const profile = await getActiveProfile(config)
    const storage = await getChosenStorageAdapter(profile)
    if (typeof storage == 'undefined') {
        throw Error(
            "Storage undefined. This profile can't be used! Please file a bug report!"
        )
    }

    // Profile changing
    const profileSelect = element('#select-profile') as HTMLSelectElement
    const profiles = await Config.all('profiles')
    profileSelect.innerHTML = ''
    profiles.forEach((name) => {
        const option = document.createElement('option')
        option.value = name
        option.innerHTML = name
        profileSelect.appendChild(option)
    })
    profileSelect.value = profile.name
    profileSelect.onchange = async () => {
        loadingElement.show()
        await config.set('profile', profileSelect.value)
        main()
    }

    // Profile management
    element('#delete-profile').onclick = async () => {
        loadingElement.show()
        await profile.delete()
        await config.remove('profile')
        const remainingProfiles = await Config.all('profiles')
        if (remainingProfiles.length > 0) {
            await config.set('profile', remainingProfiles[0])
        }
        main()
    }
    element('#new-profile').onclick = async () => {
        loadingElement.show()
        await config.remove('profile')
        main()
    }

    // Close profile DB connection because we don't need more values.
    // Keeping it open would prevent profile deletion.
    profile.close()

    // Main functionality
    const loadWebsiteForm = toggleableElement('#load-website')
    const saveWebsiteForm = toggleableElement('#save-website')

    loadWebsiteForm.element.onsubmit = (event) => {
        event.preventDefault()
        loadingElement.show()

        const websiteInput = element('#website') as HTMLInputElement
        const website = fixWebsiteString(websiteInput.value)

        fetch(`get/${website}`)
            .then((response) => {
                loadingElement.hide()

                if (!response.ok) {
                    element(
                        '#load-error'
                    ).innerText = `Error ${response.status}`
                    throw new Error(`Response status: ${response.status}`)
                }
                return response.text()
            })
            .then((text) => {
                if (!text) return // Just to be sure.
                loadWebsiteForm.hide()
                websiteCache.title = getWebsiteTitle(website, text)
                websiteCache.content = text
                element('#save-title').innerText = websiteCache.title
                element('#save-subtitle').innerText = website
                websiteInput.value = ''
                saveWebsiteForm.show()
            })
    }

    saveWebsiteForm.element.onsubmit = async (event) => {
        event.preventDefault()
        if ((event.submitter as HTMLButtonElement).value == 'abort') {
            saveWebsiteForm.hide()
            loadWebsiteForm.show()
            websiteCache.clear()
            return
        }

        await storage.save(websiteCache.title, websiteCache.content)
        await populateFileList(storage)

        saveWebsiteForm.hide()
        loadWebsiteForm.show()
        websiteCache.clear()
    }

    element('#load-files').onclick = async () => {
        loadingElement.show()
        await populateFileList(storage)
        loadingElement.hide()
    }

    toggleableElement('#download').show()
    toggleableElement('#saved').show()

    // Depending on the browser, this only works aftert input.
    // For user convenience I'll just run it every time though in case it works.
    await populateFileList(storage)
}

window.onload = main

// PWA registration

const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register(
                '/sw.js',
                {
                    scope: '/',
                }
            )
            console.log(
                'Service worker registered with scope:',
                registration.scope
            )
        } catch (error) {
            console.error('Service worker registration failed:', error)
        }
    } else {
        console.warn('Service workers are not supported in this browser.')
    }
}

registerServiceWorker()

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
}

const installButton = document.getElementById('install')!
let installPrompt: BeforeInstallPromptEvent | undefined

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installPrompt = event as BeforeInstallPromptEvent
    installButton.hidden = false
})

installButton.addEventListener('click', async () => {
    if (!installPrompt) {
        return
    }
    const result = await installPrompt.prompt()
    console.log(`Install prompt was: ${result.outcome}`)
})

window.addEventListener('appinstalled', () => {
    installPrompt = undefined
    installButton.hidden = false
})
