import { redirect, type LoaderFunction, type LoaderFunctionArgs } from 'react-router-dom';

import { getSupabase } from '../../services/supabase';

const DEFAULT_REDIRECT = '/';

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

export const protectedLoader = requireSession;
