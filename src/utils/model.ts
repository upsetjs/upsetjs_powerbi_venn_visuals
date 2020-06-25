/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */
import { asSets, ISetCombinations } from '@upsetjs/bundle';
import powerbi from 'powerbi-visuals-api';
import { IPowerBIElem, IPowerBIElems, IPowerBISet, IPowerBISetCombinations, IPowerBISets } from './interfaces';

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

export function resolveElementsFromSelection(sel: readonly powerbi.extensibility.ISelectionId[], elems: IPowerBIElems) {
  if (sel.length === 0) {
    return null;
  }
  // resolve to the elements that are included
  return elems.filter((elem) => sel.some((s) => elem === s || (elem.s && isSelection(s) && s.includes(elem.s))));
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
  return resolveElementsFromSelection(selectionManager.getSelectionIds(), elems);
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
  setColorObjectName?: string
): ReadonlyArray<IPowerBISet> {
  // just the sets
  const sets = data.values ? data.values.filter((d) => d.source?.roles?.sets) : [];
  return asSets(
    sets
      .map((value) => {
        const setElems: IPowerBIElem[] = [];
        value.values.forEach((v, i) => {
          if (!v) {
            return;
          }
          // trueish
          const elem = elems[i];
          setElems.push(elem);
        });
        return {
          value,
          name: value.source.displayName,
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
