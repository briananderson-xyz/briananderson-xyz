import historyData from "../../../content/ai-eval-history.json";
import { parseAiEvalHistory } from "$lib/schemas/aiEvalHistory";

export const prerender = true;

export const load = () => ({ history: parseAiEvalHistory(historyData) });
