import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, Product } from '../types';

const CART_STORAGE_KEY = 'jajan_salosa_cart_v1';

interface CartActionResult {
  ok: boolean;
  message?: string;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => CartActionResult;
  updateQuantity: (productId: string, quantity: number) => CartActionResult;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  syncCartWithProducts: (latestProducts: Product[]) => void;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is CartItem =>
        Boolean(entry?.product?.id) &&
        typeof entry.quantity === 'number' &&
        entry.quantity > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Abaikan jika penyimpanan browser penuh
    }
  }, [items]);

  const addItem = useCallback(
    (product: Product, quantity = 1): CartActionResult => {
      if (!product.is_active) {
        return { ok: false, message: 'Produk sedang tidak tersedia.' };
      }
      if (product.stock <= 0) {
        return { ok: false, message: 'Stok produk sedang habis.' };
      }

      const safeQty = Math.max(1, Math.floor(quantity));
      const existing = items.find((item) => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const nextQty = currentQty + safeQty;

      if (nextQty > product.stock) {
        return {
          ok: false,
          message: `Maksimal pembelian ${product.stock} pcs sesuai stok tersedia.`,
        };
      }

      setItems((prev) => {
        const index = prev.findIndex((entry) => entry.product.id === product.id);
        if (index === -1) {
          return [...prev, { product, quantity: safeQty }];
        }
        return prev.map((entry) =>
          entry.product.id === product.id
            ? { product, quantity: entry.quantity + safeQty }
            : entry
        );
      });

      return { ok: true };
    },
    [items]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number): CartActionResult => {
      const target = items.find((entry) => entry.product.id === productId);
      if (!target) return { ok: false, message: 'Produk tidak ada di keranjang.' };

      if (quantity <= 0) {
        setItems((prev) => prev.filter((entry) => entry.product.id !== productId));
        return { ok: true };
      }

      if (quantity > target.product.stock) {
        return {
          ok: false,
          message: `Stok "${target.product.name}" tersisa ${target.product.stock} pcs.`,
        };
      }

      setItems((prev) =>
        prev.map((entry) =>
          entry.product.id === productId ? { ...entry, quantity } : entry
        )
      );
      return { ok: true };
    },
    [items]
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((entry) => entry.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const syncCartWithProducts = useCallback((latestProducts: Product[]) => {
    if (latestProducts.length === 0) return;
    const productMap = new Map(latestProducts.map((p) => [p.id, p]));

    setItems((prev) => {
      let changed = false;
      const next: CartItem[] = [];

      for (const entry of prev) {
        const fresh = productMap.get(entry.product.id);
        if (!fresh || !fresh.is_active || fresh.stock <= 0) {
          changed = true;
          continue;
        }
        const clampedQty = Math.min(entry.quantity, fresh.stock);
        if (
          clampedQty !== entry.quantity ||
          fresh.price !== entry.product.price ||
          fresh.stock !== entry.product.stock ||
          fresh.name !== entry.product.name ||
          fresh.image_url !== entry.product.image_url
        ) {
          changed = true;
        }
        next.push({ product: fresh, quantity: clampedQty });
      }

      return changed ? next : prev;
    });
  }, []);

  const getItemQuantity = useCallback(
    (productId: string) => {
      return items.find((entry) => entry.product.id === productId)?.quantity ?? 0;
    },
    [items]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, entry) => sum + entry.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, entry) => sum + entry.product.price * entry.quantity,
        0
      ),
    [items]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalItems,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      syncCartWithProducts,
      getItemQuantity,
    }),
    [
      items,
      totalItems,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      syncCartWithProducts,
      getItemQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart harus digunakan di dalam CartProvider');
  }
  return ctx;
}
