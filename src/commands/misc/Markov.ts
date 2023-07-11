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
import { respond } from "../../util/general.js";
import { StringGenerator, formatters, validators } from "markov-catena";

@Discord()
export class MarkovCommand {
  // slash handler
  @Slash({ name: "markov", description: "bleh" })
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
  }) channel: TextBasedChannel,
    @SimpleCommandOption({
      name: "limit",
      description: "Optional limit to use",
      type: SimpleCommandOptionType.Number
    }) limit: number,
    command: SimpleCommandMessage,
  ) {
    if (!command.message.channel.isTextBased()) return;

    await this.markov(
      channel ?? command.message.channel,
      limit ?? 100,
      command.message,
    );
  }

  // command logic
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
