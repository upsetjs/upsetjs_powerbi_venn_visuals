/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import { renderVennDiagram, renderVennDiagramSkeleton, VennDiagramProps, generateCombinations } from '@upsetjs/bundle';
import powerbi from 'powerbi-visuals-api';
import { extractElems, injectSelectionId, resolveSelection, extractSets, mergeColors } from './utils/model';
import { OnHandler, createTooltipHandler, createContextMenuHandler, createSelectionHandler } from './utils/handler';
import VisualSettings, { UpSetThemeSettings } from './VisualSettings';
import { IPowerBIElem } from './utils/interfaces';

export class Visual implements powerbi.extensibility.visual.IVisual {
  private readonly target: HTMLElement;
  private settings: VisualSettings = <VisualSettings>VisualSettings.getDefault();
  private readonly selectionManager: powerbi.extensibility.ISelectionManager;
  private readonly host: powerbi.extensibility.visual.IVisualHost;

  private readonly onContextMenu: OnHandler;
  private readonly setSelection: OnHandler;
  private readonly onHover: undefined | OnHandler;
  private readonly onMouseMove: undefined | OnHandler;

  private props: VennDiagramProps<IPowerBIElem> = { sets: [], width: 100, height: 100 };

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
    this.target.addEventListener('click', (evt) => this.setSelection(null, evt, []));
  }

  private render() {
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

    this.verifyLicense();

    if (dataView.metadata.segment) {
      // load more chunks
      requestAnimationFrame(() => this.host.fetchMoreData());
    }

    const combinations = injectSelectionId(
      generateCombinations(sets, {
        type: 'distinctIntersection',
        min: 1,
        empty: true,
        mergeColors,
      }),
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

  private verifyLicense() {
    this.settings.license.updateLicenseState(this.target, this.host, () => usesProFeatures(this.settings));
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

function usesProFeatures(settings: VisualSettings) {
  const theme = settings.theme;
  if (theme.theme !== 'light') {
    return true;
  }

  return false;
}
