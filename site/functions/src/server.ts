/** Cloud Run/local-development process entry point. */
import { createApp } from "./app.js";

const PORT = process.env.PORT || 8080;

createApp().listen(PORT, () => {
  console.log(
    `API server listening on port ${PORT} (target: ${process.env.FUNCTION_TARGET || "chat"})`
  );
});
