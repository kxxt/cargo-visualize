import { BaseEdge, Line } from '@antv/g6';
import { getQuadraticPath, getCurveControlPoint } from '@antv/g6/lib/utils/edge'
import { mergeOptions } from '@antv/g6/lib/utils/style';

import type { DisplayObjectConfig } from '@antv/g';
import type { BaseEdgeStyleProps, LineStyleProps, PathArray, Quadratic, QuadraticStyleProps } from '@antv/g6';

export interface DepEdgeStyleProps extends LineStyleProps, QuadraticStyleProps {

}

export class DepEdge extends BaseEdge {
    data: any;

    static defaultStyleProps: Partial<DepEdgeStyleProps> = {
        curvePosition: 0.5,
        curveOffset: 10,
    }

    constructor(options: DisplayObjectConfig<DepEdgeStyleProps>) {
        super(mergeOptions({ style: DepEdge.defaultStyleProps }, options));
    }

    protected getKeyPath(attributes: Required<DepEdgeStyleProps>): PathArray {
        const data: any = this.context.graph.getEdgeData(this.id).data
        const { curvePosition, curveOffset } = attributes;
        const [sourcePoint, targetPoint] = this.getEndpoints(attributes);
        if (data.edge_no == 0) {
            return [
                ['M', sourcePoint[0], sourcePoint[1]],
                ['L', targetPoint[0], targetPoint[1]],
            ];
        } else {
            const odd = data.edge_no % 2
            const offset = (1 - odd * 2) * ((data.edge_no + odd) / 2) * curveOffset;
            const controlPoint = attributes.controlPoint
                || getCurveControlPoint(sourcePoint, targetPoint, curvePosition, offset);
            return getQuadraticPath(sourcePoint, targetPoint, controlPoint);
        }
    }

    protected getKeyStyle(attributes: Required<DepEdgeStyleProps>) {
        const data: any = this.context.graph.getEdgeData(this.id).data
        return {
            ...super.getKeyStyle(attributes),
            lineWidth: 2,
            lineDash: (
                data.is_optional_direct ? 1 :
                    (data.is_optional ? 3 : 0)
            ),
            stroke: data!.edge_no > 0 ? "red" : "blue"
        }
    }
}
