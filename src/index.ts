import type * as CSS from 'csstype';
import ConsoleOverlayBanner from "./banner";
import Utils from "./utils";

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
  opacity?: number,
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
    opacity: 0.8
  }

  constructor() {
    this.show()

    this.overrideConsole("log");
    this.overrideConsole("debug");
    this.overrideConsole("info");
    this.overrideConsole("warn");
    this.overrideConsole("error");

    window.onerror = (e, src, line, col, err) => {
      const banner = this.showLog("error", err?.message, err?.cause)

      if (err?.stack) {
        //@ts-ignore
        const stackTrace = err.stack.split("\n").filter(str => str) ?? [];
        banner.setStackTrace(stackTrace)
      }
    }

    window.onunhandledrejection = (e,) => {
      const banner = this.showLog("error", e?.type, e.reason?.message)

      if (e.reason?.stack) {
        //@ts-ignore
        const stackTrace = e.reason.stack.split("\n").filter(str => str) ?? [];
        banner.setStackTrace(stackTrace)
      }
    }

    this.overrideFetch()
    this.overrideXmlHttpRequest()
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
          "web-pending",
          resource.method,
          Utils.formatUrl(resource.url ?? resource)
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

  private overrideXmlHttpRequest() {
    const that = this;

    XMLHttpRequest.prototype.open = new Proxy(XMLHttpRequest.prototype.open, {
      apply(target, thisArg, argArray) {
        //@ts-ignore
        target.apply(thisArg, argArray);

        const banner = that.showLog(
          "web-pending",
          argArray[0],
          Utils.formatUrl(argArray[1]),
        );

        if (argArray[0] === "POST") {
          banner.createWebProgressDiv();

          thisArg.upload.addEventListener("progress", (e: any) => {
            banner.setWebProgress(Math.round((e.loaded / e.total) * 100), e.total, e.loaded)
            banner.autohideModifier += 1000
          })
        }

      },
    })
  }

  private overrideConsole(type: LogType) {
    const that = this;

    //@ts-ignore
    console[type] = new Proxy(console[type], {
      apply(target, thisArg, argArray) {
        target.apply(thisArg, argArray);

        const banner = that.showLog(type, ...argArray)

        if (type === "error") {
          const stackTrace = Error().stack?.split("\n").filter(str => str) ?? [];
          banner.setStackTrace(stackTrace)
        }
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

    Utils.setStyle(element, {
      position: "absolute",
      display: "flex",
      gap: "2px",
      borderRadius: "5px",
      maxHeight: this.options.maxHeight + "px",
      overflow: "auto",
      zIndex: "30000",
      maxWidth: this.options.maxWidth! > 10 ? `${this.options.maxWidth}px` : `calc(100vw - ${this.options.offsetX! * 2}px)`,
      opacity: Math.max(0.0, Math.min(1.0, this.options.opacity!)),
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
        try {
          if (this.isMouseOver) {
            message.autohideModifier += 1000;
            continue;
          }

          if (now - (message.createdAt + message.autohideModifier) > (this.options.autohideDelay! * 1000)) {
            this.containerElement!.removeChild(message.container);
            this.messages = this.messages.filter(el => el !== message);
          }
        } catch (_) { }
      }

    }, 1000)
  }

  private showLog(type: LogType, ...params: any[]): ConsoleOverlayBanner {
    const banner = new ConsoleOverlayBanner(type, ...params);

    this.containerElement!.insertBefore(banner.container, this.containerElement!.firstChild);

    this.messages.push(banner);

    if (this.messages.length >= this.options.maxMessage!) {
      this.messages = this.messages.slice(- this.options.maxMessage!)
    }

    return banner
  }
}

Object.assign(window, { overlayConsole: new ConsoleOverride() })
