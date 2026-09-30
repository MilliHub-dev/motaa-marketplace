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

/**
 * @param {(api, signal, { useCache: boolean }) => Promise<any>} fetcher
 * @param {any[]} deps   re-fetch when these change
 * @param {{ enabled?: boolean, select?: (body) => any, initialData?: any }} [options]
 * @returns {{ data, error, loading, reload, setData }}
 */
export function useApiQuery(fetcher, deps = [], { enabled = true, select, initialData } = {}) {
  const { api } = useContext(GlobalStore);
  const [data, setData] = useState(initialData);
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
    setLoading(true);
    setError(null);
    try {
      const body = await fetcherRef.current(api, controller.signal, { useCache });
      if (id !== requestId.current) return;
      setData(selectRef.current ? selectRef.current(body) : body);
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
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const mutate = useCallback(async (...args) => {
    const { successMessage, errorTitle, onSuccess, onError, notifyOnError = true } = optionsRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await action(api, ...args);
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
