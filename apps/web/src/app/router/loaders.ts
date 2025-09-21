import { redirect, type LoaderFunction, type LoaderFunctionArgs } from 'react-router-dom';

import { getSupabase } from '../../services/supabase';

const DEFAULT_REDIRECT = '/';

/**
 * A loader function for `react-router-dom` that requires an active user session.
 *
 * This function checks for a valid session using Supabase authentication.
 * If the session exists, it returns the session data.
 * If there is no session or an error occurs while fetching it, the user is redirected
 * to the default path ('/').
 * It also handles request cancellation by checking `request.signal.aborted`.
 *
 * This loader can be used to protect routes that should only be accessible to authenticated users.
 *
 * @param {LoaderFunctionArgs} args - The arguments provided by `react-router-dom`, including the request object.
 * @returns {Promise<Session | Response>} A promise that resolves with the session object or a redirect response.
 * @throws {Error} If the request is aborted.
 * @throws {Response} A redirect response if the session is not available.
 */
export const requireSession: LoaderFunction = async ({ request }: LoaderFunctionArgs) => {
  const supabase = getSupabase();

  if (request.signal.aborted) {
    throw new Error('요청이 취소되었습니다.');
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Failed to resolve session:', error);
    throw redirect(DEFAULT_REDIRECT);
  }

  if (!data.session) {
    throw redirect(DEFAULT_REDIRECT);
  }

  return data.session;
};

/**
 * An alias for the `requireSession` loader.
 * This can be used to give a more semantic name to the loader when used in route definitions.
 *
 * @see requireSession
 */
export const protectedLoader = requireSession;
