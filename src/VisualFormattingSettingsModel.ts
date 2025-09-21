import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import {
  FontsCardSettings,
  SetColorCardSettings,
  ThemeCardSettings,
} from "./utils/settings";

const { SimpleCard, ItemDropdown, Model } = formattingSettings;

export class StyleCardSettings extends SimpleCard {
  public mode = new ItemDropdown({
    name: "mode",
    displayName: "Layout Mode",
    value: { value: "venn", displayName: "Venn Diagram" },
    items: [
      { value: "venn", displayName: "Venn Diagram" },
      { value: "euler", displayName: "Euler Diagram" },
    ],
  });

  name: string = "style";
  displayName: string = "Style";
  slices = [this.mode];

  generate() {
    return {
      mode: this.mode.value.value,
    };
  }
}

export default class VisualFormattingSettingsModel extends Model {
  public theme = new ThemeCardSettings();
  public setColors = new SetColorCardSettings();
  public style = new StyleCardSettings();
  public fonts = new FontsCardSettings();

  cards = [this.theme, this.setColors, this.style, this.fonts];
}
