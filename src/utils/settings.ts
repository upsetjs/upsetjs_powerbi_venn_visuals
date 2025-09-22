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
import { fillDefaults, ISets } from "@upsetjs/bundle";
import type { IPowerBISets, IPowerBIElem } from "./interfaces";
import { UniqueColorPalette } from "./UniqueColorPalette";

const { SimpleCard, ItemDropdown, ColorPicker, FontPicker, NumUpDown } =
  formattingSettings;

export const defaults = fillDefaults({ sets: [], width: 100, height: 100 });

export class SetColorCardSettings extends SimpleCard {
  visible = false;
  name: string = "setColors";
  displayName: string = "Set Colors";

  slices: formattingSettings.ColorPicker[] = [
    ...Array.from({ length: 10 }),
  ].map(
    (_, i) =>
      new ColorPicker({
        name: `setColor${i + 1}`,
        displayName: `Set Color`,
        value: { value: undefined },
      }),
  );

  derive(
    sets: ISets<IPowerBIElem>,
    visible: boolean,
    colorPalette: UniqueColorPalette,
  ) {
    this.visible = visible;
    if (!visible) {
      this.slices.forEach((d) => (d.visible = false));
    } else {
      const s = [...(<IPowerBISets>(<unknown>sets))].reverse();
      s.forEach((set, i) => {
        this.slices[i].visible = true;
        this.slices[i].displayName = set.name;
        if (this.slices[i].value.value == null) {
          this.slices[i].value = colorPalette.getColor(
            set.value.source.queryName,
          );
        }
      });
      for (let i = s.length; i < this.slices.length; i++) {
        this.slices[i].visible = false;
      }
    }
  }

  toColors() {
    return this.slices.map((d) => d.value.value);
  }
}

export class ThemeCardSettings extends SimpleCard {
  static readonly POWERBI_THEME = "powerbi";
  static readonly POWERBI_SET_COLORS_THEME = "powerbi-set";
  static readonly POWERBI_AUTO_THEME = "auto";

  public theme = new ItemDropdown({
    name: "theme",
    displayNameKey: "Theme_Theme_DisplayName",
    value: {
      displayNameKey: "Theme_Theme_Light_DisplayName",
      value: "light",
    },
    items: [
      {
        displayNameKey: "Theme_Theme_Light_DisplayName",
        value: "light",
      },
      {
        displayNameKey: "Theme_Theme_IndividualColors_DisplayName",
        value: ThemeCardSettings.POWERBI_THEME,
      },
      {
        displayNameKey: "Theme_Theme_ColoredSets_DisplayName",
        value: ThemeCardSettings.POWERBI_SET_COLORS_THEME,
      },
      {
        displayNameKey: "Theme_Theme_SingleColor_DisplayName",
        value: ThemeCardSettings.POWERBI_AUTO_THEME,
      },
      {
        displayNameKey: "Theme_Theme_Dark_DisplayName",
        value: "dark",
      },
      {
        displayNameKey: "Theme_Theme_Vega_DisplayName",
        value: "vega",
      },
    ],
  });

  public selectionColor = new ColorPicker({
    name: "selectionColor",
    displayNameKey: "Theme_SelectionColor_DisplayName",
    value: { value: defaults.selectionColor },
  });
  public color = new ColorPicker({
    name: "color",
    displayNameKey: "Theme_Color_DisplayName",
    value: { value: defaults.color },
  });
  public opacity = new NumUpDown({
    name: "opacity",
    displayNameKey: "Theme_Opacity_DisplayName",
    value: defaults.opacity,
  });
  public hasSelectionColor = new ColorPicker({
    name: "hasSelectionColor",
    displayNameKey: "Theme_HasSelectionColor_DisplayName",
    value: { value: defaults.hasSelectionColor },
  });
  public hasSelectionOpacity = new NumUpDown({
    name: "hasSelectionOpacity",
    displayNameKey: "Theme_HasSelectionOpacity_DisplayName",
    value: defaults.hasSelectionOpacity,
  });
  public textColor = new ColorPicker({
    name: "textColor",
    displayNameKey: "Theme_TextColor_DisplayName",
    value: { value: defaults.textColor },
  });

  name: string = "theme";
  displayNameKey: string = "Theme_DisplayName";
  slices = [
    this.theme,
    this.selectionColor,
    this.color,
    this.opacity,
    this.hasSelectionColor,
    this.hasSelectionOpacity,
    this.textColor,
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

  applyColorPalette(
    colorPalette: powerbi.extensibility.ISandboxExtendedColorPalette,
  ) {
    if (colorPalette.isHighContrast) {
      this.textColor.value = colorPalette.foreground;
      this.color.value = colorPalette.background;
      this.selectionColor.value = colorPalette.foregroundSelected;
    }
  }
}

export class FontsCardSettings extends SimpleCard {
  public fontFamily = new FontPicker({
    name: "fontFamily",
    displayNameKey: "Fonts_FontFamily_DisplayName",
    value: "Segoe UI",
  });

  public setLabel = new NumUpDown({
    name: "setLabel",
    displayNameKey: "Fonts_SetLabel_DisplayName",
    value: 12,
  });

  public valueLabel = new NumUpDown({
    name: "valueLabel",
    displayNameKey: "Fonts_ValueLabel_DisplayName",
    value: 10,
  });

  name: string = "fonts";
  displayNameKey: string = "Fonts_DisplayName";
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
