import { BaseNodeStyleProps, NodeBadgeStyleProps, Rect, RectStyleProps } from '@antv/g6';
import { Text as GText, Rect as GRect } from '@antv/g';

import type { Group, TextStyleProps } from '@antv/g';
import { labelText } from './pure';
import { buildDepColor, devDepColor, labelFontFamily, normalDepColor } from './constants';

let textShape: GText;
const measureText = (style: TextStyleProps) => {
    if (!textShape) textShape = new GText({ style });
    textShape.attr(style);
    return textShape.getBBox().width;
};

export class DepNode extends Rect {
    protected getBadgesStyle(attributes: Required<RectStyleProps>): Record<string, NodeBadgeStyleProps | false> {
        const data: any = this.context.graph.getNodeData(this.id).data;
        const badgeStyle = super.getBadgesStyle(attributes)
        const keyStyle = this.getKeyStyle(attributes);
        const result: Record<string, NodeBadgeStyleProps | false> = badgeStyle;
        if (data.dep_info.is_build) {
            result.build = {
                fontSize: 7,
                text: "Build",
                x: 0,
                y: 20,
                backgroundFill: buildDepColor
            };
        }
        if (data.dep_info.is_dev) {
            result.dev = {
                fontSize: 7,
                text: "Dev",
                x: keyStyle.width - 8,
                y: 0,
                backgroundFill: devDepColor
            };
        }
        if (data.dep_info.is_normal) {
            result.normal = {
                x: 0,
                y: 0,
                fontSize: 7,
                text: "Normal",
                fill: "white",
                backgroundFill: normalDepColor
            };
        }
        return result
    }

    getKeyStyle(attributes: Required<BaseNodeStyleProps>) {
        const data = this.context.graph.getNodeData(this.id);
        const keyStyle = super.getKeyStyle(attributes);
        const width = measureText({ text: labelText(data), fontSize: 10, fontFamily: labelFontFamily })
        return {
            ...keyStyle,
            x: 0,
            y: 0,
            width: Math.max(width + 10, 45),
            height: 20,
        };
    }
}

