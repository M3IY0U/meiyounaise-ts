import GuildRepo from "../../db/GuildRepo.js";
import { GuildOnly } from "../../util/guards/GuildOnly.js";
import { ResponseType, respond, responseEmbed } from "../../util/general.js";
import { PermissionGuard } from "@discordx/utilities";
import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { Inject } from "typedi";

@Discord()
@SlashGroup("guild")
@Guard(
  PermissionGuard(["ManageGuild"], {
    embeds: responseEmbed(
      ResponseType.Permission,
      "You need the `ManageGuild` permission to execute this command",
    ),
  }),
)
export class RepeatMessages {
  @Inject("guildRepo")
  private repo!: GuildRepo;

  @Slash({
    name: "repeatmsg",
    description:
      "Set the amount of messages that need to be repeated to be sent again",
  })
  @Guard(GuildOnly)
  async repeatMsgSlash(
    @SlashOption({
      name: "amount",
      description: "The amount of messages that need to be repeated to be sent again",
      type: ApplicationCommandOptionType.Integer,
      required: false,
    }) amount: number | undefined,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    const guild = await this.repo.guildById(interaction.guildId || "");
    if (!guild) throw new Error("Guild not found");

    if (!amount) {
      await interaction.editReply({
        embeds: responseEmbed(
          ResponseType.Info,
          `Currently repeating messages after ${guild?.repeat_msg} identical ones`,
        ),
      });
    } else {
      await this.repo.setRepeatMsg(interaction.guildId || "", amount);
      await respond(
        {
          embeds: responseEmbed(
            ResponseType.Success,
            `Messages will be repeated after ${amount} identical messages`,
          ),
        },
        interaction,
      );
    }
  }
}
