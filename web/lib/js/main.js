// Elements
const showSavedButton = document.getElementById("showSaved")
const selectDirButton = document.getElementById("selectDir")
const selectDirWarning = document.getElementById("selectDirWarning")
const downloader = document.getElementById("downloader")
const downloaderSection = document.getElementById("downloaderSection")
const websiteField = document.getElementById("website")

const loading = document.getElementById("loading")
const sectionSavedContainer = document.getElementById("savedSection")
const sectionSaved = document.getElementById("saved")
const display = document.getElementById("display")
const error = document.getElementById("error")

const result = document.getElementById("result")
const resultTitle = document.getElementById("resultTitle")
const resultSubtitle = document.getElementById("resultSubtitle")
const resultSaveButton = document.getElementById("resultSave")
const resultAbortButton = document.getElementById("resultAbort")
const resultWarning = document.getElementById("resultWarning")

// Vars
let db;
let directory;
let cachedHTML;
let unsupported = false

const titleRegex = /<title>(.+)<\/title>/
const domainRegex = /http(?:s?):\/\/.*?([^\.\/]+?\.[^\.]+?)(?:\/|$)/
const startsWithHTTPRegex = /^http(?:s?):\/\//

function appLoadError(message) {
    error.hidden = false
    error.innerText = `Error: ${message}`
}

function downloadSuccess(html, website) {
    cachedHTML = html
    error.hidden = true
    // Find the <title>
    var title = titleRegex.exec(cachedHTML)
    if (title != null && title.length >= 2) {
        resultTitle.textContent = title[1]
        resultSubtitle.innerText = website
        resultSubtitle.hidden = false
    } else {
        resultTitle.textContent = website
        resultSubtitle.hidden = true
    }

    result.hidden = false
}

function hideResult() {
    result.hidden = true
    downloader.hidden = false
    cachedHTML = null
    websiteField.value = ""
}

function displaySavedSection() {
    downloaderSection.hidden = false
    sectionSavedContainer.hidden = false
    showSavedButton.hidden = true
    display.hidden = true
}

function removeSuffix(str, suffix) {
    if (str.endsWith(suffix)) {
        return str.slice(0, -suffix.length);
    }
    return str;
}

// Website saving

async function requestDirectoryPermission() {
    const permission = await directory.queryPermission({ mode: 'readwrite' });
    if (permission != 'granted') {
        const request = await directory.requestPermission({ mode: 'readwrite' });
        if (request != 'granted') {
            appLoadError("No read/write permissions!")
            return false
        }
    }
    return true
}

async function addFileToDatabase(filename) {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');

    const data = {
        filename,
        htmlContent: cachedHTML,
        savedAt: new Date()
    };

    await new Promise((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });

    // Wait for the transaction to complete to ensure durability
    await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

async function deleteFileFromDatabase(filename) {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');

    await new Promise((resolve, reject) => {
        const request = store.delete(filename);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });

    // Wait for transaction to complete
    await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

async function getFilesFromDatabase() {
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');

    // Await getAll request
    const records = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });

    // Map records into desired structure
    const files = records.map(({ filename, htmlContent, savedAt }) => {
        const file = new File(
            [htmlContent],
            filename,
            {
                type: "text/html",
                lastModified: new Date(savedAt).getTime(),
            }
        );
        return { file, lastModified: new Date(savedAt) };
    });

    // Sort by lastModified descending
    files.sort((a, b) => b.lastModified - a.lastModified);
    return files;
}

async function addFileToDirectory(filename) {
    if (!requestDirectoryPermission()) return

    const file = await directory.getFileHandle(filename, { create: true })
    const writable = await file.createWritable();
    await writable.write(cachedHTML)
    await writable.close()
}

async function deleteFileFromDirectory(filename) {
    if (!requestDirectoryPermission()) return

    try {
        await directory.removeEntry(filename);
    } catch (err) {
        console.error("Failed to delete file:", err);
        throw err;
    }
}

async function getFilesFromDirectory() {
    if (!requestDirectoryPermission()) return

    sectionSaved.innerHTML = "";

    const files = [];

    for await (const entry of directory.values()) {
        if (entry.kind === "file" && entry.name.endsWith(".html")) {
            let file = await entry.getFile();
            let lastModified = new Date(file.lastModified);
            files.push({ file, lastModified });
        }
    }

    // Sort files by lastModified descending (newest first)
    files.sort((a, b) => b.lastModified - a.lastModified);
    return files
}

async function displaySavedWebsites() {
    sectionSaved.innerHTML = "";
    let files;
    if (unsupported) {
        files = await getFilesFromDatabase()
    } else {
        files = await getFilesFromDirectory()
    }

    // Display sorted files
    for (const { file, lastModified } of files) {
        let liElement = document.createElement("li");
        liElement.classList.add("file-item");

        let aElement = document.createElement("a");
        aElement.href = "#";
        aElement.classList.add("file-link");
        aElement.textContent = `${removeSuffix(file.name, ".html")} (${lastModified.toLocaleString()})`;
        aElement.addEventListener("click", () => {
            displayWebsite(file);
        });
        liElement.appendChild(aElement);

        let deleteElement = document.createElement("button");
        deleteElement.textContent = "Delete";
        deleteElement.classList.add("delete-button");
        deleteElement.addEventListener("click", async () => {
            if (unsupported) {
                await deleteFileFromDatabase(file.name);
            } else {
                await deleteFileFromDirectory(file.name);
            }
            await displaySavedWebsites();
        });
        liElement.appendChild(deleteElement);

        sectionSaved.appendChild(liElement);
    }
}

// iFrame display

function displayWebsite(file) {
    var fileURL = URL.createObjectURL(file)
    downloaderSection.hidden = true
    sectionSavedContainer.hidden = true
    showSavedButton.hidden = false
    display.src = fileURL
}


window.onload = () => {
    'use strict';
    try { window.showDirectoryPicker.bind() }
    catch { 
        document.getElementById("unsupported").hidden = false 
        unsupported = true
        selectDirButton.hidden = true
    }

    // Database
    const dbOpenRequest = window.indexedDB.open('web-save', 4);

    dbOpenRequest.onerror = (event) => {
        selectDirButton.hidden = true
        appLoadError(event.target.error?.message)
    };

    dbOpenRequest.onsuccess = (event) => {
        db = event.target.result;
        // Set directory if it's supported.
        if (unsupported) {
            downloader.hidden = false
            displaySavedWebsites()
        } else {
            var transaction = db.transaction("settings", "readwrite")
            var objectStore = transaction.objectStore("settings")
            var request = objectStore.get("directory")
            request.onsuccess = async function () {
                if (!request.result) {
                    selectDirWarning.hidden = false
                    return
                }  // No directory set.
                directory = request.result.value
                downloader.hidden = false
                const permission = await directory.queryPermission({ mode: 'readwrite' });
                if (permission != 'granted') {
                    const button = document.createElement("button")
                    button.textContent = "Load"
                    button.onclick = async () => {
                        await requestDirectoryPermission()
                        displaySavedWebsites()
                    }
                    sectionSaved.appendChild(button)
                    return
                }

                displaySavedWebsites()
            };

            request.onerror = function () {
                appLoadError(request.error)
            };
        }
    };

    dbOpenRequest.onupgradeneeded = function () {
        let db = dbOpenRequest.result;
        if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (unsupported && !db.objectStoreNames.contains('files')) {
            db.createObjectStore('files', { keyPath: 'filename' });
        }
    };
    

    // Complex buttons

    downloader.addEventListener("submit", (e) => {
        e.preventDefault()
        let website = websiteField.value
        if (!startsWithHTTPRegex.exec(website)) {
            website = `https://${website}`
        }

        // Disable form
        downloader.hidden = true
        loading.hidden = false
        error.hidden = true

        const myHeaders = new Headers({ "Content-Type": "text/html", Accept: "text/html", charset: "utf-8" });
        fetch(`get/${website}`, myHeaders)
            .then((response) => {
                if (!response.ok) { 
                    loading.hidden = true
                    downloader.hidden = false
                    appLoadError(response.statusText)
                    throw new Error(`Response status: ${response.status}`);
                }
                return response.text()
            })
            .then((text) => {
                if (!text) return  // Just to be sure.
                loading.hidden = true
                downloadSuccess(text, website)
            })
    })

    selectDirButton.addEventListener("click", async (e) => {
        const dirHandle = await window.showDirectoryPicker()

        var transaction = db.transaction("settings", "readwrite")
        var objectStore = transaction.objectStore("settings")
        var request = objectStore.put({ id: "directory", value: dirHandle })

        request.onsuccess = function () {
            console.log("Directory added to the store", request.result);
            window.location.reload()
        };

        request.onerror = function () {
            console.log("Error", request.error);
        };
    })

    resultSaveButton.addEventListener("click", async () => {
        const filename = encodeURI(resultTitle.textContent)
        if (unsupported) {
            await addFileToDatabase(`${filename}.html`)
        } else {
            await addFileToDirectory(`${filename}.html`)
        }

        displaySavedWebsites()
        hideResult()
    })

    // Simple buttons
    resultAbortButton.onclick = hideResult
    showSavedButton.onclick = displaySavedSection

    // Push a dummy state on page load
    history.pushState({ dummy: true }, '', '');

    // Listen for back button
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.dummy) {
            displaySavedSection()
            location.replace('/');
        }
    });

    // When the iframe loads a website
    display.onload = function () {
        display.hidden = false
    }

    // PWA stuff
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }

    const installButton = document.getElementById("install")
    let installPrompt = null;

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        installPrompt = event;
        installButton.hidden = false;
    });

    installButton.addEventListener("click", async () => {
        if (!installPrompt) {
            return;
        }
        const result = await installPrompt.prompt();
        console.log(`Install prompt was: ${result.outcome}`);
        disableInAppInstallPrompt();
    });

    window.addEventListener("appinstalled", () => {
        installPrompt = null;
        installButton.hidden = false;
    });
}