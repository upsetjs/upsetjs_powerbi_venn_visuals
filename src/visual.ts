/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2021 Samuel Gratzl <sam@sgratzl.com>
 */

import {
  renderVennDiagram,
  renderVennDiagramSkeleton,
  VennDiagramProps,
  generateCombinations,
  createVennJSAdapter,
} from '@upsetjs/bundle';
import powerbi from 'powerbi-visuals-api';
import { extractElems, resolveSelection, extractSets, resolveElementsFromSelection } from './utils/model';
import { OnHandler, createTooltipHandler, createContextMenuHandler, createSelectionHandler } from './utils/handler';
import VisualSettings, { UpSetThemeSettings } from './VisualSettings';
import { IPowerBIElem, IPowerBIElems } from './utils/interfaces';
import { mergeColors } from '@upsetjs/bundle';
import { layout } from '@upsetjs/venn.js';
import { UniqueColorPalette } from './utils/UniqueColorPalette';

const adapter = createVennJSAdapter(layout);

export class Visual implements powerbi.extensibility.visual.IVisual {
  private readonly target: HTMLElement;
  private settings: VisualSettings = <VisualSettings>VisualSettings.getDefault();
  private readonly selectionManager: powerbi.extensibility.ISelectionManager;
  private readonly host: powerbi.extensibility.visual.IVisualHost;

  private readonly onContextMenu: OnHandler;
  private readonly setSelection: OnHandler;
  private readonly onHover: undefined | OnHandler;
  private readonly onMouseMove: undefined | OnHandler;
  private readonly colorPalette: UniqueColorPalette;

  private props: VennDiagramProps<IPowerBIElem> = { sets: [], width: 100, height: 100 };
  private elems: IPowerBIElems = [];

  constructor(options: powerbi.extensibility.visual.VisualConstructorOptions) {
    this.target = options.element;
    this.selectionManager = options.host.createSelectionManager();
    this.colorPalette = new UniqueColorPalette(options.host.colorPalette);
    this.host = options.host;
    this.renderPlaceholder();

    [this.onHover, this.onMouseMove] = createTooltipHandler(this.target, this.host);
    this.onContextMenu = createContextMenuHandler(this.selectionManager);
    this.target.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.selectionManager.showContextMenu(
        {},
        {
          x: e.clientX,
          y: e.clientY,
        }
      );
    });
    this.setSelection = createSelectionHandler(this.selectionManager, (s) => {
      this.props.selection = s;
      this.render();
    });
    this.selectionManager.registerOnSelectCallback((ids) => {
      this.props.selection = resolveElementsFromSelection(ids, this.elems);
      this.render();
    });
  }

  private render() {
    if (this.settings.style.mode !== 'venn' || this.props.sets.length > 5) {
      this.props.layout = adapter;
    } else {
      delete this.props.layout;
    }
    renderVennDiagram(this.target, this.props);
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
    renderVennDiagramSkeleton(this.target, {
      width: '100%',
      height: '100%',
    });
  }

  private renderImpl(options: powerbi.extensibility.visual.VisualUpdateOptions) {
    // reset watermark
    this.settings.license.resetWatermark(this.target);

    if (!options.dataViews || options.dataViews.length === 0) {
      this.colorPalette.clear();
      return false;
    }
    const dataView = options.dataViews[0];
    this.settings = VisualSettings.parse(dataView);
    if (!dataView.categorical || !dataView.categorical.categories) {
      this.colorPalette.clear();
      return false;
    }

    const areDummyValues = dataView.categorical!.categories.length === 0;

    // handle window
    this.elems = extractElems(dataView.categorical!, this.host);

    const sets =
      this.elems.length === 0
        ? []
        : extractSets(
            this.elems,
            dataView.categorical!,
            this.colorPalette,
            this.settings.theme.supportIndividualColors() ? UpSetThemeSettings.SET_COLORS_OBJECT_NAME : undefined
          );

    if (sets.length === 0 || !dataView.categorical!.values) {
      this.colorPalette.clear();
      return false;
    }

    this.verifyLicense();

    if (dataView.metadata.segment) {
      // load more chunks
      requestAnimationFrame(() => this.host.fetchMoreData());
    }

    const combinations = generateCombinations(sets, {
      type: 'distinctIntersection',
      min: 1,
      empty: true,
      mergeColors,
    });
    if (combinations.length === 0) {
      return false;
    }

    const selection = resolveSelection(
      this.elems,
      sets,
      combinations,
      dataView.categorical!,
      this.selectionManager,
      !areDummyValues && this.host.hostCapabilities.allowInteractions === true
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
      this.settings.theme.generate(this.colorPalette, dataView.categorical!),
      this.settings.style
    );

    if (!areDummyValues && this.host.hostCapabilities.allowInteractions) {
      this.props.onClick = this.setSelection;
      this.props.onContextMenu = this.onContextMenu;
      this.props.onHover = this.onHover;
      this.props.onMouseMove = this.onMouseMove;
      this.props.tooltips = false;
    }

    this.render();
    return true;
  }

  private verifyLicense() {
    this.settings.license.updateLicenseState(this.target, this.host, () =>
      usesProFeatures(this.props.sets.length, this.settings)
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
    return VisualSettings.enumerateObjectInstances(this.settings, options);
  }
}

function usesProFeatures(numSets: number, settings: VisualSettings) {
  const theme = settings.theme;
  if (theme.theme !== 'light') {
    return true;
  }
  if (numSets > 3 || settings.style.mode !== 'venn') {
    return true;
  }

  return false;
}
