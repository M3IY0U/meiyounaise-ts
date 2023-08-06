import { appendFileSync } from "fs";
import { Logger as tslog } from "tslog";

export const Logger = new tslog({
  hideLogPositionForProduction: true,
  attachedTransports: [
    (logObj) => {
      try {
        appendFileSync("logs.txt", JSON.stringify(logObj) + "\n");
      } catch (e) {
        console.log(`Couldn't write to logfile: ${e}`);
      }
    },
  ],
});
