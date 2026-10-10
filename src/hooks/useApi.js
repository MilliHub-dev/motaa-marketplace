// Data-loading hooks built on the API client in App's GlobalStore.
//
// Loading a resource:
//   const listings = useApiQuery((api) => api.get('/listings/buy/'), [], { select: (body) => body.data });
//   <AsyncState query={listings} isEmpty={(d) => !d?.results?.length} ...>{(data) => ...}</AsyncState>
//
// Running an action:
//   const save = useApiMutation((api, payload) => api.post('/admin/dealership/settings/', payload), {
//     successMessage: 'Settings saved',
//   });
//   <Button isLoading={save.loading} onClick={() => save.mutate(form)}>Save</Button>
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalStore } from '../App';
import { toApiError } from '../api/client';

// What each `keepAs` query last showed, so coming back to a page shows it straight away
// (and refreshes it behind the scenes) instead of a loading placeholder. Cleared on log in/out.
const lastShown = new Map();
const LAST_SHOWN_MAX = 80;

export function forgetShownData() {
  lastShown.clear();
}

function remember(key, value) {
  lastShown.delete(key);
  lastShown.set(key, value);
  if (lastShown.size > LAST_SHOWN_MAX) lastShown.delete(lastShown.keys().next().value);
}

/**
 * @param {(api, signal, { useCache: boolean }) => Promise<any>} fetcher
 * @param {any[]} deps   re-fetch when these change
 * @param {{ enabled?: boolean, select?: (body) => any, initialData?: any, keepAs?: string }} [options]
 *   keepAs: a name for this exact request (include its filters). The last result is shown at once
 *   the next time the same request is made, while a fresh copy loads.
 * @returns {{ data, error, loading, reload, setData }}
 */
export function useApiQuery(fetcher, deps = [], { enabled = true, select, initialData, keepAs } = {}) {
  const { api } = useContext(GlobalStore);
  const [data, setData] = useState(() => (keepAs && lastShown.has(keepAs) ? lastShown.get(keepAs) : initialData));
  const keepAsRef = useRef(keepAs);
  keepAsRef.current = keepAs;
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const requestId = useRef(0);
  const controllerRef = useRef(null);
  const fetcherRef = useRef(fetcher);
  const selectRef = useRef(select);
  fetcherRef.current = fetcher;
  selectRef.current = select;

  const reload = useCallback(async ({ useCache = false } = {}) => {
    const id = ++requestId.current;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const key = keepAsRef.current;
    // a request we have answered before: show that answer while the fresh one loads
    if (key && lastShown.has(key)) setData(lastShown.get(key));
    setLoading(true);
    setError(null);
    try {
      const body = await fetcherRef.current(api, controller.signal, { useCache });
      if (id !== requestId.current) return;
      const value = selectRef.current ? selectRef.current(body) : body;
      if (key) remember(key, value);
      setData(value);
    } catch (err) {
      if (id !== requestId.current) return;
      const apiError = toApiError(err);
      if (apiError.kind !== 'cancelled') setError(apiError);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, ...deps]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }
    reload({ useCache: true });
    // cancel and ignore requests that are superseded or unmounted
    return () => {
      requestId.current++;
      controllerRef.current?.abort();
    };
  }, [reload, enabled]);

  return { data, error, loading, reload, setData };
}

/**
 * @param {(api, ...args) => Promise<any>} action
 * @param {{ successMessage?: string|((result) => string), errorTitle?: string, onSuccess?: (result, ...args) => void, onError?: (error) => void, notifyOnError?: boolean }} [options]
 * @returns {{ mutate: (...args) => Promise<any>, loading: boolean, error }}
 *   mutate resolves with the response body, or undefined when it failed (the error is shown as a toast).
 */
export function useApiMutation(action, options = {}) {
  const { api, notify, notifyError } = useContext(GlobalStore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // always call the latest action/options: they usually close over state that
  // loaded after the first render (a stale copy would act on missing data)
  const actionRef = useRef(action);
  actionRef.current = action;
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true; // effects re-run in StrictMode: don't stay "unmounted"
    return () => { mounted.current = false; };
  }, []);

  const mutate = useCallback(async (...args) => {
    const { successMessage, errorTitle, onSuccess, onError, notifyOnError = true } = optionsRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await actionRef.current(api, ...args);
      if (successMessage) {
        const body = typeof successMessage === 'function' ? successMessage(result) : successMessage;
        notify({ title: 'Success', body });
      }
      onSuccess?.(result, ...args);
      return result;
    } catch (err) {
      const apiError = toApiError(err);
      if (mounted.current) setError(apiError);
      // offline/5xx already produced a connection toast from the client
      if (notifyOnError && !apiError.isNetworkError && apiError.status < 500) notifyError(apiError, errorTitle);
      onError?.(apiError);
      return undefined;
    } finally {
      if (mounted.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  return { mutate, loading, error };
}
