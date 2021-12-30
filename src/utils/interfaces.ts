/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2021 Samuel Gratzl <sam@sgratzl.com>
 */
import type { ISet, ISetCombination, ISetLike } from '@upsetjs/bundle';
import type powerbi from 'powerbi-visuals-api';

export declare type IPowerBIElem = {
  s?: powerbi.visuals.ISelectionId;
  v: powerbi.PrimitiveValue;
  cat?: powerbi.DataViewCategoryColumn;
  i: number;
  attrs: (number | string)[];
  count: number;
};

export declare type IPowerBIElems = readonly IPowerBIElem[];

export interface IPowerBISet extends ISet<IPowerBIElem> {
  value: powerbi.DataViewValueColumn;
  index: number;
}

export declare type IPowerBISetCombination = ISetCombination<IPowerBIElem>;

export declare type IPowerBiSetLike = ISetLike<IPowerBIElem> & { s: powerbi.visuals.ISelectionId };
export declare type IPowerBISets = readonly IPowerBISet[];
export declare type IPowerBISetCombinations = readonly IPowerBISetCombination[];
