import { startServer } from "./server.js";

(async () => {
  try {
    await startServer();
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
})();
