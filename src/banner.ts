import { LogType } from ".";
import ConsoleOverlayUtils from "./utils";

export default class ConsoleOverlayBanner {
  createdAt: number;
  autohideModifier: number = 0;

  readonly element: HTMLElement;

  constructor(type: LogType, ...params: any[]) {
    this.createdAt = Date.now();

    this.element = document.createElement("div");
    this.setBannerStyle();
    this.setLogStyle(type);
    this.setText(type, ...params)
  }

  public changeStyle(type: LogType) {
    this.setLogStyle(type)
  }

  public addText(...params: any[]): void {
    this.element.innerHTML += " " + this.generateText(...params);
  }

  private generateText(...params: any): string {
    let result: string[] = [];

    for (const param of params) {
      const formatted = ConsoleOverlayUtils.formatData(param);
      result.push(formatted[0]);
    }

    return result.join(" ");
  }

  private setText(type: string, ...params: any[]) {
    let result: string[] = [
      ConsoleOverlayUtils.getCurrentTime(),
      this.generateText(...params)
    ];

    this.element.innerHTML = result.join(" ");
  }

  private setBannerStyle() {
    ConsoleOverlayUtils.setStyle(this.element, {
      padding: "0px 8px",
      borderRadius: "2px",
      width: "fit-content",
      transition: `all 0.2s ease-out`,
    });
  }


  private setLogStyle(type: LogType) {
    switch (type) {
      case "web-success":
        ConsoleOverlayUtils.setStyle(this.element, {
          backgroundColor: "#33aa11"
        })
        break;
      case "web-pending":
        ConsoleOverlayUtils.setStyle(this.element, {
          backgroundColor: "#4411aa"
        })
        break;

      case "log":
        ConsoleOverlayUtils.setStyle(this.element, {
          backgroundColor: "#4444cc"
        })
        break;

      case "debug":
        ConsoleOverlayUtils.setStyle(this.element, {
          backgroundColor: "#777777",
        })
        break;

      case "info":
        ConsoleOverlayUtils.setStyle(this.element, {
          backgroundColor: "#ffffff",
          color: "#000000"
        })
        break;

      case "warn":
        ConsoleOverlayUtils.setStyle(this.element, {
          backgroundColor: "#998822"
        })
        break;

      case "error":
      case "web-error":
        ConsoleOverlayUtils.setStyle(this.element, {
          backgroundColor: "#991111"
        })
        break;

      default:
        break;
    };
  }

}