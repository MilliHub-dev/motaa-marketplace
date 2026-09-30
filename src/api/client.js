// The one HTTP client for the Motaa API.
//
//   const body = await api.get('/listings/buy/');   // parsed JSON body, e.g. { error, message, data }
//   await api.post('/wallet/deposit/', { reference });
//
// Every failure throws an ApiError whose `message` is safe to show to users:
// the server's own message when it sent one, otherwise a plain-English
// explanation of the status (offline, session expired, not found, ...).
import axios from 'axios';

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, kind = 'http' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;      // HTTP status, 0 when the request never got a response
    this.data = data;          // parsed response body, if any
    this.kind = kind;          // 'http' | 'network' | 'timeout' | 'cancelled'
  }

  get isNetworkError() { return this.kind === 'network' || this.kind === 'timeout'; }
  get isUnauthorized() { return this.status === 401; }
  get isNotFound() { return this.status === 404; }

  /** DRF field errors as { field: 'first message' } for form feedback. */
  get fieldErrors() {
    const source = this.data?.details || this.data?.errors || this.data;
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    const out = {};
    for (const [field, value] of Object.entries(source)) {
      if (['error', 'message', 'detail', 'status', 'data'].includes(field)) continue;
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === 'string') out[field] = first;
    }
    return out;
  }
}

const STATUS_MESSAGES = {
  400: 'Some of the details you entered need another look.',
  401: 'Your session has expired. Please log in again.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: 'That conflicts with something that already exists.',
  413: 'That file is too large to upload.',
  422: 'Some of the details you entered need another look.',
  429: "You're going a little fast. Please wait a moment and try again.",
};

function humanizeField(field) {
  return field.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/** Best readable message for a failed response body + status. */
export function readableMessage(status, data) {
  if (data && typeof data === 'object') {
    for (const key of ['message', 'detail', 'error']) {
      if (typeof data[key] === 'string' && data[key].trim()) return data[key];
    }
    const nonField = data.non_field_errors;
    if (Array.isArray(nonField) && typeof nonField[0] === 'string') return nonField[0];
    // DRF validation errors: { email: ["Enter a valid email address."] }
    const source = data.details && typeof data.details === 'object' ? data.details : data;
    for (const [field, value] of Object.entries(source)) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === 'string' && !['error', 'status'].includes(field)) return `${humanizeField(field)}: ${first}`;
    }
  }
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  return 'Something went wrong. Please try again.';
}

/** Turn anything thrown by a request into an ApiError. */
export function toApiError(error) {
  if (error instanceof ApiError) return error;
  if (axios.isCancel(error)) return new ApiError('Request cancelled.', { kind: 'cancelled' });
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return new ApiError('The server took too long to respond. Please try again.', { kind: 'timeout' });
  }
  if (error?.response) {
    const { status, data } = error.response;
    const body = typeof data === 'string' ? safeParse(data) : data;
    return new ApiError(readableMessage(status, body), { status, data: body });
  }
  if (error?.request || error?.message === 'Network Error') {
    return new ApiError("Can't reach Motaa right now. Check your internet connection and try again.", { kind: 'network' });
  }
  return new ApiError(error?.message || 'Something went wrong. Please try again.');
}

function safeParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

/**
 * @param {object} options
 * @param {string} options.baseURL
 * @param {() => string|undefined} options.getToken   current auth token (read on every request)
 * @param {(error: ApiError) => void} [options.onUnauthorized]   token rejected → log out
 * @param {(error: ApiError) => void} [options.onConnectionProblem]   offline / 5xx
 */
export function createApiClient({ baseURL, getToken, onUnauthorized, onConnectionProblem }) {
  const http = axios.create({ baseURL, timeout: 30000 });

  http.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) config.headers.Authorization = `Token ${token}`;
    // Pre-serialised JSON strings still need a JSON content type (objects and
    // FormData are detected by axios itself).
    if (typeof config.data === 'string' && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  });

  http.interceptors.response.use(
    (response) => {
      // Some endpoints answer 200 with { error: true, message }.
      const body = response.data;
      if (body && typeof body === 'object' && body.error === true) {
        throw new ApiError(readableMessage(response.status, body), { status: response.status, data: body });
      }
      return response;
    },
    (error) => {
      const apiError = toApiError(error);
      const sentToken = Boolean(error?.config?.headers?.Authorization);
      if (apiError.isUnauthorized && sentToken) onUnauthorized?.(apiError);
      if (apiError.isNetworkError || apiError.status >= 500) onConnectionProblem?.(apiError);
      throw apiError;
    }
  );

  const unwrap = (promise) => promise.then((response) => response.data ?? {});

  return {
    get: (url, config) => unwrap(http.get(url, config)),
    delete: (url, config) => unwrap(http.delete(url, config)),
    post: (url, body, config) => unwrap(http.post(url, body, config)),
    put: (url, body, config) => unwrap(http.put(url, body, config)),
    patch: (url, body, config) => unwrap(http.patch(url, body, config)),
    /** The underlying axios instance, for blobs/uploads that need the raw response. */
    http,
  };
}
