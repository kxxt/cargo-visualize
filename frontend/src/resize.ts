import { Graph } from "@antv/g6";

function rem2px(rem: number): number {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export const graphWidth = () => window.innerWidth - document.getElementById("sidebar")!.clientWidth;
export const graphHeight = () => window.innerHeight - document.getElementById("topbar")!.clientHeight;

export function initializeGraphResizeHandle(graph: Graph, graphContainer: HTMLElement, sideBar: HTMLElement) {
    const resizeData = {
        tracking: false,
        startWidth: 0,
        startCursorScreenX: 0,
        maxWidth: window.innerWidth / 2,
        minWidth: rem2px(20),
    };

    const resizeHandle = document.getElementById("resize-handle")!;

    resizeHandle.addEventListener('mousedown', (e) => {
        if (e.button !== 0)
            return;

        e.preventDefault();
        e.stopPropagation();

        resizeData.startWidth = sideBar.getBoundingClientRect().width;
        resizeData.startCursorScreenX = e.screenX;
        resizeData.tracking = true;
    })

    window.addEventListener('mousemove', (event) => {
        if (resizeData.tracking) {
            const cursorScreenXDelta = resizeData.startCursorScreenX - event.screenX;
            const newWidth = Math.max(resizeData.minWidth, Math.min(resizeData.startWidth + cursorScreenXDelta, resizeData.maxWidth));
            const graphWidth = window.innerWidth - newWidth;

            sideBar.style.width = `${newWidth}px`;
            graphContainer.style.width = `${graphWidth}px`
            graph.setSize(graphWidth, graphHeight())
        }
    });

    window.addEventListener('mouseup', () => {
        if (resizeData.tracking) {
            resizeData.tracking = false;
        }
    });

    window.addEventListener("resize", () => {
        if (graphContainer.style.width) {
            // If we have manually resized the sidebar
            graphContainer.style.width = `${graphWidth()}px`;
        }
        graph.setSize(graphWidth(), 0)
        graph.resize()
        graph.updatePlugin({
            key: 'minimap',
            size: [160 * graphWidth() / graphHeight(), 160],
        })
    })
}
