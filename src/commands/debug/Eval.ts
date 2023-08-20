import { remainingArgs, respond, toHastebin } from "../../util/general.js";
import { OwnerOnly } from "../../util/guards/OwnerOnly.js";
import {
  Discord,
  Guard,
  SimpleCommand,
  SimpleCommandMessage,
  SimpleCommandOption,
  SimpleCommandOptionType,
} from "discordx";
import { inspect } from "util";

@Discord()
@Guard(OwnerOnly)
export class Eval {
  @SimpleCommand({
    name: "eval",
    description: "Evaluate javascript code",
    argSplitter: remainingArgs,
  })
  async evalCommand(
    @SimpleCommandOption({
    name: "code",
    description: "Code to evaluate",
    type: SimpleCommandOptionType.String
  })code: string,
    command: SimpleCommandMessage,
  ) {
    const console: any = {
      _lines: [] as string[],
      _log(...args: string[]) {
        this._lines.push(
          ...args
            .map((x) => inspect(x, { getters: true }))
            .join(" ")
            .split("\n"),
        );
      },
    };

    console.log =
      console.error =
      console.warn =
      console.info =
        console._log.bind(console);

    let script = code.replace(/(^`{3}(js|javascript)?|`{3}$)/g, "");
    if (script.includes("await")) script = `(async () => { ${script} })()`;

    let result: any;
    try {
      result = await eval(script);
    } catch (e) {
      result = e;
    }

    const out = inspect(result);
    const consoleOut = console._lines.join("\n");

    const content = `// Output\n\`\`\`js\n${out}\n\`\`\`\n\n// Console\n\`\`\`\n${consoleOut}\n\`\`\``;

    if (content.length > 2000) {
      await respond(
        {
          content: await toHastebin(content.replace(/^`{3}(js)?/gm, "")),
        },
        command.message,
      );
    } else {
      await respond(
        {
          content,
        },
        command.message,
      );
    }
  }
}
