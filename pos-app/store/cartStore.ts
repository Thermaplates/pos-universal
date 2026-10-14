import { create } from 'zustand';

export type Addon = {
  name: string;
  price: number;
};

export type CartItem = {
  cart_item_id: string; // <-- INI KUNCI RAHASIANYA: ID unik untuk setiap baris di keranjang
  product_id: string;
  product_sku: string;
  product_name: string;
  selling_price: number;
  quantity: number;
  subtotal: number;
  note: string;        
  addons: Addon[];     
};

interface CartState {
  items: CartItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  grand_total: number;
  
  addToCart: (product: Omit<CartItem, 'cart_item_id' | 'quantity' | 'subtotal' | 'note' | 'addons'>) => void;
  removeFromCart: (cart_item_id: string) => void;
  updateQuantity: (cart_item_id: string, quantity: number) => void;
  updateItemOptions: (cart_item_id: string, note: string, addons: Addon[]) => void;
  clearCart: () => void;
}

const TAX_RATE = 0.11;
const calculateTotals = (items: CartItem[], discount: number) => {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const tax_amount = subtotal * TAX_RATE;
  const grand_total = subtotal + tax_amount - discount;
  return { subtotal, tax_amount, grand_total };
};

const calculateItemSubtotal = (price: number, qty: number, addons: Addon[] = []) => {
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  return (price + addonsTotal) * qty;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  tax_amount: 0,
  discount_amount: 0,
  grand_total: 0,

  addToCart: (product) => {
    const { items, discount_amount } = get();
    
    // CARI: Apakah ada produk yang SAMA PERSIS dan BELUM DIMODIFIKASI (note kosong, addon kosong)?
    const existingPlainItem = items.find(
      item => item.product_id === product.product_id && item.note === '' && item.addons.length === 0
    );

    let newItems;
    if (existingPlainItem) {
      // Jika ada yang polosan, tambahkan Qty-nya saja
      newItems = items.map(item =>
        item.cart_item_id === existingPlainItem.cart_item_id
          ? { 
              ...item, 
              quantity: item.quantity + 1, 
              subtotal: calculateItemSubtotal(item.selling_price, item.quantity + 1, item.addons)
            }
          : item
      );
    } else {
      // Jika tidak ada yang polosan (sudah diedit semua), BUAT BARIS BARU!
      newItems = [...items, { 
        ...product, 
        cart_item_id: Date.now().toString() + Math.random().toString(), // Generate ID baris unik
        quantity: 1, 
        subtotal: product.selling_price, 
        addons: [], 
        note: '' 
      }];
    }

    set({ items: newItems, ...calculateTotals(newItems, discount_amount) });
  },

  removeFromCart: (cart_item_id) => {
    const { items, discount_amount } = get();
    // Hapus berdasarkan cart_item_id, BUKAN product_id
    const newItems = items.filter(item => item.cart_item_id !== cart_item_id);
    set({ items: newItems, ...calculateTotals(newItems, discount_amount) });
  },

  updateQuantity: (cart_item_id, quantity) => {
    if (quantity <= 0) return get().removeFromCart(cart_item_id);
    
    const { items, discount_amount } = get();
    const newItems = items.map(item =>
      item.cart_item_id === cart_item_id
        ? { ...item, quantity, subtotal: calculateItemSubtotal(item.selling_price, quantity, item.addons) }
        : item
    );
    set({ items: newItems, ...calculateTotals(newItems, discount_amount) });
  },

  updateItemOptions: (cart_item_id, note, addons) => {
    const { items, discount_amount } = get();
    const newItems = items.map(item =>
      item.cart_item_id === cart_item_id
        ? { ...item, note, addons, subtotal: calculateItemSubtotal(item.selling_price, item.quantity, addons) }
        : item
    );
    set({ items: newItems, ...calculateTotals(newItems, discount_amount) });
  },

  clearCart: () => {
    set({ items: [], subtotal: 0, tax_amount: 0, discount_amount: 0, grand_total: 0 });
  }
}));