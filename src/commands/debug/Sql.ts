import { Discord, Guard, Slash, SlashGroup, SlashOption } from "discordx";
import { Inject } from "typedi";
import { OwnerOnly } from "../../util/guards/OwnerOnly.js";
import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import DebugRepo from "../../db/DebugRepo.js";
import { respond, toHastebin } from "../../util/general.js";

@Discord()
@Guard(OwnerOnly)
@SlashGroup({ name: "sql", description: "Bot Owner only sql commands" })
@SlashGroup("sql")
export class Sql {
  @Inject("debugRepo")
  private repo!: DebugRepo;

  @Slash({ name: "query", description: "Retrieve data using raw sql" })
  async query(
    @SlashOption({
    name: "query", 
    description: "The query to execute", 
    required: true, 
    type: ApplicationCommandOptionType.String
  }) query: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    
    const result = await this.repo.query(query);
    const resultString = JSON.stringify(result, null, 2);

    if (resultString.length > 2000 - 11) {
      return await respond(
        {
          content: await toHastebin(resultString),
        },
        interaction,
      );
    }

    await respond(
      {
        content: `\`\`\`json\n${resultString}\`\`\``,
      },
      interaction,
    );
  }

  @Slash({ name: "execute", description: "Execute raw sql" })
  async execute(
    @SlashOption({
    name: "query",
    description: "The query to execute",
    required: true,
    type: ApplicationCommandOptionType.String,
  }) query: string,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    const result = await this.repo.execute(query);

    await respond(
      {
        content: `Executed, ${result} rows affected`,
      },
      interaction,
    );
  }
}
