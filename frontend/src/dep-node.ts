import { BaseNodeStyleProps, Rect } from '@antv/g6';
import { Text as GText, Rect as GRect } from '@antv/g';

import type { Group, TextStyleProps } from '@antv/g';
import { labelText } from './pure';
import { labelFontFamily } from './constants';

let textShape: GText;
const measureText = (style: TextStyleProps) => {
    if (!textShape) textShape = new GText({ style });
    textShape.attr(style);
    return textShape.getBBox().width;
};

export class DepNode extends Rect {
    labelWidth: number = 0;
    labelHeight: number = 0;

    protected drawTextShape(attrs: Required<BaseNodeStyleProps>, container: Group) {
        const [w, h] = this.getSize(attrs)
        // const label = this.upsert('text', GText, { text: this.id, x: 0, y: 10, fontSize: 10 }, container)!;
        // const bbox = label.getBBox();
        // this.labelHeight = bbox.height;
        // this.labelWidth = bbox.width;
    }
    public render(attrs: Required<BaseNodeStyleProps>, container: Group) {
        super.render(attrs, container);
        // 调用自定义绘制逻辑
        this.drawTextShape(attrs, container);
    }

    getKeyStyle(attributes: Required<BaseNodeStyleProps>) {
        const keyStyle = super.getKeyStyle(attributes);
        const width = measureText({ text: labelText(this.context.graph.getNodeData(this.id)), fontSize: 10, fontFamily: labelFontFamily })
        return {
            ...keyStyle,
            x: 0,
            y: 0,
            width: width + 10,
            height: 20,
        };
    }
}

