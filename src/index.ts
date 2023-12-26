import type * as CSS from 'csstype';
import ConsoleOverlayBanner from "./banner";
import ConsoleOverlayUtils from "./utils";

export type LogType = "log" | "debug" | "warn" | "error" | "info" | "web-success" | "web-pending" | "web-error";

type OverlayPosition = "BOTTOM-LEFT" | "BOTTOM-RIGHT" | "TOP-LEFT" | "TOP-RIGHT";

interface Options {
  maxMessage?: number,
  autohideDelay?: number,
  position?: OverlayPosition,
  offsetX?: number,
  offsetY?: number,
  maxHeight?: number,
  maxWidth?: number,
}

class ConsoleOverride {

  private isMouseOver = false;

  private containerElement: HTMLElement | undefined = undefined;
  private messages: ConsoleOverlayBanner[] = []

  private options: Options = {
    maxMessage: 100,
    autohideDelay: 10,
    position: "BOTTOM-LEFT",
    offsetX: 20,
    offsetY: 40,
    maxHeight: 200,
    maxWidth: 0,
  }

  constructor() {
    this.overrideFetch()
    this.overrideConsole("log");
    this.overrideConsole("debug");
    this.overrideConsole("info");
    this.overrideConsole("warn");
    this.overrideConsole("error");

    this.show()
  }

  public setOptions(options: Options) {
    this.options = {
      ...this.options,
      ...options
    }

    document.body.removeChild(this.containerElement!);
    this.show()
  }

  public show() {
    this.containerElement = this.createContainerElement();
  }

  private overrideFetch() {
    const that = this;

    window.fetch = new Proxy(window.fetch, {
      async apply(target, thisArg, argArray: any[]) {
        const resource = argArray[0] as Request;

        const banner = that.showLog(
          "debug",
          resource.method,
          resource.url
            .replace(location.protocol + "//", "")
            .replace(location.hostname, "")
        );

        const startTime = Date.now();
        //@ts-ignore
        let ogResponse = await target.apply(thisArg, argArray);
        const timeTaken = Date.now() - startTime;

        if (!ogResponse.ok) {
          const res = await ogResponse.clone().text()
          banner.changeStyle("web-error");
          banner.addText(`[${ogResponse.status} ${ogResponse.statusText}]`, `[${timeTaken}ms]`, res)
        } else {
          banner.changeStyle("web-success");
          banner.addText(`[${ogResponse.status}]`, `[${timeTaken}ms]`)
        }

        return ogResponse;
      },
    })

  }

  private overrideConsole(type: LogType) {
    const that = this;

    //@ts-ignore
    console[type] = new Proxy(console[type], {
      apply(target, thisArg, argArray) {
        target.apply(thisArg, argArray);
        that.showLog(type, ...argArray)
      },
    })
  }

  private createContainerElement(): HTMLElement {
    const element = document.createElement("div");
    element.id = "console-overlay-container";

    const position: { [key: string]: CSS.Properties } = {
      "BOTTOM-LEFT": {
        bottom: this.options.offsetY + "px",
        left: this.options.offsetX + "px",
        flexDirection: "column-reverse",

      },
      "TOP-LEFT": {
        top: this.options.offsetY + "px",
        left: this.options.offsetX + "px",
        flexDirection: "column",

      },
      "BOTTOM-RIGHT": {
        bottom: this.options.offsetY + "px",
        right: this.options.offsetX + "px",
        flexDirection: "column-reverse",

      },
      "TOP-RIGHT": {
        top: this.options.offsetY + "px",
        right: this.options.offsetX + "px",
        flexDirection: "column",
      },
    };

    ConsoleOverlayUtils.setStyle(element, {
      position: "absolute",
      display: "flex",
      gap: "2px",
      borderRadius: "5px",
      maxHeight: this.options.maxHeight + "px",
      overflow: "auto",
      zIndex: "30000",
      maxWidth: this.options.maxWidth! > 10 ? `${this.options.maxWidth}px` : `calc(100vw - ${this.options.offsetX! * 2}px)`,
      opacity: "0.65",
      fontSize: "0.65rem",
      fontFamily: "monospace",
      ...position[this.options.position!]

    })

    element.addEventListener("mouseenter", () => {
      this.isMouseOver = true;
    })

    element.addEventListener("mouseleave", () => {
      this.isMouseOver = false;
    })

    this.autohide();

    document.body.appendChild(element);
    return element;
  }

  private autohide() {
    setInterval(() => {
      const now = Date.now();

      for (const message of this.messages) {

        if (this.isMouseOver) {
          message.autohideModifier += 1000;
          continue;
        }

        if (now - (message.createdAt + message.autohideModifier) > (this.options.autohideDelay! * 1000)) {
          this.containerElement!.removeChild(message.element);
          this.messages = this.messages.filter(el => el !== message);
        }
      }

    }, 1000)
  }

  private showLog(type: LogType, ...params: any[]): ConsoleOverlayBanner {
    const banner = new ConsoleOverlayBanner(type, ...params);

    this.containerElement!.insertBefore(banner.element, this.containerElement!.firstChild);

    this.messages.push(banner);

    if (this.messages.length >= this.options.maxMessage!) {
      this.messages = this.messages.slice(- this.options.maxMessage!)
    }

    return banner
  }
}

Object.assign(window, { overlayConsole: new ConsoleOverride() })
