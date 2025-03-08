export function labelText(d: any): string {
    return d.data.name_uses > 1 ? d.id : d.data.name
}