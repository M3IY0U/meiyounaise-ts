import { appendFileSync } from "fs";
import { Logger as tslog } from "tslog";

export const Logger = new tslog({
  hideLogPositionForProduction: true,
  attachedTransports: [
    (logObj) => {
      appendFileSync("logs.txt", JSON.stringify(logObj) + "\n");
    },
  ],
});
