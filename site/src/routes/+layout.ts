import type { LayoutServerData } from './$types';

export const prerender = true;
export const trailingSlash = 'always';

export const load = async ({ data }: { data: LayoutServerData }) => {
  return {
    contentActions: data.contentActions
  };
};
