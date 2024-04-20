import "@statistical/env/bot";
import "@statistical/config";

import { GlobalFonts } from "@napi-rs/canvas";
import { ASSETS_DIRECTORY } from "./constants";

GlobalFonts.registerFromPath(
  `${ASSETS_DIRECTORY}/fonts/Inter-Bold.ttf`,
  "InterBold",
);
GlobalFonts.registerFromPath(
  `${ASSETS_DIRECTORY}/fonts/Inter-Medium.ttf`,
  "InterMedium",
);
GlobalFonts.registerFromPath(
  `${ASSETS_DIRECTORY}/fonts/Inter-Regular.ttf`,
  "InterRegular",
);
GlobalFonts.registerFromPath(
  `${ASSETS_DIRECTORY}/fonts/Roboto-Bold.ttf`,
  "RobotoBold",
);

import { BotClient } from "./structures/client";
const client = new BotClient();
client.connect();
client.register();
