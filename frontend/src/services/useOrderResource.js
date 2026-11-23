import { useEffect, useState } from 'react';
import { api } from './api';

export function useOrderResource(path, revision = 0) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    api(path, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setResult({ path, revision, data, error: '' }); })
      .catch(error => { if (!controller.signal.aborted) setResult({ path, revision, data: null, error: error.message }); });
    return () => controller.abort();
  }, [path, revision]);
  if (result?.path !== path || result?.revision !== revision) return { data: null, error: '', loading: true };
  return { data: result.data, error: result.error, loading: false };
}
