/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import powerbi from 'powerbi-visuals-api';
import { fillDefaults, ISets, GenerateSetCombinationsOptions } from '@upsetjs/bundle';
import { IPowerBISet, IPowerBISets, IPowerBIElem, IPowerBIElems } from './interfaces';
import { UniqueColorPalette } from './UniqueColorPalette';

export const defaults = fillDefaults({ sets: [], width: 100, height: 100 });

export class UpSetBaseThemeSettings {
  static readonly SET_COLORS_OBJECT_NAME = 'setColors';
  static readonly POWERBI_THEME = 'powerbi';
  static readonly POWERBI_AUTO_THEME = 'auto';

  theme = 'light';
  color = defaults.color;
  opacity = defaults.opacity;
  hasSelectionColor = defaults.hasSelectionColor;
  hasSelectionOpacity = defaults.hasSelectionOpacity;
  textColor = defaults.textColor;
  selectionColor = defaults.selectionColor;

  generate(colorPalette: UniqueColorPalette, data: powerbi.DataViewCategorical) {
    const keys = (<(keyof UpSetBaseThemeSettings)[]>Object.keys(this)).filter(
      (d) => typeof this[d] === 'string' || typeof this[d] === 'number'
    );
    const r: any = {};
    if (this.theme === UpSetBaseThemeSettings.POWERBI_THEME) {
      Object.assign(r, generatePowerBITheme(colorPalette));
    } else if (this.theme === UpSetBaseThemeSettings.POWERBI_AUTO_THEME) {
      Object.assign(r, generateAutoPowerBITheme(colorPalette, data));
    } else {
      r.theme = this.theme;
    }
    keys.forEach((key) => {
      const defaultValue = (<any>defaults)[key];
      const current = this[key];
      if (current !== defaultValue) {
        r[key] = current;
      }
    });
    return r;
  }

  supportIndividualColors() {
    return this.theme === UpSetBaseThemeSettings.POWERBI_THEME;
  }

  enumerateSetColors(sets: ISets<IPowerBIElem>): powerbi.VisualObjectInstanceEnumerationObject {
    if (!this.supportIndividualColors()) {
      return {
        instances: [],
      };
    }
    // reverse since after extractSets they are reversed again
    return {
      instances: (<IPowerBISets>(<unknown>sets))
        .slice()
        .reverse()
        .map((set) => setToObjectInstance(set, UpSetBaseThemeSettings.SET_COLORS_OBJECT_NAME)),
    };
  }
}

function setToObjectInstance(set: IPowerBISet, objectName: string) {
  return {
    objectName,
    displayName: set.name,
    selector: {
      metadata: set.value.source.queryName,
    },
    properties: {
      fill: {
        solid: {
          color: set.color,
        },
      },
    },
  };
}

export class UpSetFontSizeSettings {
  fontFamily = 'Segoe UI';
  barLabel = 7; // pt
  chartLabel = 12; // pt
  setLabel = 12; // pt
  valueLabel = 10; // pt

  generate() {
    return {
      fontFamily: this.fontFamily,
      fontSizes: {
        barLabel: `${this.barLabel}pt`,
        chartLabel: `${this.chartLabel}pt`,
        setLabel: `${this.setLabel}pt`,
        valueLabel: `${this.valueLabel}pt`,
      },
    };
  }
}

function generatePowerBITheme(colorPalette: UniqueColorPalette) {
  const c = colorPalette.base.foreground.value;
  return {
    color: c,
    textColor: colorPalette.base.foregroundButton.value,
    selectionColor: '',
    opacity: 1,
    hasSelectionOpacity: 0.4,
    filled: true,
  };
}

function generateAutoPowerBITheme(colorPalette: UniqueColorPalette, data: powerbi.DataViewCategorical) {
  if (!data.categories || data.categories.length === 0) {
    return {};
  }
  const source = data.categories[0].source;
  const c = colorPalette.getColor(source.queryName || source.displayName).value;
  return {
    color: c,
    textColor: colorPalette.base.foregroundButton.value,
    selectionColor: c,
    opacity: 1,
    hasSelectionOpacity: 0.4,
    filled: true,
  };
}

export class UpSetCombinationSettings implements GenerateSetCombinationsOptions {
  show = true;
  displayName = 'Intersections';
  type: 'intersection' | 'union' = 'intersection';
  min = 0;
  max = 6;
  empty = false;
  order = <'cardinality'>'cardinality,name';
  limit = 100;

  generate(elems: IPowerBIElems): GenerateSetCombinationsOptions {
    return {
      type: this.type,
      min: this.min,
      max: this.max,
      empty: this.empty,
      limit: this.limit,
      order: <'cardinality'>fixOrder(this.order),
      elems,
    };
  }
}

function fixOrder(order: string) {
  if (order.includes(',')) {
    return order.split(',');
  }
  return order;
}
