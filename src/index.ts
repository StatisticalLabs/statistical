import "./utils/env";
import "./utils/config";

import { BotClient } from "./structures/client";
const client = new BotClient();
client.connect();
client.register();
