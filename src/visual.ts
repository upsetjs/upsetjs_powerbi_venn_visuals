/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import {
  boxplotAddon,
  categoricalAddon,
  generateCombinations,
  render,
  renderSkeleton,
  UpSetProps,
} from '@upsetjs/bundle';
import powerbi from 'powerbi-visuals-api';
import { extractElems, injectSelectionId, resolveSelection, extractSets } from './utils/model';
import { OnHandler, createTooltipHandler, createContextMenuHandler, createSelectionHandler } from './utils/handler';
import { UpSetCategoricalAttribute, UpSetNumericAttribute, isNumeric } from './utils/attributes';
import VisualSettings, { UpSetThemeSettings } from './VisualSettings';
import { IPowerBIElem } from './utils/interfaces';

const EMPTY_ARRAY: any[] = [];

export class Visual implements powerbi.extensibility.visual.IVisual {
  private readonly target: HTMLElement;
  private settings: VisualSettings = <VisualSettings>VisualSettings.getDefault();
  private readonly selectionManager: powerbi.extensibility.ISelectionManager;
  private readonly host: powerbi.extensibility.visual.IVisualHost;

  private readonly onContextMenu: OnHandler;
  private readonly setSelection: OnHandler;
  private readonly onHover: undefined | OnHandler;
  private readonly onMouseMove: undefined | OnHandler;

  private attributes: (UpSetCategoricalAttribute | UpSetNumericAttribute)[] = [];
  private props: UpSetProps<IPowerBIElem> = { sets: [], width: 100, height: 100 };

  constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
    this.target = options.element;
    this.selectionManager = options.host.createSelectionManager();
    this.host = options.host;
    this.renderPlaceholder();
    [this.onHover, this.onMouseMove] = createTooltipHandler(this.target, this.host);
    this.onContextMenu = createContextMenuHandler(this.selectionManager);
    this.setSelection = createSelectionHandler(this.selectionManager, (s) => {
      this.props.selection = s;
      this.render();
    });
  }

  private render() {
    render(this.target, this.props);
  }

  update(options: powerbi.extensibility.visual.VisualUpdateOptions) {
    try {
      this.host.eventService.renderingStarted(options);
      const success = this.renderImpl(options);
      if (!success) {
        this.renderPlaceholder();
      }
      this.host.eventService.renderingFinished(options);
    } catch (error) {
      this.host.eventService.renderingFailed(options, String(error));
    }
  }

  private renderPlaceholder() {
    this.target.textContent = '';
    this.target.style.position = 'relative';
    renderSkeleton(this.target, {
      width: '100%',
      height: '100%',
    });
  }

  private renderImpl(options: powerbi.extensibility.visual.VisualUpdateOptions) {
    // reset watermark
    this.settings.license.resetWatermark(this.target);

    if (options.dataViews.length === 0) {
      return false;
    }
    const dataView = options.dataViews[0];
    this.settings = VisualSettings.parse(dataView);
    if (!dataView.categorical || !dataView.categorical.categories) {
      return false;
    }

    const areDummyValues = dataView.categorical!.categories.length === 0;

    // handle window
    const elems = extractElems(dataView.categorical!, this.host);

    this.attributes = this.generateAttributes(dataView);
    const sets =
      elems.length === 0
        ? []
        : extractSets(
            elems,
            dataView.categorical!,
            this.host,
            this.settings.theme.supportIndividualColors() ? UpSetThemeSettings.SET_COLORS_OBJECT_NAME : undefined
          );

    if (sets.length === 0 || !dataView.categorical!.values) {
      return false;
    }

    this.verifyLicense(
      sets.length,
      dataView.categorical!.values.reduce((acc, d) => acc + (d.source?.roles?.attributes ? 1 : 0), 0)
    );

    if (dataView.metadata.segment) {
      // load more chunks
      requestAnimationFrame(() => this.host.fetchMoreData());
    }

    const combinations = injectSelectionId(
      generateCombinations(sets, this.settings.combinations.generate(elems)),
      this.host
    );
    if (combinations.length === 0) {
      return false;
    }

    const selection = resolveSelection(
      elems,
      sets,
      combinations,
      dataView.categorical!,
      this.selectionManager,
      !areDummyValues && this.host.allowInteractions
    );

    this.props = Object.assign(
      {
        sets,
        width: options.viewport.width,
        height: options.viewport.height,
        combinations,
        selection,
        exportButtons: false,
      },
      this.settings.fonts.generate(),
      this.settings.theme.generate(this.host.colorPalette, dataView.categorical!),
      this.settings.style
    );

    if (this.attributes.length === 0) {
      this.props.setAddons = EMPTY_ARRAY;
      this.props.combinationAddons = EMPTY_ARRAY;
    } else {
      this.props.setAddons = this.attributes.map((attr, i) => asAddon(attr, i, false));
      this.props.combinationAddons = this.attributes.map((attr, i) => asAddon(attr, i, true));
    }

    if (!areDummyValues && this.host.allowInteractions) {
      this.props.onClick = this.setSelection;
      this.props.onContextMenu = this.onContextMenu;
      this.props.onHover = this.onHover;
      this.props.onMouseMove = this.onMouseMove;
      this.props.tooltips = false;
    }

    this.render();
    return true;
  }

  private generateAttributes(dataView: powerbi.DataView) {
    const cat = dataView.categorical!.categories![0];
    // we need some offset since individual categories cannot be directly selected just categories rows
    let enumerationOffset = 0;
    return dataView.categorical!.values
      ? dataView
          .categorical!.values.filter((d) => d.source?.roles?.attributes)
          .map((attr) => {
            if (isNumeric(attr)) {
              return new UpSetNumericAttribute(attr);
            }
            const c = new UpSetCategoricalAttribute(attr, cat, this.host, enumerationOffset);
            enumerationOffset += c.categories.length;
            return c;
          })
      : [];
  }

  private verifyLicense(numSets: number, numAttributes: number) {
    this.settings.license.updateLicenseState(this.target, this.host, () =>
      usesProFeatures(numSets, numAttributes, this.settings)
    );
  }

  /**
   * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
   * objects and properties you want to expose to the users in the property pane.
   *
   */
  enumerateObjectInstances(
    options: powerbi.EnumerateVisualObjectInstancesOptions
  ): powerbi.VisualObjectInstance[] | powerbi.VisualObjectInstanceEnumerationObject {
    if (options.objectName === UpSetThemeSettings.SET_COLORS_OBJECT_NAME) {
      return this.settings.theme.enumerateSetColors(this.props.sets);
    }
    if (options.objectName === UpSetCategoricalAttribute.OBJECT_NAME) {
      const categoricalAttributes = this.attributes.filter(
        (d): d is UpSetCategoricalAttribute => d instanceof UpSetCategoricalAttribute
      );
      const instances = (<powerbi.VisualObjectInstance[]>[]).concat(
        ...categoricalAttributes.map((cat) => cat.asPropertyInstance())
      );
      return {
        instances,
      };
    }
    return VisualSettings.enumerateObjectInstances(this.settings, options);
  }
}

function usesProFeatures(numSets: number, numAttributes: number, settings: VisualSettings) {
  if (numSets > 4 || numAttributes > 0) {
    return true;
  }

  const theme = settings.theme;
  if (theme.theme !== 'light') {
    return true;
  }

  const combinations = settings.combinations;
  if (<string>combinations.order !== 'cardinality,name') {
    return true;
  }

  const style = settings.style;
  if (style.numericScale !== 'linear') {
    return true;
  }

  return false;
}

function asAddon(attr: UpSetNumericAttribute | UpSetCategoricalAttribute, i: number, vertical: boolean) {
  if (attr instanceof UpSetNumericAttribute) {
    return boxplotAddon(
      (v: IPowerBIElem) => <number>v.attrs[i],
      {
        min: <number>attr.data.minLocal,
        max: <number>attr.data.maxLocal,
      },
      {
        name: attr.displayName,
        orient: vertical ? 'vertical' : 'horizontal',
      }
    );
  }
  return categoricalAddon(
    (v: IPowerBIElem) => String(v.attrs[i]),
    {
      categories: attr.categories,
    },
    {
      name: attr.displayName,
      orient: vertical ? 'vertical' : 'horizontal',
    }
  );
}
