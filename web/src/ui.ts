export class ToggleableElement {
    element: HTMLElement
    transitionDuration = 200

    private _visible: boolean

    set visible(value: boolean) {
        if (value) this.show()
        else this.hide()
        this._visible = value
    }

    get visible() {
        return this._visible
    }

    constructor(query: string) {
        this.element = document.querySelector(query)!
        this._visible = !this.element.hidden
    }

    show() {
        this.element.hidden = false
        setTimeout(() => {
            this.element.style.opacity = '1'
        }, 1)
    }

    hide() {
        this.element.style.opacity = '0'
        setTimeout(() => {
            this.element.hidden = true
        }, this.transitionDuration)
    }
}
