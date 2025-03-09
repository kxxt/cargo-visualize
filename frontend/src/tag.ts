export function insertTag(kind: string, value: string, container: HTMLElement) {
    let ele = document.createElement("span")
    ele.className = `tag is-${kind}`
    ele.innerText = value
    container.appendChild(ele)
}

export function clearTags(container: HTMLElement) {
    container.innerHTML = ''
}
