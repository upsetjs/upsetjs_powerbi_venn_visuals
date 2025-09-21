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
    displayNameKey: "Style_Mode_DisplayName",
    value: {
      displayNameKey: "Style_Mode_Venn_DisplayName",
      value: "venn",
    },
    items: [
      {
        displayNameKey: "Style_Mode_Venn_DisplayName",
        value: "venn",
      },
      {
        displayNameKey: "Style_Mode_Euler_DisplayName",
        value: "euler",
      },
    ],
  });

  name: string = "style";
  displayNameKey: string = "Style_DisplayName";
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
