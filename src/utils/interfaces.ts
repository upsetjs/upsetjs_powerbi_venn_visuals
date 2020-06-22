/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */
import { ISet, ISetCombination, ISetLike } from '@upsetjs/bundle';
import powerbi from 'powerbi-visuals-api';

export declare type IPowerBIElem = {
  s?: powerbi.visuals.ISelectionId;
  v: powerbi.PrimitiveValue;
  cat?: powerbi.DataViewCategoryColumn;
  i: number;
  attrs: (number | string)[];
};

export declare type IPowerBIElems = readonly IPowerBIElem[];

export interface IPowerBISet extends ISet<IPowerBIElem> {
  value: powerbi.DataViewValueColumn;
  s?: powerbi.visuals.ISelectionId;
}

export declare type IPowerBISetCombination = ISetCombination<IPowerBIElem> & {
  s?: powerbi.visuals.ISelectionId;
};

export declare type IPowerBiSetLike = ISetLike<IPowerBIElem> & { s: powerbi.visuals.ISelectionId };
export declare type IPowerBISets = readonly IPowerBISet[];
export declare type IPowerBISetCombinations = readonly IPowerBISetCombination[];

export function isPowerBiSetLike(s: ISetLike<IPowerBIElem>): s is IPowerBiSetLike {
  return (<IPowerBiSetLike>s).s != null;
}
