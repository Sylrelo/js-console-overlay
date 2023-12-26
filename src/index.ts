import ConsoleOverlayBanner from "./banner";
import ConsoleOverlayUtils from "./utils";

export type LogType = "log" | "debug" | "warn" | "error" | "info" | "web-success" | "web-pending" | "web-error";

class ConsoleOverride {
  private containerElement: HTMLElement;
  private messages: ConsoleOverlayBanner[] = []

  private originalFn: Record<string, any> = {
    log: undefined,
    debug: undefined,
    info: undefined,
    warn: undefined,
    error: undefined,
  }

  constructor() {
    this.containerElement = this.createContainerElement();
    this.storeOriginalFn();

    this.overrideFetch()
    this.overrideConsole("log");
    this.overrideConsole("debug");
    this.overrideConsole("info");
    this.overrideConsole("warn");
    this.overrideConsole("error");
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
    window.console[type] = function (message: string, ...params: any) {
      that.originalFn[type].bind(this, message, ...params)()
      that.showLog(type, message, ...params)
    };
  }

  private storeOriginalFn() {
    this.originalFn = {
      log: console.log,
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error,
      fetch: window.fetch,
    };
  }

  private createContainerElement(): HTMLElement {
    const element = document.createElement("div");
    element.id = "console-overlay-container";
    ConsoleOverlayUtils.setStyle(element, {
      position: "absolute",
      display: "flex",
      flexDirection: "column-reverse",
      gap: "2px",
      left: "20px",
      bottom: "40px",
      borderRadius: "5px",
      height: "250px",
      overflow: "auto",
      zIndex: "30000",
      width: "calc(100vw - 40px)",
      opacity: "0.65",
      fontSize: "0.65rem",
      fontFamily: "monospace",
      // letterSpacing: "-0.5px"
    })

    document.body.appendChild(element);
    return element;
  }

  showLog(type: LogType, ...params: any[]): ConsoleOverlayBanner {
    const banner = new ConsoleOverlayBanner(type, ...params);

    this.containerElement.insertBefore(banner.element, this.containerElement.firstChild);
    this.messages.push(banner);

    return banner
  }
}


new ConsoleOverride()