/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */
import {
  ISetLike,
  UpSetAddonHandlerInfo,
  ICategoryBins,
  IBoxPlot,
  UpSetAddonHandlerInfos,
  isSetCombination,
} from '@upsetjs/bundle';
import powerbi from 'powerbi-visuals-api';
import { IPowerBIElem } from './interfaces';

export function createContextMenuHandler(selectionManager: powerbi.extensibility.ISelectionManager) {
  return (selection: ISetLike<IPowerBIElem> | null, evt: MouseEvent) => {
    evt.preventDefault();
    if (!selection) {
      return;
    }
    const sel = selection.elems[0];
    const id = sel && sel.s != null ? sel.s : {};
    selectionManager.showContextMenu(id, {
      x: evt.clientX,
      y: evt.clientY,
    });
  };
}

function areEqual<T>(a: readonly T[], b: readonly T[]) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((ai, i) => ai === b[i]);
}

export function createSelectionHandler(
  selectionManager: powerbi.extensibility.ISelectionManager,
  selectImpl: (v: ISetLike<IPowerBIElem> | null) => void
): OnHandler {
  return (selection: ISetLike<IPowerBIElem> | null, evt: MouseEvent) => {
    evt.stopPropagation();
    if (!selection) {
      selectionManager.clear().then(() => {
        selectImpl(null);
      });
    } else {
      const sel = selection.elems.map((e) => e.s!);
      const old = selectionManager.getSelectionIds();
      if (areEqual(sel, old)) {
        selectionManager.clear().then(() => {
          selectImpl(null);
        });
      } else {
        selectionManager.select(sel).then(() => {
          selectImpl(selection);
        });
      }
    }
  };
}

function renderAddon(addon: UpSetAddonHandlerInfo | null): powerbi.extensibility.VisualTooltipDataItem[] {
  if (!addon) {
    return [];
  }
  if (addon.id === 'categorical') {
    // should be fixed in 1.4.1
    const bins = <ICategoryBins>Object.keys(addon.value)
      .filter((v) => v !== 'toString')
      .map((k) => (<any>addon.value)[k]);
    return [{ displayName: 'Attribute', value: addon.name }].concat(
      bins.map((bin) => ({
        displayName: bin.label,
        color: bin.color,
        value: `${bin.count.toLocaleString()} (${Math.round(100 * bin.percentage)}%)`,
      }))
    );
  }
  if (addon.id === 'boxplot') {
    const b = <IBoxPlot>addon.value;
    const labels = ['Minimum', '25% Quantile', 'Median', '75% Quantile', 'Maximum'];
    const values = [b.min, b.q1, b.median, b.q3, b.max];
    return [{ displayName: 'Attribute', value: addon.name }].concat(
      labels.map((l, i) => ({ displayName: l, value: values[i].toFixed(2) }))
    );
  }
  return [];
}

const TOOLTIP_DELAY = 250;

export declare type OnHandler = (
  selection: ISetLike<IPowerBIElem> | null,
  evt: MouseEvent,
  addons: UpSetAddonHandlerInfos
) => void;

export function createTooltipHandler(
  target: HTMLElement,
  host: powerbi.extensibility.visual.IVisualHost
): [OnHandler | undefined, OnHandler | undefined] {
  if (!host.tooltipService.enabled()) {
    return [undefined, undefined];
  }

  const createArgs = (selection: ISetLike<IPowerBIElem>, evt: MouseEvent, addons: UpSetAddonHandlerInfos) => {
    const bb = target.getBoundingClientRect();
    const coordinates = [evt.clientX - bb.left - target.clientLeft, evt.clientY - bb.top - target.clientTop];

    const sel = selection.elems.map((e) => e.s!);
    return <powerbi.extensibility.TooltipShowOptions>{
      isTouchEvent: false,
      coordinates,
      dataItems: [
        {
          header: selection.name,
          displayName: 'Size',
          value: selection.cardinality.toLocaleString(),
        },
        ...(isSetCombination(selection) && selection.degree > 1
          ? Array.from(selection.sets).map((s) => ({ displayName: s.name, value: s.cardinality.toLocaleString() }))
          : []),
        ...(<powerbi.extensibility.VisualTooltipDataItem[]>[]).concat(...addons.map(renderAddon)),
      ],
      identities: [sel],
    };
  };

  let visible = false;
  let timeout = -1;

  const onHover: OnHandler = (s, evt, addons) => {
    if (timeout >= 0) {
      clearTimeout(timeout);
      timeout = -1;
    }
    if (!host.tooltipService.enabled()) {
      return;
    }
    if (!s) {
      visible = false;
      host.tooltipService.hide({
        immediately: false,
        isTouchEvent: false,
      });
      return;
    }
    timeout = self.setTimeout(() => {
      const args = createArgs(s, evt, addons);
      visible = true;
      host.tooltipService.show(args);
    }, TOOLTIP_DELAY);
  };

  return [
    onHover,
    (s, evt, addons) => {
      if (!visible) {
        return onHover(s, evt, addons);
      }
      if (!host.tooltipService.enabled()) {
        return;
      }
      if (!s) {
        return;
      }
      const args = createArgs(s, evt, addons);
      host.tooltipService.move(args);
    },
  ];
}
