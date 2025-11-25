import { createContext, useContext, useState } from 'react';

const CardContext = createContext();

export function useCard() {
  return useContext(CardContext);
}

export function CardProvider({ children }) {
  const [card, setCard] = useState([]);

  const addToCard = (product) => {
    setCard(curr => {
      const exist = curr.find(item => item.id === product.id);
      if (exist) {
        return curr.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...curr, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    setCard(curr => 
      curr.map(item => item.id === id
        ? { ...item, quantity: qty < 1 ? 1 : qty }
        : item
      )
    );
  };

  const removeFromCard = (id) => {
    setCard(curr => curr.filter(item => item.id !== id));
  };

  const clearCard = () => setCard([]);

  return (
    <CardContext.Provider value={{ card, addToCard, removeFromCard, clearCard, updateQty }}>
      {children}
    </CardContext.Provider>
  );
}