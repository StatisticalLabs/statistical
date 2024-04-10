import { event } from "../structures/event";

export default event("error", (_, err) => console.error(err));
