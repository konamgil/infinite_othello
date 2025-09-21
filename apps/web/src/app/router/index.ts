import { createBrowserRouter } from 'react-router-dom';

import { routeTree } from './routeTree';

/**
 * The main router for the application.
 *
 * This instance of `createBrowserRouter` is configured with the application's route tree.
 * The `routeTree` defines all the possible routes, their components, and any associated loaders or actions.
 * This `router` object is then used by the `RouterProvider` in the main `App` component to enable routing.
 */
export const router = createBrowserRouter(routeTree);
