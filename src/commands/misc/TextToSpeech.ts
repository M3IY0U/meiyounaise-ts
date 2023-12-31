import { remainingArgs, respond } from "../../util/general.js";
import { EnumChoice } from "@discordx/utilities";
import {
  ApplicationCommandOptionType,
  CommandInteraction,
  Message,
} from "discord.js";
import {
  Discord,
  SimpleCommand,
  SimpleCommandMessage,
  SimpleCommandOption,
  SimpleCommandOptionType,
  Slash,
  SlashChoice,
  SlashOption,
} from "discordx";
import { request } from "undici";

enum Voice {
  // ENGLISH VOICES
  English_Female = "en_us_001",
  English_Male = "en_us_006",

  // EUROPE VOICES
  French_Male = "fr_001",
  German_Female = "de_001",
  German_Male = "de_002",
  Spanish_Male = "es_002",

  // ASIA VOICES
  Japanese_Female = "jp_001",
  Japanese_Male = "jp_006",
  Korean_Male = "kr_002",
  Korean_Female = "kr_003",

  // SINGING VOICES
  Alto = "en_female_f08_salut_damour",
  Tenor = "en_male_m03_lobby",
  WarmyBreeze = "en_female_f08_warmy_breeze",
  SunshineSoon = "en_male_m03_sunshine_soon",

  // OTHER
  Narrator = "en_male_narration",
  Wacky = "en_male_funny",
  Peaceful = "en_female_emotional",
}

@Discord()
export class TextToSpeech {
  //#region Command Handlers
  @Slash({
    name: "tts",
    description: "Generate a TikTok TTS audio file",
  })
  async slashTTS(
    @SlashOption({
      name: "text", 
      description: "Text to say", 
      type: ApplicationCommandOptionType.String}) text: string,
    @SlashChoice(...EnumChoice(Voice))
      @SlashOption({
        name: "voice",
        description: "Voice to use",
        type: ApplicationCommandOptionType.String,
        required: false,
      })
    voice: Voice,
    interaction: CommandInteraction,
  ) {
    await interaction.deferReply();
    await this.tts(text, interaction, voice);
  }

  // simple handler
  @SimpleCommand({
    name: "tts",
    argSplitter: remainingArgs,
    description:
      "Generate a TikTok TTS audio file (Use slash command version to select voice)",
  })
  async simpleTTS(
    @SimpleCommandOption({
      name: "Text", 
      description: "Text to say", 
      type: SimpleCommandOptionType.String}) text: string,
    command: SimpleCommandMessage,
  ) {
    await this.tts(text, command.message);
  }

  //#endregion

  async tts(
    text: string,
    interaction: CommandInteraction | Message,
    voice?: Voice,
  ) {
    const v = voice ?? Voice.English_Female;

    const url = `https://api16-va.tiktokv.com/media/api/text/speech/invoke/?text_speaker=${v}&req_text=${text
      .replaceAll("+", "plus")
      .replaceAll(" ", "+")
      .replaceAll("&", "and")}&speaker_map_type=0&aid=1233`;
    const json = await request(url, {
      headers: {
        "User-Agent":
          "com.zhiliaoapp.musically/2022600030 (Linux; U; Android 7.1.2; es_ES; SM-G988N; Build/NRD90M;tt-ok/3.12.13.1)",
        Cookie: `sessionid=${process.env.TIKTOK_SESSION};`,
      },
      method: "POST",
    }).then((r) => r.body.json() as any);

    const vstr = json["data"]["v_str"];
    const decoded = Buffer.from(`data:audio/mpeg;base64,${vstr}`, "base64");

    await respond(
      {
        files: [
          {
            attachment: decoded,
            name: "tts.mp3",
          },
        ],
      },
      interaction,
    );
  }
}
