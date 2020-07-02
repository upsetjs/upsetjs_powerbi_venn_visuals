/**
 * @upsetjs/powerbi_visuals
 * https://github.com/upsetjs/upsetjs_powerbi_visuals
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */
import powerbi from 'powerbi-visuals-api';

export class UniqueColorPalette {
  private readonly map = new Map<string, powerbi.IColorInfo>();
  private readonly set = new Set<string>();
  constructor(public readonly base: powerbi.extensibility.ISandboxExtendedColorPalette) {}

  getColor(key: string) {
    if (this.map.has(key)) {
      return this.map.get(key)!;
    }
    let c = this.base.getColor(key);
    let i = 0;
    while (this.set.has(c.value)) {
      c = this.base.getColor(`${key}${i++}`);
    }
    this.set.add(c.value);
    this.map.set(key, c);
    return c;
  }

  clear() {
    this.map.clear();
    this.set.clear();
  }
}
