import { loadContentActions } from '$lib/utils/content-loader';
import type { QuickAction } from '$lib/types';

export const prerender = true;

export const load = async () => {
	const contentActions: QuickAction[] = await loadContentActions();
	
	return {
		contentActions
	};
};
