/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2023 Samuel Gratzl <sam@sgratzl.com>
 */

import { dataViewObjectsParser } from 'powerbi-visuals-utils-dataviewutils';
import LicenseSettings from './utils/LicenseSettings';
import { compositeDecoder, decodeAndVerifyECDSASignature } from './utils/crypto';
import base64Decoder from './internal/base64Decoder';
import { UpSetBaseThemeSettings, UpSetFontSizeSettings } from './utils/settings';
import secrets from './secrets';

const decoder = compositeDecoder([base64Decoder(secrets.key), decodeAndVerifyECDSASignature(secrets.ecdsa.public)]);

export default class VisualSettings extends dataViewObjectsParser.DataViewObjectsParser {
  readonly license = new LicenseSettings(decoder, 'https://dataviz.boutique');
  readonly theme = new UpSetThemeSettings();
  readonly fonts = new UpSetFontSizeSettings();
  readonly style = new UpSetStyleSettings();
}

export class UpSetThemeSettings extends UpSetBaseThemeSettings {}

export class UpSetStyleSettings {
  mode: 'venn' | 'euler' = 'venn';
}
