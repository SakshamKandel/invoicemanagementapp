// Script to reset Firebase products with correct image paths and all available
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBQuVcC0POmWloPCQD2QkJhvRGNgNbpBao",
  authDomain: "peakbrew-modified.firebaseapp.com",
  projectId: "peakbrew-modified",
  storageBucket: "peakbrew-modified.firebasestorage.app",
  messagingSenderId: "152074649457",
  appId: "1:152074649457:web:b700837f48b641837b00d0",
  measurementId: "G-15YF3LDE0L"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = [
  {
    id: 1,
    name: 'Barahsinghe Pilsner',
    brand: 'Yak',
    size: '330ml',
    alcohol: '5%',
    unitsPerCase: 24,
    pricePerCase: 52,
    available: true,
    image: '/images/barahsinghe-pilsner.png',
    description: 'Premium Pilsner • 5%'
  },
  {
    id: 7,
    name: 'Barahsinghe Craft Pilsner Can',
    brand: 'Barahsinghe',
    size: '500ml',
    alcohol: '5%',
    unitsPerCase: 24,
    pricePerCase: 45,
    available: true,
    image: '/images/barahsinghe-craft-pilsner-can.webp',
    description: 'Craft Pilsner Can • 5%'
  },
  {
    id: 2,
    name: 'Barahsinghe Pilsner',
    brand: 'Yak',
    size: '650ml',
    alcohol: '5%',
    unitsPerCase: 12,
    pricePerCase: 52,
    available: true,
    image: '/images/Barahsinghe_pilsner_650ml-630x520-630x520.png',
    description: 'Premium Pilsner • 5%'
  },
  {
    id: 3,
    name: 'Barahsinghe Hazy IPA',
    brand: 'Yak',
    size: '330ml',
    alcohol: '5.5%',
    unitsPerCase: 24,
    pricePerCase: 55,
    available: true,
    image: '/images/barahsinghe-hazy.png',
    description: 'Hazy IPA • 5.5%'
  },
  {
    id: 4,
    name: 'Gorkha Premium',
    brand: 'Gorkha',
    size: '330ml',
    alcohol: '5%',
    unitsPerCase: 24,
    pricePerCase: 55,
    available: true,
    image: '/images/gorkha-premium.png',
    description: 'Premium Lager • 5%'
  },
  {
    id: 5,
    name: 'Gorkha Strong',
    brand: 'Gorkha',
    size: '500ml',
    alcohol: '6%',
    unitsPerCase: 12,
    pricePerCase: 55,
    available: true,
    image: '/images/gorkha-strong.png',
    description: 'Strong Beer • 6%'
  },
  {
    id: 6,
    name: 'Nepal Ice Premium',
    brand: 'Nepal Ice',
    size: '330ml',
    alcohol: '5.5%',
    unitsPerCase: 24,
    pricePerCase: 50,
    available: true,
    image: '/images/nepal-ice-premium.png',
    description: 'Premium Beer • 5.5%'
  },
  {
    id: 8,
    name: 'Arna',
    brand: 'Arna',
    size: '330ml',
    alcohol: '5%',
    unitsPerCase: 24,
    pricePerCase: 45,
    available: true,
    image: '/images/Arna.png',
    description: 'Premium Beer • 5%'
  }
];

async function resetProducts() {
  try {
    console.log('Starting Firebase products reset...');
    
    // Clear existing products
    const productsRef = collection(db, 'products');
    const existingProducts = await getDocs(productsRef);
    
    if (!existingProducts.empty) {
      const batch = writeBatch(db);
      existingProducts.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log('Cleared existing products');
    }
    
    // Add new products
    const batch = writeBatch(db);
    products.forEach((product) => {
      const productRef = doc(db, 'products', product.id.toString());
      batch.set(productRef, {
        ...product,
        updatedAt: new Date()
      });
    });
    
    await batch.commit();
    console.log('Successfully reset all products with correct image paths and availability');
    console.log('All 8 products are now available (including Barahsinghe Craft Pilsner Can)');
    
  } catch (error) {
    console.error('Error resetting products:', error);
  }
}

// Run the reset
resetProducts().then(() => {
  console.log('Reset complete');
  process.exit(0);
});