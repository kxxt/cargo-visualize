export const labelFontFamily = "system-ui"

export const devDepColor = "orange"
export const buildDepColor = "skyblue"
export const normalDepColor = "purple"
const params = new URLSearchParams(window.location.search);
export const port = parseInt(params.get("backend") || "8913");
export const ENDPOINT = import.meta.env.DEV ? `http://127.0.0.1:${port}` : "";
