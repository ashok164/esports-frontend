export const AUTH_TOKEN_KEY = "tournament_auth_token";
export const AUTH_USER_KEY = "tournament_auth_user";

export type AuthUser = {
  id?: string | number;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  tournaments?: Array<{
    id?: string | number;
    name?: string;
    slug?: string;
    domain?: string;
    role?: string;
  }>;
};

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const getAuthUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem(AUTH_USER_KEY);

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    return null;
  }
};

export const saveAuthUser = (user: AuthUser) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const saveAuthSession = (token: string, user?: AuthUser) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);

  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

export const isAuthenticated = () => Boolean(getAuthToken());
