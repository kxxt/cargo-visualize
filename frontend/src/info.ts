import { ENDPOINT } from "./constants";
import { hideElement, showElement } from "./dom";
import { clearTags, insertBadge, insertRawTag, insertTag } from "./tag";

const infoHeading = document.getElementById("info-heading")!;
const infoSubheading = document.getElementById("info-subheading")!;
const infoTags = document.getElementById("info-tags")!;
const infoDescription = document.getElementById("info-description")!;

function urlMapField(field: string): HTMLElement {
    let ele = document.createElement('a');
    ele.innerText = field
    ele.href = field
    ele.target = '_blank'
    return ele
}

function openFieldMapper(id: string) {
    return (_value: any, field: string) => {
        let ele = document.createElement('a');
        ele.innerText = "Open..."
        ele.href = `javascript:`;
        ele.onclick = () => {
            console.log(`opening ${field} for ${id}`);
            const fail = () => alert(`Failed to open ${field} for ${id}, please check the console of cargo-visualize for more details`);
            const req = new Request(`${ENDPOINT}/open/${id}/${field}`, {
                method: "POST"
            });
            fetch(req).catch(fail).then(
                (resp) => {
                    if (!resp?.ok) {
                        fail()
                    }
                }
            )
        }
        return ele
    }
}

function tagsFieldMaper(kind: string) {
    return (field: [string]) => {
        let ele = document.createElement('div');
        ele.className = 'tags'
        for (const f of field) {
            insertRawTag(`light is-${kind}`, f, ele)
        }
        return ele
    }
}

function handleAuthors(meta: any) {
    handlePlainField(meta, 'authors', (authors: [string]) => {
        let ele = document.createElement('p');
        let text = authors.reduce((acc, x) => `${acc}\n${x}`)
        ele.innerText += text
        return ele
    })
}

function handleFeatures(meta: any) {
    let tr = document.getElementById(`info-features`)!
    if (meta.features && Object.keys(meta.features).length > 0) {
        handlePlainField(meta, 'features', (features: any) => {
            let ele = document.createElement('div');
            ele.className = 'tags'
            for (const f of Object.keys(features)) {
                insertRawTag(`light is-info`, f, ele)
            }
            return ele
        })
    } else {
        hideElement(tr)
    }
}

function handleLicense(meta: any, id: string) {
    let tr = document.getElementById(`info-license`)!
    if (meta.license) {
        handlePlainField(meta, 'license')
    } else if (meta.license_file) {
        handlePlainField(meta, 'license', openFieldMapper(id), 'license_file')
    } else {
        hideElement(tr)
    }
}

function handlePlainField(meta: any, field: string, map?: Function | undefined, manifest_field?: string) {
    let tr = document.getElementById(`info-${field}`)!
    let td = tr.lastElementChild! as HTMLTableCellElement;
    manifest_field = manifest_field ?? field;
    if ((meta[manifest_field] && !Array.isArray(meta[manifest_field])) || (Array.isArray(meta[manifest_field]) && meta[manifest_field].length > 0)) {
        if (map) {
            td.innerHTML = ''
            td.appendChild(map(meta[manifest_field], field))
        } else {
            td.innerText = meta[manifest_field]
        }
        showElement(tr)
    } else {
        hideElement(tr)
    }
}



export function prepare_info_tab(id: string, meta: any, data: any) {
    // Basic
    infoHeading.innerText = `${data.name}`
    infoSubheading.innerText = `${data.version}`
    // Tags
    clearTags(infoTags)
    if (data.is_ws_member) {
        insertTag("primary", "Workspace", infoTags)
    }
    if (data.dep_info.is_dev) {
        insertTag("warning", "Dev", infoTags)
    }
    if (data.dep_info.is_build) {
        insertTag("info", "Build", infoTags)
    }
    if (data.dep_info.is_normal) {
        insertTag("link", "Normal", infoTags)
    }
    if (data.dep_info.is_target_dep) {
        insertTag("success", "Target Specific", infoTags)
    }
    if (data.dep_info.is_optional) {
        insertTag("white", "Optional", infoTags)
    }
    if (data.is_proc_macro) {
        insertTag("danger", "proc-macro", infoTags)
    }
    if (meta.rust_version) {
        insertBadge("warning", "Rust", meta.rust_version, infoTags)
    }
    if (meta.edition) {
        insertBadge("success", "Edition", meta.edition, infoTags)
    }
    // Metadata
    if (meta.description) {
        infoDescription.innerText = meta.description
        showElement(infoDescription)
    } else {
        hideElement(infoDescription)
    }
    handleLicense(meta, id)
    handleFeatures(meta)
    handleAuthors(meta)
    handlePlainField(meta, 'source')
    handlePlainField(meta, 'homepage', urlMapField)
    handlePlainField(meta, 'repository', urlMapField)
    handlePlainField(meta, 'documentation', urlMapField)
    handlePlainField(meta, 'keywords', tagsFieldMaper('primary'))
    handlePlainField(meta, 'categories', tagsFieldMaper('warning'))
    handlePlainField(meta, 'links')
    handlePlainField(meta, 'manifest_path', openFieldMapper(id))
    handlePlainField(meta, 'readme', openFieldMapper(id))
}