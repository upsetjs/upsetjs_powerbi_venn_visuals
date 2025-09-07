/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2025 Samuel Gratzl <sam@sgratzl.com>
 */

import {
  UpSetBaseThemeSettings,
  UpSetFontSizeSettings,
} from "./utils/settings";

export default class VisualSettings extends dataViewObjectsParser.DataViewObjectsParser {
  readonly theme = new UpSetThemeSettings();
  readonly fonts = new UpSetFontSizeSettings();
  readonly style = new UpSetStyleSettings();
}

export class UpSetThemeSettings extends UpSetBaseThemeSettings {}

export class UpSetStyleSettings {
  mode: "venn" | "euler" = "venn";
}
