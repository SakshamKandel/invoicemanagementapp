import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';

// In-memory cache to reduce reads
class FirestoreCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  set(key, data) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() - timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  invalidate(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }
}

const cache = new FirestoreCache();

// Collections
const CART_COLLECTION = 'cart';
const PRODUCTS_COLLECTION = 'products';
const CUSTOMERS_COLLECTION = 'customers';
const INVOICES_COLLECTION = 'invoices';

// Optimized Cart Management
export const saveCartToFirebase = async (cartItems) => {
  try {
    // Only save if cart has actually changed
    const cacheKey = 'user-cart';
    const cachedCart = cache.get(cacheKey);
    
    if (cachedCart && JSON.stringify(cachedCart) === JSON.stringify(cartItems)) {
      console.log('Cart unchanged, skipping write');
      return;
    }

    const cartRef = doc(db, CART_COLLECTION, 'user-cart');
    const cartData = {
      items: cartItems,
      updatedAt: serverTimestamp(),
      itemCount: cartItems.length,
      totalValue: cartItems.reduce((sum, item) => sum + ((item.customPrice || item.pricePerCase) * item.quantity), 0)
    };
    
    await setDoc(cartRef, cartData);
    cache.set(cacheKey, cartItems);
    console.log('Cart saved to Firebase (optimized)');
  } catch (error) {
    console.error('Error saving cart to Firebase:', error);
  }
};

export const loadCartFromFirebase = async () => {
  try {
    const cacheKey = 'user-cart';
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Cart loaded from cache');
      return cached;
    }

    const cartRef = doc(db, CART_COLLECTION, 'user-cart');
    const cartSnap = await getDoc(cartRef);
    
    if (cartSnap.exists()) {
      const data = cartSnap.data();
      const items = data.items || [];
      cache.set(cacheKey, items);
      console.log('Cart loaded from Firebase');
      return items;
    } else {
      console.log('No cart found in Firebase');
      return [];
    }
  } catch (error) {
    console.error('Error loading cart from Firebase:', error);
    return [];
  }
};

export const clearCartInFirebase = async () => {
  try {
    const cartRef = doc(db, CART_COLLECTION, 'user-cart');
    await updateDoc(cartRef, {
      items: [],
      updatedAt: serverTimestamp(),
      itemCount: 0,
      totalValue: 0
    });
    cache.invalidate('user-cart');
    console.log('Cart cleared in Firebase');
  } catch (error) {
    console.error('Error clearing cart in Firebase:', error);
  }
};

// Optimized Product Stock Management with Batching
export const saveProductsToFirebase = async (products, shouldClearFirst = false) => {
  try {
    const batch = writeBatch(db);
    
    if (shouldClearFirst) {
      // More efficient: only delete what needs to be deleted
      const existingProducts = await getDocs(collection(db, PRODUCTS_COLLECTION));
      existingProducts.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
    }
    
    // Optimize product data structure
    products.forEach((product) => {
      const productRef = doc(db, PRODUCTS_COLLECTION, product.id.toString());
      const optimizedProduct = {
        id: product.id,
        name: product.name,
        brand: product.brand,
        size: product.size,
        alcohol: product.alcohol,
        unitsPerCase: product.unitsPerCase,
        pricePerCase: product.pricePerCase,
        available: product.available,
        image: product.image,
        description: product.description,
        updatedAt: serverTimestamp()
      };
      
      batch.set(productRef, optimizedProduct);
    });
    
    await batch.commit();
    cache.invalidate('products');
    console.log('Products saved to Firebase (batch optimized):', products.length, 'products');
  } catch (error) {
    console.error('Error saving products to Firebase:', error);
  }
};

export const loadProductsFromFirebase = async () => {
  try {
    const cacheKey = 'products';
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Products loaded from cache');
      return cached;
    }

    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const productsSnap = await getDocs(productsRef);
    
    if (!productsSnap.empty) {
      const products = productsSnap.docs.map(doc => ({
        ...doc.data(),
        id: parseInt(doc.id)
      }));
      
      const uniqueProducts = products.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );
      
      uniqueProducts.sort((a, b) => a.id - b.id);
      
      cache.set(cacheKey, uniqueProducts);
      console.log('Products loaded from Firebase:', uniqueProducts.length, 'products');
      return uniqueProducts;
    } else {
      console.log('No products found in Firebase');
      return null;
    }
  } catch (error) {
    console.error('Error loading products from Firebase:', error);
    return null;
  }
};

// Optimized single product stock update
export const updateProductStockInFirebase = async (productId, available) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId.toString());
    
    // Only update the fields that changed
    await updateDoc(productRef, {
      available: available,
      updatedAt: serverTimestamp()
    });
    
    // Update cache
    const cacheKey = 'products';
    const cachedProducts = cache.get(cacheKey);
    if (cachedProducts) {
      const updatedProducts = cachedProducts.map(p => 
        p.id === productId ? { ...p, available } : p
      );
      cache.set(cacheKey, updatedProducts);
    }
    
    console.log(`Product ${productId} stock updated (optimized)`);
    return true;
  } catch (error) {
    console.error('Error updating product stock:', error);
    return false;
  }
};

// Optimized Customer Management
export const saveCustomerOptimized = async (customerData, customerId = null) => {
  try {
    const timestamp = serverTimestamp();
    
    if (customerId) {
      // Update existing customer - only update changed fields
      const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      await updateDoc(customerRef, {
        ...customerData,
        updatedAt: timestamp
      });
    } else {
      // Create new customer
      const customerRef = doc(collection(db, CUSTOMERS_COLLECTION));
      await setDoc(customerRef, {
        ...customerData,
        createdAt: timestamp,
        updatedAt: timestamp
      });
      customerId = customerRef.id;
    }
    
    cache.invalidate('customers');
    return customerId;
  } catch (error) {
    console.error('Error saving customer:', error);
    throw error;
  }
};

// Paginated customer loading
export const loadCustomersPaginated = async (pageSize = 20, lastDoc = null) => {
  try {
    const cacheKey = `customers-page-${lastDoc?.id || 'first'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Customers page loaded from cache');
      return cached;
    }

    let q = query(
      collection(db, CUSTOMERS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _doc: doc // Store document reference for pagination
    }));

    const result = {
      customers,
      hasMore: customers.length === pageSize,
      lastDoc: customers.length > 0 ? customers[customers.length - 1]._doc : null
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error loading customers:', error);
    throw error;
  }
};

// Optimized Invoice Management
export const saveInvoiceOptimized = async (invoiceData) => {
  try {
    const invoiceRef = doc(collection(db, INVOICES_COLLECTION));
    
    // Optimize invoice data structure
    const optimizedInvoice = {
      ...invoiceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Add computed fields to avoid calculations on read
      itemCount: invoiceData.items?.length || 0,
      customerNameLower: invoiceData.customerName?.toLowerCase() || '',
      invoiceNumberLower: invoiceData.invoiceNumber?.toLowerCase() || '',
      // Add indexes for common queries
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
      status: invoiceData.status || 'draft'
    };

    await setDoc(invoiceRef, optimizedInvoice);
    cache.invalidate('invoices');
    
    console.log('Invoice saved (optimized)');
    return invoiceRef;
  } catch (error) {
    console.error('Error saving invoice:', error);
    throw error;
  }
};

// Paginated and filtered invoice loading
export const loadInvoicesOptimized = async (filters = {}, pageSize = 10, lastDoc = null) => {
  try {
    const { status, year, month, searchTerm } = filters;
    const cacheKey = `invoices-${JSON.stringify(filters)}-${lastDoc?.id || 'first'}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Invoices loaded from cache');
      return cached;
    }

    let q = query(
      collection(db, INVOICES_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    // Add filters to reduce read operations
    if (status && status !== 'all') {
      q = query(q, where('status', '==', status));
    }
    
    if (year) {
      q = query(q, where('year', '==', year));
    }
    
    if (month !== undefined) {
      q = query(q, where('month', '==', month));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    let invoices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _doc: doc
    }));

    // Client-side filtering for search (only on current page)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      invoices = invoices.filter(invoice =>
        invoice.customerNameLower?.includes(searchLower) ||
        invoice.invoiceNumberLower?.includes(searchLower)
      );
    }

    const result = {
      invoices,
      hasMore: snapshot.docs.length === pageSize,
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
    };

    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error loading invoices:', error);
    throw error;
  }
};

// Batch operations for multiple updates
export const batchUpdateInvoiceStatus = async (invoiceIds, newStatus) => {
  try {
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    
    invoiceIds.forEach(invoiceId => {
      const invoiceRef = doc(db, INVOICES_COLLECTION, invoiceId);
      batch.update(invoiceRef, {
        status: newStatus,
        updatedAt: timestamp
      });
    });
    
    await batch.commit();
    cache.clear(); // Clear all cache after batch operations
    console.log(`Batch updated ${invoiceIds.length} invoices`);
  } catch (error) {
    console.error('Error in batch update:', error);
    throw error;
  }
};

// Optimized real-time listeners with debouncing
const activeListeners = new Map();

export const subscribeToCollectionOptimized = (collectionName, callback, options = {}) => {
  const { filters = {}, debounceMs = 1000 } = options;
  const listenerKey = `${collectionName}-${JSON.stringify(filters)}`;
  
  // Reuse existing listener if same parameters
  if (activeListeners.has(listenerKey)) {
    console.log('Reusing existing listener for', listenerKey);
    return activeListeners.get(listenerKey);
  }
  
  let q = collection(db, collectionName);
  
  // Apply filters to reduce data transfer
  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters.limit) {
    q = query(q, limit(filters.limit));
  }
  
  // Debounce callback to reduce UI updates
  let debounceTimer;
  const debouncedCallback = (snapshot) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(data);
    }, debounceMs);
  };
  
  const unsubscribe = onSnapshot(q, debouncedCallback, (error) => {
    console.error(`Error in ${collectionName} listener:`, error);
  });
  
  const wrappedUnsubscribe = () => {
    activeListeners.delete(listenerKey);
    clearTimeout(debounceTimer);
    unsubscribe();
  };
  
  activeListeners.set(listenerKey, wrappedUnsubscribe);
  return wrappedUnsubscribe;
};

// Offline support utilities
export const enableOfflineSupport = () => {
  try {
    enableNetwork(db);
    console.log('Offline support enabled');
  } catch (error) {
    console.error('Error enabling offline support:', error);
  }
};

export const disableOfflineSupport = () => {
  try {
    disableNetwork(db);
    console.log('Offline support disabled');
  } catch (error) {
    console.error('Error disabling offline support:', error);
  }
};

// Utility to clear all caches
export const clearAllCaches = () => {
  cache.clear();
  console.log('All caches cleared');
};

// Analytics and monitoring
export const getFirestoreStats = () => {
  return {
    cacheSize: cache.cache.size,
    activeListeners: activeListeners.size,
    cacheKeys: Array.from(cache.cache.keys())
  };
};

// Note: All functions are already exported individually above
// No need for duplicate exports for backward compatibility