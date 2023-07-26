import cloudscraper from "cloudscraper";
import { parse } from "node-html-parser";

export abstract class BaseScraper {
  static baseUrl = "https://www.albumoftheyear.org";

  protected static scrapeAndParse = async (url: string) => {
    const html = await cloudscraper(encodeURI(url.replaceAll(" ", "+")));
    return this.parseBlock(html);
  };

  private static parseBlock = (text: string) =>
    parse(text, {
      blockTextElements: {
        script: true,
        noscript: true,
        style: true,
        pre: true,
      },
    });

  protected static scoreToEmoji = (score: number) => {
    if (Number.isNaN(score)) return "❔";

    if (score >= 70) return `🟢 ${score}`;
    else if (score >= 50) return `🟡 ${score}`;
    else return `🔴 ${score}`;
  };
}
