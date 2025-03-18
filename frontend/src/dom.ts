export function hideElement(ele: HTMLElement) {
    if (!ele.classList.contains('is-hidden')) {
        ele.classList.add('is-hidden')
    }
}

export function showElement(ele: HTMLElement) {
    if (ele.classList.contains('is-hidden')) {
        ele.classList.remove('is-hidden')
    }
}