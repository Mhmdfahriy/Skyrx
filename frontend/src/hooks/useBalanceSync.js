import { useEffect } from 'react';
import { useBalance } from '../context/BalanceContext';

/**
 * Hook untuk auto-sync balance setiap intervalMs
 * @param {number} intervalMs - Interval dalam millisecond (default: 3000ms)
 */
export const useBalanceSync = (intervalMs = 3000) => {
  const { fetchBalance } = useBalance();

  useEffect(() => {
    // Fetch balance saat component mount
    fetchBalance();

    // Setup polling setiap intervalMs
    const interval = setInterval(() => {
      fetchBalance();
    }, intervalMs);

    // Cleanup interval saat component unmount
    return () => clearInterval(interval);
  }, [fetchBalance, intervalMs]);
};