import { StorageAdapter } from "./storage/adapter"

export class ToggleableElement {
    element: HTMLElement

    private transitionDuration
    private transitionRemaining: number = 0

    constructor(query: string, transitionDuration: number) {
        this.element = document.querySelector(query)!
        this.element.style.transition = `opacity ${transitionDuration}ms linear`
        this.transitionDuration = transitionDuration
        if (this.element.hidden) this.element.style.opacity = "0"
    }

    show() {
        this.element.hidden = false
        setTimeout(() => {
            this.element.style.opacity = '1'
        }, 1)

        this.transitionRemaining = this.transitionDuration
        return new Promise<null>((resolve) => {
            const interval = setInterval(() => {
                this.transitionRemaining -= 1
                if (this.transitionRemaining <= 0) {
                    this.transitionRemaining = 0
                    resolve(null)
                    clearInterval(interval)
                }
            }, 1)
        })
    }

    hide() {
        this.transitionRemaining = 0
        this.element.style.opacity = '0'
        this.element.hidden = true
    }
}

// In the following functions we assume that the target elements exist.

export function toggleableElement(query: string, transitionDuration = 100) {
    return new ToggleableElement(query, transitionDuration)
}

export function element(query: string) {
    return document.querySelector(query)! as HTMLElement
}


export function showWebsite(file: File) {
    loadingElement.show()
    const display = toggleableElement('#website-display')
    const iframe = element("iframe") as HTMLIFrameElement
    iframe.src = URL.createObjectURL(file)
    iframe.onload = () => {
        loadingElement.hide()
        display.show()
    }
    element("#back").onclick = () => {
        display.hide()
    }
}


export const loadingElement = toggleableElement('#loading')
