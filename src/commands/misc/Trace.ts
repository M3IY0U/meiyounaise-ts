import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Attachment,
  CommandInteraction,
  EmbedBuilder,
  Message,
  MessageContextMenuCommandInteraction,
} from "discord.js";
import { ContextMenu, Discord, Slash, SlashOption } from "discordx";
import {
  CommandError,
  ResponseType,
  respond,
  responseEmbed,
} from "../../util/general.js";
import TraceMoe from "moe-api";
import { Result } from "moe-api/dist/cjs/interface.js";
import { anilistById } from "../../util/AnilistQueries.js";
import { Pagination, PaginationType } from "@discordx/pagination";

@Discord()
export class Trace {
  @Slash({ name: "trace", description: "Lookup a screenshot on trace.moe" })
  async slashTrace(
    @SlashOption({
    name: "image",
    description: "The image to lookup",
    required: true,
    type: ApplicationCommandOptionType.Attachment
  }) screenshot: Attachment,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();

    await this.trace(screenshot, interaction);
  }

  @ContextMenu({
    type: ApplicationCommandType.Message,
    name: "trace.moe Lookup",
  })
  async contextTrace(interaction: MessageContextMenuCommandInteraction) {
    await interaction.deferReply();

    const image = interaction.targetMessage.attachments.first();

    if (!image) {
      return await respond(
        {
          embeds: responseEmbed(ResponseType.Error, "No image found"),
        },
        interaction,
      );
    }

    await this.trace(image, interaction);
  }

  async trace(
    screenshot: Attachment,
    interaction: CommandInteraction | Message,
  ) {
    if (!screenshot.height || !screenshot.width) {
      return await respond(
        {
          embeds: responseEmbed(
            ResponseType.Error,
            "Attachment must be an image or video",
          ),
        },
        interaction,
      );
    }

    if (screenshot.size > 10_000_000) {
      return await respond(
        {
          embeds: responseEmbed(
            ResponseType.Error,
            "Attachment must be smaller than 10MB",
          ),
        },
        interaction,
      );
    }

    const moe = new TraceMoe({ anilistInfo: false });
    const result = (await moe.traceFromUrl(screenshot.url)) as Result;
    const res = result.result.shift();

    if (result.error || !res) {
      throw new CommandError(result.error || "No results found");
    }

    const aniInfo = await anilistById(res.anilist as number, false);

    const embed = new EmbedBuilder()
      .setTitle(`${aniInfo.title.english} (${aniInfo.startDate.year})`)
      .setURL(aniInfo.siteUrl)
      .setImage(`https://img.anili.st/media/${res.anilist}`)
      .setThumbnail(res.image)
      .addFields([
        {
          name: "Episode",
          value: `${res.episode ?? "?"}/${aniInfo.episodes ?? "?"}`,
          inline: true,
        },
        {
          name: "Video Timestamp",
          value: `${this.fmtTime(res.from)} - ${this.fmtTime(res.to)}`,
          inline: true,
        },
      ])
      .setFooter({
        text: `Similarity: ${(res.similarity * 100).toFixed(2)}%`,
      });

    console.log(res);
    const msg = await respond(
      {
        embeds: [embed],
      },
      interaction,
    );
    if (res.video) await msg.reply({ files: [res.video] });
  }

  private fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = Math.floor(s % 60);
    return `${m}:${rs < 10 ? "0" : ""}${rs}`;
  };
}
