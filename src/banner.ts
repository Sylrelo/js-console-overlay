import type * as CSS from 'csstype';
import { LogType } from ".";
import Utils from "./utils";

export default class ConsoleOverlayBanner {
  createdAt: number;
  autohideModifier: number = 0;

  readonly container: HTMLElement;

  readonly element: HTMLElement;

  #divProgressContainer: HTMLElement | null = null;
  #divProgressPercent: HTMLElement | null = null;
  #divProgressBar: HTMLElement | null = null;
  #divProgressTotalBytes: HTMLElement | null = null;

  constructor(type: LogType, ...params: any[]) {
    this.createdAt = Date.now();

    this.container = document.createElement("div");
    this.element = document.createElement("div");

    this.container.appendChild(this.element);

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
      const formatted = Utils.formatData(param);
      result.push(formatted[0]);
    }

    return result.join(" ");
  }

  private setText(type: string, ...params: any[]) {
    let result: string[] = [
      Utils.getCurrentTime(),
      this.generateText(...params)
    ];

    this.element.innerHTML = result.join(" ");
  }

  private setBannerStyle() {
    Utils.setStyle(this.container, {
      display: "flex",
      flexDirection: "column",
      width: "fit-content",
      padding: "0px 8px",
      borderRadius: "2px",
    })

    Utils.setStyle(this.element, {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      width: "fit-content",
      transition: `all 0.2s ease-out`,
      gap: "4px",
    });
  }

  private setLogStyle(type: LogType) {
    let style: CSS.Properties = {};

    switch (type) {
      case "web-success":
        style.background = "#33aa11";
        break;
      case "web-pending":
        style.background = "#4411aa";
        break;

      case "log":
        style.background = "#4444cc";
        break;

      case "debug":
        style.background = "#777777";
        break;

      case "info":
        style.background = "#ffffff";
        style.color = "#000000";
        break;

      case "warn":
        style.background = "#998822";
        break;

      case "error":
      case "web-error":
        style.background = "#991111";
        break;
      default:
        break;
    };

    Utils.setStyle(this.element, style);
    Utils.setStyle(this.container, style);
  }

  /* ------------------------------- STACK-TRACE ------------------------------ */

  public setStackTrace(traces: string[]) {
    const stackTraceContainer = document.createElement("div");

    Utils.setStyle(stackTraceContainer, {
      marginLeft: "10px",
      fontWeight: "bold"
    })

    for (const trace of traces) {
      stackTraceContainer.innerHTML += `<div>• ${trace}</div>`
    }

    this.container.appendChild(stackTraceContainer)
  }

  /* ------------------------------ WEB-PROGRESS ------------------------------ */

  public setWebProgress(percent: number, totalBytes?: number, currentBytes?: number) {
    this.#divProgressBar!.style.width = percent.toString().padStart(3, "0") + "%";
    this.#divProgressPercent!.innerHTML = percent + "%";

    if (totalBytes && currentBytes) {
      if (percent === 100) {
        this.#divProgressTotalBytes!.innerHTML = `(${Utils.formatSize(totalBytes)})`;
      } else {
        this.#divProgressTotalBytes!.innerHTML = `(${Utils.formatSize(currentBytes)} / ${Utils.formatSize(totalBytes)})`;
      }
    }
  }

  public createWebProgressDiv() {
    this.#divProgressContainer = document.createElement("div");
    Utils.setStyle(this.#divProgressContainer, {
      display: "flex",
      alignItems: "center",
      gap: "5px",
    })


    const percent = document.createElement("div");
    percent.innerHTML = "50";

    // Progress Container
    const divProgressContainer = document.createElement("div");
    Utils.setStyle(divProgressContainer, {
      display: "block",
      backgroundColor: "",
      border: "1px solid white",
      height: "8px",
      width: "100px",
      borderRadius: "2px",
    })

    // Progress bar
    const divProgress = document.createElement("div");
    Utils.setStyle(divProgress, {
      height: "inherit",
      width: "0px",
      backgroundColor: "white",
      transition: "width 0.2s linear",
      borderRadius: "inherit"
    })

    divProgressContainer.appendChild(divProgress)
    this.#divProgressContainer.appendChild(divProgressContainer);
    this.#divProgressContainer.appendChild(percent);

    // Bytes / Total Bytes
    // const divTotalBytes = document.createElement("div");
    this.#divProgressTotalBytes = document.createElement("div");
    this.#divProgressContainer.appendChild(this.#divProgressTotalBytes)


    this.#divProgressPercent = percent;
    this.#divProgressBar = divProgress;

    this.element.appendChild(this.#divProgressContainer);
  }

}