import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  onSnapshot,
  writeBatch 
} from 'firebase/firestore';

// Collections
const CART_COLLECTION = 'cart';
const PRODUCTS_COLLECTION = 'products';

// Cart Management
export const saveCartToFirebase = async (cartItems) => {
  try {
    const cartRef = doc(db, CART_COLLECTION, 'user-cart');
    await setDoc(cartRef, {
      items: cartItems,
      updatedAt: new Date()
    });
    console.log('Cart saved to Firebase');
  } catch (error) {
    console.error('Error saving cart to Firebase:', error);
  }
};

export const loadCartFromFirebase = async () => {
  try {
    const cartRef = doc(db, CART_COLLECTION, 'user-cart');
    const cartSnap = await getDoc(cartRef);
    
    if (cartSnap.exists()) {
      const data = cartSnap.data();
      console.log('Cart loaded from Firebase:', data.items);
      return data.items || [];
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
    await setDoc(cartRef, {
      items: [],
      updatedAt: new Date()
    });
    console.log('Cart cleared in Firebase');
  } catch (error) {
    console.error('Error clearing cart in Firebase:', error);
  }
};

// Product Stock Management
export const saveProductsToFirebase = async (products, shouldClearFirst = false) => {
  try {
    const batch = writeBatch(db);
    
    // Only clear existing products if explicitly requested
    if (shouldClearFirst) {
      const existingProducts = await getDocs(collection(db, PRODUCTS_COLLECTION));
      existingProducts.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }
    
    // Add/update products
    products.forEach((product) => {
      const productRef = doc(db, PRODUCTS_COLLECTION, product.id.toString());
      batch.set(productRef, {
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
        updatedAt: new Date()
      });
    });
    
    await batch.commit();
    console.log('Products saved to Firebase:', products.length, 'products');
  } catch (error) {
    console.error('Error saving products to Firebase:', error);
  }
};

export const loadProductsFromFirebase = async () => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const productsSnap = await getDocs(productsRef);
    
    if (!productsSnap.empty) {
      const products = productsSnap.docs.map(doc => ({
        ...doc.data(),
        id: parseInt(doc.id)
      }));
      
      // Remove any potential duplicates based on ID (shouldn't happen but safety check)
      const uniqueProducts = products.filter((product, index, self) => 
        index === self.findIndex(p => p.id === product.id)
      );
      
      // Sort by ID to maintain consistent order
      uniqueProducts.sort((a, b) => a.id - b.id);
      
      console.log('Products loaded from Firebase:', uniqueProducts.length, 'unique products');
      if (products.length !== uniqueProducts.length) {
        console.warn('Removed', products.length - uniqueProducts.length, 'duplicate products');
      }
      
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

export const clearAllProductsFromFirebase = async () => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const productsSnap = await getDocs(productsRef);
    
    console.log('Clearing', productsSnap.docs.length, 'products from Firebase');
    
    const batch = writeBatch(db);
    productsSnap.forEach((doc) => {
      console.log('Deleting product:', doc.id, doc.data().name);
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log('All products cleared from Firebase');
  } catch (error) {
    console.error('Error clearing products from Firebase:', error);
  }
};

export const debugFirebaseProducts = async () => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const productsSnap = await getDocs(productsRef);
    
    console.log('=== FIREBASE PRODUCTS DEBUG ===');
    console.log('Total documents in Firebase:', productsSnap.docs.length);
    
    productsSnap.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ID: ${doc.id}, Name: ${data.name}, Size: ${data.size}, Brand: ${data.brand}`);
    });
    console.log('=== END DEBUG ===');
    
    return productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error debugging Firebase products:', error);
    return [];
  }
};

export const updateProductStockInFirebase = async (productId, available) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId.toString());
    
    // Check if document exists first
    const docSnap = await getDoc(productRef);
    if (!docSnap.exists()) {
      console.error(`Product ${productId} does not exist in Firebase`);
      return false;
    }
    
    await updateDoc(productRef, {
      available: available,
      updatedAt: new Date()
    });
    
    console.log(`✅ Product ${productId} stock updated to ${available ? 'available' : 'unavailable'} in Firebase`);
    
    // Verify the update
    const updatedDoc = await getDoc(productRef);
    const updatedData = updatedDoc.data();
    console.log(`🔍 Verification: Product ${productId} is now ${updatedData.available ? 'available' : 'unavailable'}`);
    
    return true;
  } catch (error) {
    console.error('Error updating product stock in Firebase:', error);
    return false;
  }
};

// Real-time listeners
export const subscribeToCart = (callback) => {
  const cartRef = doc(db, CART_COLLECTION, 'user-cart');
  return onSnapshot(cartRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.items || []);
    } else {
      callback([]);
    }
  });
};

export const subscribeToProducts = (callback) => {
  const productsRef = collection(db, PRODUCTS_COLLECTION);
  return onSnapshot(productsRef, (snapshot) => {
    if (!snapshot.empty) {
      const products = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: parseInt(doc.id)
      }));
      callback(products);
    }
  });
};