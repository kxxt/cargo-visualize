export function createRawTag(kind: string | null, value: string): HTMLElement {
    let extraClass = kind ? `is-${kind}` : ''
    let ele = document.createElement("span")
    ele.className = `tag ${extraClass}`
    ele.innerText = value
    return ele;
}

export function createTag(kind: string | null, value: string): HTMLElement {
    let div = document.createElement("div")
    div.className = `tags`
    div.appendChild(createRawTag(kind, value))
    let control = document.createElement("control")
    control.className = 'control'
    control.appendChild(div)
    return control;
}

export function insertTag(kind: string | null, value: string, container: HTMLElement) {
    container.appendChild(createTag(kind, value))
}

export function insertRawTag(kind: string | null, value: string, container: HTMLElement) {
    container.appendChild(createRawTag(kind, value))
}

export function insertBadge(kind: string | null, key: string, value: string, container: HTMLElement) {
    let ele = document.createElement("div")
    ele.className = `tags has-addons`
    ele.appendChild(
        createRawTag(null, key)
    )
    ele.appendChild(
        createRawTag(kind, value)
    )
    let control = document.createElement("control")
    control.className = 'control'
    control.appendChild(ele)
    container.appendChild(control)
}

export function clearTags(container: HTMLElement) {
    container.innerHTML = ''
}
