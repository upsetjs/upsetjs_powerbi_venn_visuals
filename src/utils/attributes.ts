/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */
import powerbi from 'powerbi-visuals-api';
import { ICategory } from '@upsetjs/bundle';

export function isNumeric(data: powerbi.DataViewValueColumn): boolean {
  const source = data.source;
  return Boolean(source.type != null && (source.type.integer || source.type.numeric || source.type.duration));
}

export class UpSetNumericAttribute {
  readonly data: powerbi.DataViewValueColumn;

  constructor(data: powerbi.DataViewValueColumn) {
    this.data = data;
  }

  get displayName() {
    return this.data.source.displayName;
  }
}

export class UpSetCategoricalAttribute {
  static readonly OBJECT_NAME = 'attributeColors';

  readonly data: powerbi.DataViewValueColumn;
  readonly categories: readonly (ICategory & {
    index: number;
    selector: powerbi.data.Selector;
  })[];

  constructor(
    data: powerbi.DataViewValueColumn,
    cat: powerbi.DataViewCategoryColumn,
    host: powerbi.extensibility.visual.IVisualHost,
    offset: number
  ) {
    this.data = data;

    const categories = Array.from(new Set(data.values.map((v) => v.toString()))).sort();
    const resolveColor = (i: number, value: string) => {
      if (cat.objects && cat.objects[i]) {
        const c = (<powerbi.Fill>cat.objects[i][UpSetCategoricalAttribute.OBJECT_NAME].fill).solid!.color!;
        if (c) {
          return c;
        }
      }
      return host.colorPalette.getColor(value).value;
    };
    // selector c
    this.categories = categories.map((value, i) => {
      // need some valid row index even if the values doesn't matter
      const index = offset + i;
      return {
        value,
        color: resolveColor(index, value),
        index,
        selector: host.createSelectionIdBuilder().withCategory(cat, index).createSelectionId().getSelector(),
      };
    });
  }

  get displayName() {
    return this.data.source.displayName;
  }

  asPropertyInstance(): powerbi.VisualObjectInstance[] {
    return this.categories.map((cat) => ({
      objectName: UpSetCategoricalAttribute.OBJECT_NAME,
      displayName: `${this.displayName} - ${cat.label ?? cat.value}`,
      // selector, can be {metData: ...source.queryName}
      // to store in a column
      // selector can be createSelectionIdBuilder().withCategory(cat, i).createSelectionId().getSelector()
      // to store at the ith category value index
      selector: cat.selector,
      properties: {
        fill: {
          solid: {
            color: cat.color,
          },
        },
      },
    }));
  }
}
