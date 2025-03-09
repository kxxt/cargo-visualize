import { LayoutOptions } from "@antv/g6"

type NamedLayouts = {
    [key: string]: LayoutOptions
}

export default {
    "d3-force": {
        type: 'd3-force',
        manyBody: {},
        x: {},
        y: {},
        collide: {
            radius: 40
        },
        nodeSize: 100
    },
    force: {
        type: "force",
        preventOverlap: true,
    },
    "antv-dagre": {
        type: "antv-dagre",
        ranksep: 10,
        nodesep: 10,
        radial: true
    },
    "circular": {
        type: "circular",
        nodeSize: 40,
        nodeSpacing: 0.1
    },
    "concentric": {
        type: "concentric",
        nodeSize: 100,
        nodeSpacing: 4,
    },
    "dagre": {
        type: "dagre"
    },
    "grid": {
        type: "grid"
    },
    "mds": {
        type: "mds",
        linkDistance: 200,
    },
    "radial": {
        nodeSize: 150,
        type: "radial",
        unitRadius: 100,
        linkDistance: 300,
        preventOverlap: true,
        maxPreventOverlapIteration: 120,
        strictRadial: true,
    },
    "random": {
        type: "random"
    }
} as NamedLayouts
