import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
  const [userBalance, setUserBalance] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);

  const updateBalance = useCallback((newBalance) => {
    setUserBalance(newBalance);
    setLastUpdated(new Date());
  }, []);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await api.get('/user/balance');
      const balance = res.data.balance;
      updateBalance(balance);
      return balance;
    } catch (error) {
      console.error('Gagal fetch balance:', error);
      return null;
    }
  }, [updateBalance]);

  const addBalance = useCallback((amount) => {
    setUserBalance(prev => prev + amount);
    setLastUpdated(new Date());
  }, []);

  return (
    <BalanceContext.Provider value={{
      userBalance,
      lastUpdated,
      updateBalance,
      fetchBalance,
      addBalance
    }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance harus digunakan dalam BalanceProvider');
  }
  return context;
};