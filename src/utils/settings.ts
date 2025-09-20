/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2025 Samuel Gratzl <sam@sgratzl.com>
 */

import type powerbi from "powerbi-visuals-api";
import {
  VennDiagramFontSizes,
  UpSetThemeProps,
  UpSetThemes,
} from "@upsetjs/bundle";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import {
  fillDefaults,
  ISets,
  GenerateSetCombinationsOptions,
} from "@upsetjs/bundle";
import type { IPowerBISets, IPowerBIElem } from "./interfaces";
import { UniqueColorPalette } from "./UniqueColorPalette";

const { SimpleCard, ItemDropdown, ColorPicker, FontPicker, NumUpDown } =
  formattingSettings;

export const defaults = fillDefaults({ sets: [], width: 100, height: 100 });

export class SetColorCardSettings extends SimpleCard {
  visible = false;
  name: string = "setColors";
  displayName: string = "Set Colors";
}

export class ThemeCardSettings extends SimpleCard {
  static readonly SET_COLORS_OBJECT_NAME = "setColors";

  static readonly POWERBI_THEME = "powerbi";
  static readonly POWERBI_SET_COLORS_THEME = "powerbi-set";
  static readonly POWERBI_AUTO_THEME = "auto";

  public theme = new ItemDropdown({
    name: "theme",
    displayName: "Theme",
    value: { value: "light", displayName: "Light" }, // Default value
    items: [
      { value: "light", displayName: "Light" },
      {
        value: ThemeCardSettings.POWERBI_THEME,
        displayName: "Individual Colors",
      },
      {
        value: ThemeCardSettings.POWERBI_SET_COLORS_THEME,
        displayName: "Colored Sets",
      },
      {
        value: ThemeCardSettings.POWERBI_AUTO_THEME,
        displayName: "Single Color",
      },
      { value: "dark", displayName: "Dark" },
      { value: "vega", displayName: "Vega" },
    ],
  });

  public selectionColor = new ColorPicker({
    name: "selectionColor",
    displayName: "Selection Color",
    value: { value: defaults.selectionColor },
  });
  public color = new ColorPicker({
    name: "color",
    displayName: "Color",
    value: { value: defaults.color },
  });
  public opacity = new NumUpDown({
    name: "opacity",
    displayName: "Opacity",
    value: defaults.opacity,
  });
  public hasSelectionColor = new ColorPicker({
    name: "hasSelectionColor",
    displayName: "Color when selection is present",
    value: { value: defaults.hasSelectionColor },
  });
  public hasSelectionOpacity = new NumUpDown({
    name: "hasSelectionOpacity",
    displayName: "Opacity when selection is present",
    value: defaults.hasSelectionOpacity,
  });
  public textColor = new ColorPicker({
    name: "textColor",
    displayName: "Text Color",
    value: { value: defaults.textColor },
  });

  public setColors = new SetColorCardSettings();

  name: string = "theme";
  displayName: string = "Theme";
  slices = [
    this.theme,
    this.selectionColor,
    this.color,
    this.opacity,
    this.hasSelectionColor,
    this.hasSelectionOpacity,
    this.textColor,
    this.setColors,
  ];

  generate(
    colorPalette: UniqueColorPalette,
    data: powerbi.DataViewCategorical,
  ) {
    const r: Partial<UpSetThemeProps & { theme: UpSetThemes }> = {};
    if (this.supportIndividualColors()) {
      Object.assign(r, generatePowerBITheme(colorPalette));
    } else if (
      this.theme.value.value === ThemeCardSettings.POWERBI_AUTO_THEME
    ) {
      Object.assign(r, generateAutoPowerBITheme(colorPalette, data));
    } else {
      r.theme = this.theme.value.value as UpSetThemes;
    }
    for (const color of [
      this.selectionColor,
      this.color,
      this.hasSelectionColor,
      this.textColor,
    ]) {
      const current = color.value.value;
      const defaultValue = defaults[color.name] as string;
      if (current !== defaultValue) {
        r[color.name] = current;
      }
    }
    for (const num of [this.hasSelectionOpacity, this.opacity]) {
      const current = num.value;
      const defaultValue = defaults[num.name] as number;
      if (current !== defaultValue) {
        r[num.name] = current;
      }
    }
    return r;
  }

  supportIndividualColors() {
    return (
      this.theme.value.value === ThemeCardSettings.POWERBI_THEME ||
      this.theme.value.value === ThemeCardSettings.POWERBI_SET_COLORS_THEME
    );
  }

  get deriveCombinationColor() {
    return (
      this.theme.value.value !== ThemeCardSettings.POWERBI_SET_COLORS_THEME
    );
  }

  derive(sets: ISets<IPowerBIElem>) {
    const visible = this.supportIndividualColors();
    this.setColors.visible = visible;
    if (!visible) {
      this.setColors.slices = [];
    } else {
      this.setColors.slices = (<IPowerBISets>(<unknown>sets)).map(
        (set) =>
          new ColorPicker({
            name: "setColor",
            displayName: set.name,
            value: { value: set.color },
            selector: {
              metadata: set.value.source.queryName,
            },
          }),
      );
    }
  }
}

export class FontsCardSettings extends SimpleCard {
  public fontFamily = new FontPicker({
    name: "fontFamily",
    displayName: "Font Family",
    value: "Segoe UI",
  });

  public setLabel = new NumUpDown({
    name: "setLabel",
    displayName: "Set Label",
    value: 12,
  });

  public valueLabel = new NumUpDown({
    name: "valueLabel",
    displayName: "Value Label",
    value: 10,
  });

  name: string = "fonts";
  displayName: string = "Fonts";
  slices = [this.fontFamily, this.setLabel, this.valueLabel];

  generate(): { fontFamily: string | false; fontSizes: VennDiagramFontSizes } {
    return {
      fontFamily: this.fontFamily.value,
      fontSizes: {
        setLabel: `${this.setLabel.value}pt`,
        valueLabel: `${this.valueLabel.value}pt`,
      },
    };
  }
}

function generatePowerBITheme(colorPalette: UniqueColorPalette) {
  const c = colorPalette.base.foreground.value;
  return {
    color: c,
    textColor: colorPalette.base.foregroundButton.value,
    selectionColor: "",
    opacity: 1,
    hasSelectionOpacity: 0.4,
    filled: true,
  };
}

function generateAutoPowerBITheme(
  colorPalette: UniqueColorPalette,
  data: powerbi.DataViewCategorical,
) {
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

export class UpSetCombinationSettings
  implements GenerateSetCombinationsOptions
{
  show = true;
  displayName = "Intersections";
  mode: "intersection" | "union" | "distinctIntersection" = "intersection";
  min = 0;
  max = 6;
  empty = false;
  order = <"cardinality">"cardinality,name";
  limit = 100;

  generate(): GenerateSetCombinationsOptions<IPowerBIElem> {
    return {
      type: this.mode,
      min: this.min,
      max: this.max,
      empty: this.empty,
      limit: this.limit,
      order: <"cardinality">fixOrder(this.order),
    };
  }
}

function fixOrder(order: string) {
  if (order.includes(",")) {
    return order.split(",");
  }
  return order;
}
