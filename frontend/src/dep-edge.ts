import { Line } from '@antv/g6';

import type { BaseEdgeStyleProps } from '@antv/g6';

export class DepEdge extends Line {
    
    protected getKeyStyle(attributes: Required<BaseEdgeStyleProps>) {
        const data = this.context.graph.getEdgeData(this.id).data
        return {
            ...super.getKeyStyle(attributes), lineWidth: 2,
            lineDash:  data!.is_optional ? 2 : 0
        };
    }
}