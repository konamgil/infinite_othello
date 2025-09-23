import React from 'react';
import { RouterProvider } from 'react-router-dom';

import { router } from './router';

/**
 * The main application component.
 *
 * This component sets up the routing for the application using `react-router-dom`.
 * It renders the `RouterProvider` component, passing it the application's router configuration.
 *
 * @returns {React.ReactElement} The rendered `RouterProvider` component.
 */
export function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
