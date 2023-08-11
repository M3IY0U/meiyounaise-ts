import { getUserColor, remainingArgs, respond } from "../../util/general.js";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  EmbedBuilder,
  Message,
} from "discord.js";
import {
  Discord,
  MetadataStorage,
  SimpleCommand,
  SimpleCommandConfig,
  SimpleCommandMessage,
  SimpleCommandOption,
  SimpleCommandOptionType,
  Slash,
  SlashOption,
} from "discordx";
import { Inject } from "typedi";

@Discord()
export class Help {
  @Inject("simpleCommandConfig")
  private simpleCommandConfig!: SimpleCommandConfig

  //#region Command Handlers
  @Slash({
    name: "help",
    description: "Get help for simple commands",
  })
  async slashHelp(
    @SlashOption({
      name: "command",
      description: "The command to get help for",
      type: ApplicationCommandOptionType.String,
      required: false
    }) command: string | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.help(command, interaction);
  }

  @SimpleCommand({
    name: "help",
    description: "Get help for simple commands",
    argSplitter: remainingArgs,
  })
  async simpleHelp(
    @SimpleCommandOption({ 
      name: "command",
      description: "The command to get help for",
      type: SimpleCommandOptionType.String
    }) command: string | undefined,
    thisCommand: SimpleCommandMessage,
  ) {
    await this.help(command, thisCommand.message);
  }
  //#endregion

  async help(
    command: string | undefined,
    interaction: CommandInteraction | Message,
  ) {
    let embed = new EmbedBuilder();

    if (!command) {
      // help for all commands
      embed = new EmbedBuilder()
        .setTitle("Help")
        .setDescription(
          `Use \`${this.simpleCommandConfig?.prefix}help <command>\` to get help for a specific command or group`,
        )
        .setColor("Random")
        .addFields([
          {
            name: `Simple Commands (${MetadataStorage.instance.simpleCommands.length})`,
            value: [
              ...new Set(
                MetadataStorage.instance.simpleCommands.map(
                  (c) =>
                    `\`${
                      c.name.includes(" ")
                        ? `${c.name.split(" ")[0]} (group)`
                        : c.name
                    }\``,
                ),
              ),
            ]
              .sort()
              .join(", "),
            inline: false,
          },
          {
            name: `Slash Commands (${MetadataStorage.instance.applicationCommandSlashesFlat.length})`,
            value: [
              ...new Set(
                MetadataStorage.instance.applicationCommandSlashesFlat.map(
                  (c) => `\`${c.group ? `${c.group} (group)` : c.name}\``,
                ),
              ),
            ]
              .sort()
              .join(", "),

            inline: false,
          },
        ]);
    } else {
      const cmd = MetadataStorage.instance.simpleCommands.find(
        (c) => c.name === command || c.name.split(" ")[0] === command,
      );
      if (!cmd) throw new Error("Command not found");

      // help for a group command
      if (cmd.name.includes(" ") && cmd.name !== command) {
        const group = cmd.name.split(" ")[0];
        const groupCommands = MetadataStorage.instance.simpleCommands.filter(
          (c) => c.name.split(" ")[0] === group,
        );
        embed = new EmbedBuilder()
          .setTitle(`Help: ${group} (group)`)
          .setDescription(
            `Use \`${this.simpleCommandConfig?.prefix}help ${group} <command>\` to get help for a specific command`,
          )
          .setColor("Random")
          .addFields([
            {
              name: `Commands (${groupCommands.length})`,
              value: groupCommands
                .map((c) => `- \`${c.name}\`: ${c.description}`)
                .sort()
                .join("\n"),
              inline: false,
            },
          ]);
      } else {
        // help for a specific command
        embed = new EmbedBuilder()
          .setTitle(`Help: ${cmd.name}`)
          .setDescription(cmd.description)
          .setColor(getUserColor(interaction))
          .addFields([
            {
              name: "Arguments",
              value: cmd.options
                .map(
                  (o) =>
                    `- \`${o.name} (${SimpleCommandOptionType[o.type]})\`: ${
                      o.description
                    }`,
                )
                .join("\n"),
              inline: false,
            },
          ]);
      }
    }
    await respond({ embeds: [embed] }, interaction);
  }
}
