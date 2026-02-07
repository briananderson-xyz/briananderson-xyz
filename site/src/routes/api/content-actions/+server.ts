import { loadContentActions } from '$lib/utils/content-loader';
import { json } from '@sveltejs/kit';

export async function GET() {
  const contentActions = await loadContentActions();
  return json(contentActions);
}
