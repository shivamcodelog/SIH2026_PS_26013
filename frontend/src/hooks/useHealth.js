import { useState, useEffect } from 'react';
import { checkNodeHealth } from '../api/client';

export function useHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    checkNodeHealth().then((data) => {
      if (isMounted) {
        setHealth(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return { health, loading };
}
