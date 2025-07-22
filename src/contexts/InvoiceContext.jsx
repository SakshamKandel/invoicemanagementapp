import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  saveCartToFirebase, 
  loadCartFromFirebase, 
  clearCartInFirebase 
} from '../services/firebaseService';

const InvoiceContext = createContext();

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
};

export const InvoiceProvider = ({ children }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from Firebase on component mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const cartItems = await loadCartFromFirebase();
        setSelectedItems(cartItems);
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, []);

  // Save cart to Firebase whenever selectedItems changes
  useEffect(() => {
    if (!isLoading && selectedItems.length >= 0) {
      saveCartToFirebase(selectedItems);
    }
  }, [selectedItems, isLoading]);

  const addItem = (product) => {
    if (!product.available) return;
    
    const existingItem = selectedItems.find(item => item.id === product.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { 
        ...product, 
        quantity: 1,
        originalPrice: product.pricePerCase 
      }]);
    }
  };

  const removeItem = (productId) => {
    setSelectedItems(selectedItems.filter(item => item.id !== productId));
  };

  const updateItemQuantity = (productId, quantity, customPrice) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setSelectedItems(selectedItems.map(item =>
      item.id === productId
        ? { 
            ...item, 
            quantity: parseInt(quantity),
            ...(customPrice !== undefined && { customPrice: customPrice })
          }
        : item
    ));
  };

  const clearItems = async () => {
    setSelectedItems([]);
    await clearCartInFirebase();
  };

  const openCreateInvoice = (navigationCallback = null) => {
    // Allow creating invoices even without pre-selected items
    // Users can add products directly in the create invoice modal
    setPendingNavigation(navigationCallback);
    setIsCreateInvoiceOpen(true);
    return true;
  };

  const closeCreateInvoice = () => {
    setIsCreateInvoiceOpen(false);
    setPendingNavigation(null);
  };

  const getTotalAmount = () => {
    return selectedItems.reduce((total, item) => {
      const price = item.customPrice !== undefined ? item.customPrice : item.pricePerCase;
      return total + (price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return selectedItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getFormattedItems = () => {
    return selectedItems.map(item => {
      const price = item.customPrice !== undefined ? item.customPrice : item.pricePerCase;
      return {
        id: `invoice-item-${item.id}-${Date.now()}`,
        productId: item.id,
        name: item.name,
        description: `${item.brand} - ${item.size} (${item.unitsPerCase} units per case)`,
        quantity: item.quantity,
        price: price,
        total: item.quantity * price
      };
    });
  };

  // Execute pending navigation when modal opens
  useEffect(() => {
    if (isCreateInvoiceOpen && pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  }, [isCreateInvoiceOpen, pendingNavigation]);

  const value = {
    selectedItems,
    addItem,
    removeItem,
    updateItemQuantity,
    clearItems,
    isCreateInvoiceOpen,
    openCreateInvoice,
    closeCreateInvoice,
    getTotalAmount,
    getTotalItems,
    getFormattedItems
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};