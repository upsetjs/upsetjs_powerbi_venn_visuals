/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import { LicenseManager } from './internal/LicenseManager';
import { UpSetBaseThemeSettings, UpSetFontSizeSettings } from './utils/settings';
import secretsJson from './secrets.json';

export default class VisualSettings extends dataViewObjectsParser.DataViewObjectsParser {
  readonly license = new LicenseManager(secretsJson.key);
  readonly theme = new UpSetThemeSettings();
  readonly fonts = new UpSetFontSizeSettings();
  readonly style = new UpSetStyleSettings();
}

export class UpSetThemeSettings extends UpSetBaseThemeSettings {}

export class UpSetStyleSettings {
  mode: 'venn' | 'euler' = 'venn';
}
