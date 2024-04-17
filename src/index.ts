import "./utils/env";
import "./utils/config/validator";

import { GlobalFonts } from "@napi-rs/canvas";

GlobalFonts.registerFromPath("./assets/fonts/Inter-Bold.ttf", "InterBold");
GlobalFonts.registerFromPath("./assets/fonts/Inter-Medium.ttf", "InterMedium");
GlobalFonts.registerFromPath(
  "./assets/fonts/Inter-Regular.ttf",
  "InterRegular",
);
GlobalFonts.registerFromPath("./assets/fonts/Roboto-Bold.ttf", "RobotoBold");

import { BotClient } from "./structures/client";
const client = new BotClient();
client.connect();
client.register();
