import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for declarative API calls that run on mount or when deps change.
 * @param {Function} apiFn - Async function returning { data } or similar payload
 * @param {Array} deps - Dependency array that triggers refetch
 * @returns {{ data, loading, error, refetch }}
 */
export function useApi(apiFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn();
      if (mountedRef.current) {
        setData(result?.data ?? result);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => { mountedRef.current = false; };
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

/**
 * Hook for imperative (on-demand) API calls — form submissions, mutations, etc.
 * @param {Function} apiFn - Async function accepting args
 * @returns {{ execute, data, loading, error, reset }}
 */
export function useApiCallback(apiFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      if (mountedRef.current) {
        setData(result?.data ?? result);
        setLoading(false);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'An error occurred');
        setLoading(false);
      }
      throw err;
    }
  }, [apiFn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { execute, data, loading, error, reset };
}
