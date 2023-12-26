import type * as CSS from 'csstype';

export default class ConsoleOverlayUtils {
  public static setStyle(element: HTMLElement, styles: CSS.Properties) {
    for (const key in styles) {
      //@ts-ignore
      element.style[key] = styles[key as CSS.Pro];
    }
  }


  public static getCurrentTime(): string {
    const time = new Date();

    let currentTime = "";

    currentTime += time.getHours().toString().padStart(2, "0");
    currentTime += ":"
    currentTime += time.getMinutes().toString().padStart(2, "0");
    currentTime += ":"
    currentTime += time.getSeconds().toString().padStart(2, "0");
    currentTime += ":"
    currentTime += time.getMilliseconds().toString().padStart(3, "0");

    return currentTime;
  }

  public static formatData(data: any, parentType?: string, iteration: number = 0): [string, any[],] {
    let str = "";
    let exformat: any[] = []

    if (Array.isArray(data)) {

      str += '['
      let f: any = {
        type: "array",
        data: []
      };

      for (const a of data) {
        const val = this.formatData(a);
        str += val[0] + ', '
        f.data.push(val[1])
      }

      exformat.push(f)
      str += ']'

    }
    else if (typeof data === "object") {
      str += '{'
      let f: any = {
        type: "object",
        data: []
      };

      for (const key in data) {

        if (data[key] instanceof Window || key === "window" || key === "view" || key.toLowerCase().includes("target") || key === "srcElement" || key === "toElement" || key === "view") {
          continue
        }

        let r = this.formatData(data[key], "object", iteration + 1);

        str += `${key}: ${r[0]}, `;
        f.data.push({
          key,
          data: r[1]
        })
      }
      exformat.push(f)

      str += '}'

    } else if (typeof data === "number" || typeof data === "bigint") {
      str += data.toString()
      exformat.push({
        type: "number",
        data: data
      })
    } else if (typeof data === "string") {

      if (data.toString().startsWith("function ")) {
        str += "__fn()"
      } else {
        str += parentType === "object" ? `"${data}"` : `${data}`;
      }

      exformat.push({
        type: "string",
        data: data
      })
    } else if (typeof data === "boolean") {
      str += data ? "true" : "false"
    } else if (typeof data === "function") {
      const asString: string = data.toString();

      str += !asString.includes("native code ") ? "__fn()" : asString;
    } else {
      console.info("I DONT KNOW", typeof data)
    }

    return [str, exformat];
  }
}