import { startServer } from "./server.js";
import { startIndexer } from "./indexer/core-indexer.js";

(async () => {
  try {
    await startServer();
    // run indexer in background
    startIndexer().catch((err) => {
      console.error("Indexer crashed:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
})();
