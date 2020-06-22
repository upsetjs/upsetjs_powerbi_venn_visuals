/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */
import { asSets, ISetCombinations } from '@upsetjs/bundle';
import powerbi from 'powerbi-visuals-api';
import {
  IPowerBIElem,
  IPowerBIElems,
  IPowerBISet,
  IPowerBISetCombination,
  IPowerBISetCombinations,
  IPowerBISets,
} from './interfaces';

export function isSelection(s: powerbi.extensibility.ISelectionId): s is powerbi.visuals.ISelectionId {
  return s != null && typeof (<powerbi.visuals.ISelectionId>s).includes === 'function';
}

function findSet(
  selection: IPowerBIElems | undefined,
  sets: IPowerBISets,
  combinations: ISetCombinations<IPowerBIElem>
) {
  if (!selection || selection.length === 0) {
    return undefined;
  }
  const toFind = new Set(selection);
  const set = sets.find((s) => {
    if (s.cardinality !== selection.length) {
      return false;
    }
    return s.elems.every((e) => toFind.has(e));
  });
  if (set) {
    return set;
  }
  const c = combinations.find((s) => {
    if (s.cardinality !== selection.length) {
      return false;
    }
    return s.elems.every((e) => toFind.has(e));
  });
  if (c) {
    return c;
  }
  return selection;
}

function deriveHighlight(elems: IPowerBIElems, data: powerbi.DataViewCategorical) {
  if (!data.values || data.values.length === 0 || data.values[0].highlights == null) {
    return undefined;
  }
  return data.values[0].highlights
    .map((v, i) => (v === null ? null : elems[i]))
    .filter((v): v is IPowerBIElem => v !== null);
}

export function resolveSelection(
  elems: IPowerBIElems,
  sets: IPowerBISets,
  combinations: IPowerBISetCombinations,
  data: powerbi.DataViewCategorical,
  selectionManager: powerbi.extensibility.ISelectionManager,
  interactive: boolean
) {
  const selection: IPowerBIElems | undefined = deriveHighlight(elems, data);
  if (selection) {
    return findSet(selection, sets, combinations);
  }
  if (!interactive) {
    return null;
  }
  const sel = selectionManager.getSelectionIds();
  if (sel.length === 0) {
    return null;
  }
  if (sel.length === 1) {
    // could be a set or a combination elem
    const s = sets.find((s) => s.s === sel[0]);
    if (s) {
      return s;
    }
    const c = combinations.find((s) => s.s === sel[0]);
    if (c) {
      return c;
    }
  }

  // resolve to the elements that are included
  return elems.filter((elem) => sel.some((s) => elem === s || (elem.s && isSelection(s) && s.includes(elem.s))));
}

export function extractElems(
  data: powerbi.DataViewCategorical,
  host: powerbi.extensibility.visual.IVisualHost
): IPowerBIElems {
  const attrs = data.values ? data.values.filter((d) => d.source?.roles?.attributes) : [];

  if (!data.categories || data.categories.length === 0) {
    if (!data.values) {
      return [];
    }
    return data.values.map((_, i) => ({
      v: i,
      i,
      attrs: attrs.map((attr) => <number>attr.values[i]),
    }));
  }
  const cat = data.categories[0]!;
  if (!host.allowInteractions) {
    return cat.values.map((v, i) => ({
      v,
      i,
      attrs: attrs.map((attr) => <number>attr.values[i]),
    }));
  }
  return cat.values.map((v, i) => ({
    s: host.createSelectionIdBuilder().withCategory(cat, i).createSelectionId(),
    v,
    cat,
    i,
    attrs: attrs.map((attr) => <number>attr.values[i]),
  }));
}

export function extractSets(
  elems: IPowerBIElems,
  data: powerbi.DataViewCategorical,
  host: powerbi.extensibility.visual.IVisualHost,
  setColorObjectName?: string
): ReadonlyArray<IPowerBISet> {
  // just the sets
  const sets = data.values ? data.values.filter((d) => d.source?.roles?.sets) : [];
  return asSets(
    sets
      .map((value) => {
        const builder = host.allowInteractions ? host.createSelectionIdBuilder() : null;
        const setElems: IPowerBIElem[] = [];
        value.values.forEach((v, i) => {
          if (!v) {
            return;
          }
          // trueish
          const elem = elems[i];
          setElems.push(elem);
          if (builder && elem.cat) {
            builder.withCategory(elem.cat, elem.i);
          }
        });
        return {
          value,
          name: value.source.displayName,
          s: builder ? builder.createSelectionId() : undefined,
          elems: setElems,
          color:
            setColorObjectName && value.source.objects && value.source.objects[setColorObjectName]
              ? (<powerbi.Fill>value.source.objects[setColorObjectName].fill).solid!.color
              : undefined,
        };
      })
      .reverse()
  );
}

export function injectSelectionId(
  combinations: readonly IPowerBISetCombination[],
  host: powerbi.extensibility.visual.IVisualHost
): ReadonlyArray<IPowerBISetCombination> {
  if (!host.allowInteractions) {
    return combinations;
  }
  combinations.forEach((c) => {
    const builder = host.createSelectionIdBuilder();
    c.elems.forEach((elem) => {
      if (elem.cat) {
        builder.withCategory(elem.cat, elem.i);
      }
    });
    c.s = builder.createSelectionId();
  });
  return combinations;
}

function parseColor(color?: string) {
  if (!color) {
    return [255, 255, 255];
  }
  const hex = color.match(/#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i);
  if (hex) {
    return [Number.parseInt(hex[1], 16), Number.parseInt(hex[2], 16), Number.parseInt(hex[3], 16)];
  }
  return [255, 255, 255];
}

export function mergeColors(colors: readonly (string | undefined)[]) {
  if (colors.length === 1) {
    return colors[0];
  }
  const rgb = colors.map(parseColor);
  const r = Math.floor(rgb.reduce((acc, v) => acc + v[0], 0) / rgb.length);
  const g = Math.floor(rgb.reduce((acc, v) => acc + v[1], 0) / rgb.length);
  const b = Math.floor(rgb.reduce((acc, v) => acc + v[2], 0) / rgb.length);
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}
