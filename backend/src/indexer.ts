import { startIndexer } from "./services/indexer.service.js";

(async () => {
  try {
    console.log("🚀 Indexer starting...");
    await startIndexer();
  } catch (err) {
    console.error("Indexer crashed:", err);
    process.exit(1);
  }
})();
