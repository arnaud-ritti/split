import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // The landing page is static apart from the locally stored history, so it prerenders.
  { path: '', renderMode: RenderMode.Prerender },
  // A group page is nothing but live API data keyed by an id the server cannot enumerate.
  { path: '**', renderMode: RenderMode.Client },
];
