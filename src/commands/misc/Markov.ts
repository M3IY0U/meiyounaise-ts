import { respond } from "../../util/general.js";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  Message,
  TextBasedChannel,
} from "discord.js";
import {
  Discord,
  SimpleCommand,
  SimpleCommandMessage,
  SimpleCommandOption,
  SimpleCommandOptionType,
  Slash,
  SlashOption,
} from "discordx";
import { StringGenerator, formatters, validators } from "markov-catena";

// reminder if this breaks on deployment: create index.d.ts with `declare module 'markov-catena';` in dist folder
@Discord()
export class MarkovCommand {
  //#region Command Handlers
  @Slash({ name: "markov", description: "Generate a sentence" })
  async slashMarkov(
    @SlashOption({
    name: "channel",
    description: "Optional channel to use",
    required: false,
    type: ApplicationCommandOptionType.Channel
  })channel: TextBasedChannel,
    @SlashOption({
    name: "limit",
    description: "Optional limit to use",
    required: false,
    type: ApplicationCommandOptionType.Integer
  })limit: number,
    interaction: CommandInteraction,
  ) {
    if (!interaction.channel?.isTextBased()) return;

    await interaction.deferReply();
    await this.markov(
      channel ?? interaction.channel,
      limit ?? 100,
      interaction,
    );
  }

  // simple handler
  @SimpleCommand({ name: "markov" })
  async simpleMarkov(
    @SimpleCommandOption({
    name: "channel",
    description: "Optional channel to use",
    type: SimpleCommandOptionType.Channel
  }) channel: TextBasedChannel | undefined,
    @SimpleCommandOption({
      name: "limit",
      description: "Optional limit to use",
      type: SimpleCommandOptionType.Number
    }) limit: number | undefined,
    command: SimpleCommandMessage,
  ) {
    if (!command.message.channel.isTextBased()) return;

    await command.message.channel.sendTyping();
    await this.markov(
      channel ?? command.message.channel,
      limit ?? 100,
      command.message,
    );
  }
  //#endregion

  async markov(
    channel: TextBasedChannel,
    limit: number,
    interaction: CommandInteraction | Message,
  ) {
    const messages = await channel.messages.fetch({ limit });
    const seed: string[] = [];

    // why is there no map method for collections
    messages.forEach((message) => {
      if (
        message.content !== "" &&
        message.author.id !== message.client.user.id
      )
        seed.push(message.content);
    });

    const generator = new StringGenerator(seed);
    const result = generator.generateString({
      formatter: formatters.defaultFormatter,
      validator: validators.wordsCount(2, 20),
    });

    await respond(
      {
        content: result,
      },
      interaction,
    );
  }
}
