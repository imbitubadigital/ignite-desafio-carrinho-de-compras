import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`products/${productId}`);
      const product = response.data;
      const itemCard = cart.find(item => item.id === product.id);
      if(itemCard){
        const checkStock = await api.get(`stock/${productId}`);
        const newAmount = itemCard.amount + 1;

        if(checkStock.data.amount < newAmount){
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          const upCart = cart.map(product => {
            if(product.id === productId ) {
              return {
                ...product,
                amount: newAmount
              }
            }
            return product;
          });
          setCart(upCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(upCart))
        }
      } else {
        const upCart = [...cart, {...product, amount: 1}]
        setCart(upCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(upCart))
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const isProductCart = cart.findIndex(product => product.id === productId);

      if(isProductCart < 0){
        toast.error('Erro na remoção do produto');
      } else {
        const upCart = cart.filter(product => product.id !== productId);
        setCart(upCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(upCart));
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {
      const isProductCart = cart.findIndex(product => product.id === productId);
      if(isProductCart < 0){
        toast.error('Erro na alteração de quantidade do produto');
      } else {
        const checkStock = await api.get(`stock/${productId}`);
        if(checkStock.data.amount < amount){
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          const upCart = cart.map(product => {
            if(product.id === productId ) {
              return {
                ...product,
                amount
              }
            }
            return product;
          });

          setCart(upCart);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(upCart))
        }
      }
    } catch {
      toast.error('Quantidade solicitada fora de estoque');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
