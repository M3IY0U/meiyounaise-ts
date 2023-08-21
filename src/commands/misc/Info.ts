import {
  CommandInteraction,
  EmbedBuilder,
  Message,
  OAuth2Scopes,
} from "discord.js";
import { Discord, SimpleCommand, SimpleCommandMessage, Slash } from "discordx";
import { maskedUrl, respond } from "../../util/general.js";

@Discord()
export class Info {
  @Slash({
    name: "info",
    description: "Get info about the bot",
  })
  async slashInfo(interaction: CommandInteraction) {
    await interaction.deferReply();
    await this.info(interaction);
  }

  @SimpleCommand({
    name: "info",
    description: "Get info about the bot",
  })
  async simpleInfo(command: SimpleCommandMessage) {
    await command.message.channel.sendTyping();
    await this.info(command.message);
  }

  async info(interaction: CommandInteraction | Message) {
    const embed = new EmbedBuilder()
      .setTitle("Meiyounaise")
      .setThumbnail(interaction.client.user?.displayAvatarURL() || "")
      .setDescription(
        `Bot (re)written (this time in typescript) by <@137234090309976064> with some music related commands, some funny™ guild functionality, and some other stuff (you can use the help command to see all commands).\n
        ❗ Most commands have both a slash and a simple version, except for guild and board settings, which are only available as slash commands.`,
      )
      .addFields([
        {
          name: "Bot Invite",
          value: maskedUrl(
            "Click",
            interaction.client.generateInvite({
              scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
            }),
          ),
          inline: true,
        },
        {
          name: "Source Code",
          value: maskedUrl("Click", "https://github.com/M3IY0U/meiyounaise-ts"),
          inline: true,
        },
      ]);

    await respond(
      {
        embeds: [embed],
      },
      interaction,
    );
  }
}
