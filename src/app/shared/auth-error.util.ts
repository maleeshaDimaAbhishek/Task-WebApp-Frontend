interface HttpLikeError {
  status?: number;
  name?: string;
  message?: string;
  error?: unknown;
}

type AuthAction = 'login' | 'register';

export function getAuthErrorMessage(error: unknown, action: AuthAction): string {
  const err = (error ?? {}) as HttpLikeError;

  if (err.name === 'TimeoutError') {
    return action === 'login'
      ? 'Login request timed out. Please try again.'
      : 'Registration request timed out. Please try again.';
  }

  if (typeof err.message === 'string' && err.message.includes('JWT token not found')) {
    return 'Login succeeded but no JWT token was returned by backend.';
  }

  if (err.status === 0) {
    return 'Cannot reach backend service. Please check your server.';
  }

  const backendMessage = extractBackendMessage(err.error);

  if (action === 'login') {
    if (err.status === 401) return 'Invalid username or password.';
    if (err.status === 500) return backendMessage || 'Server error during sign in. Please try again.';
    return backendMessage || 'Sign in failed. Please try again.';
  }

  if (err.status === 400) return backendMessage || 'Invalid registration data. Please check your inputs.';
  if (err.status === 409) return backendMessage || 'Username or email already exists.';
  if (err.status === 500) return backendMessage || 'Server error during registration. Please try again.';
  return backendMessage || 'Unable to register. Please try again.';
}

function extractBackendMessage(payload: unknown): string | null {
  if (!payload) return null;

  if (typeof payload === 'string') {
    return payload.trim() || null;
  }

  if (typeof payload !== 'object') {
    return null;
  }

  const obj = payload as Record<string, unknown>;

  const preferredKeys = ['message', 'error', 'detail', 'title'];
  for (const key of preferredKeys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  const errors = obj['errors'];
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const msg = (first as Record<string, unknown>)['defaultMessage'];
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
    }
  }

  return null;
}
