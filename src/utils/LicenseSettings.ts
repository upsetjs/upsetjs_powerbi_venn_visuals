/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */
import powerbi from 'powerbi-visuals-api';

function isValidDate(decoded: string) {
  if (!/^(\d\d)\.(\d\d)\.(\d\d\d\d)$/gm.test(decoded)) {
    return null;
  }
  const arr = decoded.split('.');
  const day = Number.parseInt(arr[0], 10);
  const month = Number.parseInt(arr[1], 10);
  const year = Number.parseInt(arr[2], 10);

  return new Date(year, month - 1, day);
}

export default class LicenseSettings {
  code = '';
  info = '';
  contact = '';

  readonly #decoder: (code: string) => Promise<string | null>;
  readonly #url: string;

  constructor(decoder: (code: string) => Promise<string | null>, url: string) {
    this.#decoder = decoder;
    this.#url = url;
    this.contact = url;
  }

  private updateInfo(host: powerbi.extensibility.visual.IVisualHost, info: string) {
    if (this.info === info) {
      return;
    }
    host.persistProperties({
      merge: [
        {
          objectName: 'license',
          selector: '',
          properties: {
            info,
          },
        },
      ],
    });
  }

  private deriveLicenseState(
    decoded: string | null,
    host: powerbi.extensibility.visual.IVisualHost
  ): 'no-license' | 'invalid' | 'valid' | 'expired' {
    if (!decoded || decoded.trim().length === 0) {
      this.updateInfo(host, '');
      return 'no-license';
    }
    if (!decoded.includes(':')) {
      this.updateInfo(host, 'invalid license code');
      return 'invalid';
    }
    const [dateString, customer] = decoded.split(':');
    const expirationDate = isValidDate(dateString);
    if (!expirationDate) {
      this.updateInfo(host, 'invalid license code');
      return 'invalid';
    }
    const today = new Date();
    if (today <= expirationDate) {
      const date = expirationDate.toDateString();
      this.updateInfo(host, `${customer} (valid until ${date})`);
      return 'valid';
    }
    this.updateInfo(host, `${customer} (license expired)`);
    return 'expired';
  }

  updateLicenseState(
    target: HTMLElement,
    host: powerbi.extensibility.visual.IVisualHost,
    usesProFeatures: () => boolean
  ) {
    return this.#decoder(this.code).then((decoded) => {
      const state = this.deriveLicenseState(decoded, host);
      if (state === 'valid' || !usesProFeatures()) {
        this.resetWatermark(target);
      } else {
        applyWatermark(target, this.#url);
      }
    });
  }

  resetWatermark(target: HTMLElement) {
    target.style.background = '';
  }
}

function applyWatermark(target: HTMLElement, text: string) {
  const fontSize = 30;
  const opacity = 0.2;
  const size = 110 * 2;
  const height = 110 * 2;

  const x = size / 2;
  const y = height / 2;

  const grey = `<text transform='translate(${x},${y}) rotate(-45)'>${text}</text>`;
  const green = `<text transform='translate(${
    x + size * 0.5
  },${y}) rotate(-45)' fill='rgb(190, 227, 190)'>${text}</text>`;
  const white = `<text transform='translate(${x + size * 1},${y}) rotate(-45)' fill='white'>${text}</text>`;
  const white2 = `<text transform='translate(${x + size * -0.5},${y}) rotate(-45)' fill='white'>${text}</text>`;
  const style = `fill: black; font-size: ${fontSize}; text-anchor: middle; dominant-baseline: central; fill-opacity: ${opacity}`;
  const prefix = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1'`;

  const url = `${prefix} height='${height}px' width='${
    size * 1.5
  }px'><g style='${style}'>${white}${grey}${green}${white2}</g></svg>")`;

  target.style.background = url;
}
