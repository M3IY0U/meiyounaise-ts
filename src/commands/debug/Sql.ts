import DebugRepo from "../../db/DebugRepo.js";
import { respond, toHastebin } from "../../util/general.js";
import { OwnerOnly } from "../../util/guards/OwnerOnly.js";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  CommandInteraction,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import {
  Discord,
  Guard,
  ModalComponent,
  Slash,
  SlashGroup,
  SlashOption,
} from "discordx";
import { Inject } from "typedi";

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
    description: "The query to execute, enter `modal` to show a modal instead", 
    required: true, 
    type: ApplicationCommandOptionType.String
  }) query: string,
    interaction: CommandInteraction,
  ) {
    if (query === "modal") {
      await interaction.showModal(this.createModal(true));
      return;
    }

    await interaction.deferReply();

    const result = await this.repo.query(query);
    const resultString = JSON.stringify({ query, result }, null, 2);

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
    description: "The query to execute, enter `modal` to show a modal instead",
    required: true,
    type: ApplicationCommandOptionType.String,
  }) query: string,
    interaction: CommandInteraction,
  ) {
    if (query === "modal") {
      await interaction.showModal(this.createModal(false));
      return;
    }

    await interaction.deferReply();

    const result = await this.repo.execute(query);

    await respond(
      {
        content: `Executed, ${result} rows affected`,
      },
      interaction,
    );
  }

  private createModal = (isQuery: boolean) => {
    const modal = new ModalBuilder()
      .setTitle("SQL Query")
      .setCustomId(isQuery ? "sqlquery" : "sqlexecute");

    const input = new TextInputBuilder()
      .setCustomId("query")
      .setPlaceholder("Enter your query here")
      .setLabel("Query")
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(input),
    );

    return modal;
  };

  @ModalComponent({
    id: "sqlquery",
  })
  async sqlModalQuery(interaction: ModalSubmitInteraction) {
    await interaction.deferReply();

    const query = interaction.fields.getTextInputValue("query");
    const result = await this.repo.query(query);
    const resultString = JSON.stringify({ query, result }, null, 2);

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

  @ModalComponent({
    id: "sqlexecute",
  })
  async sqlModalExecute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply();
    const result = await this.repo.execute(
      interaction.fields.getTextInputValue("query"),
    );

    await respond(
      {
        content: `Executed, ${result} rows affected`,
      },
      interaction,
    );
  }
}
