import barahsinghePilsnerImg from '../assets/Barahsinghe_pilsner_650ml-630x520-630x520.png';
import barahsingheHazyImg from '../assets/Barashinghe Haxy.png';
import gorkhaPremiumImg from '../assets/Gorkha Premium.png';
import gorkhaStrongImg from '../assets/Gorkha Strong.png';
import nepalIcePremiumImg from '../assets/Nepal Ice Premium.png';

export const products = [
  {
    id: 1,
    name: 'Barahsinghe Pilsner',
    brand: 'Yak',
    size: '330ml',
    alcohol: '5%',
    unitsPerCase: 24,
    pricePerCase: 52,
    available: true,
    image: barahsinghePilsnerImg,
    description: 'Premium Pilsner • 5%'
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
    image: barahsinghePilsnerImg,
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
    image: barahsingheHazyImg,
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
    image: gorkhaPremiumImg,
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
    image: gorkhaStrongImg,
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
    image: nepalIcePremiumImg,
    description: 'Premium Beer • 5.5%'
  }
];

export const getBrandProducts = (brand) => {
  return products.filter(product => product.brand === brand);
};

export const getAvailableProducts = () => {
  return products.filter(product => product.available);
};

export const getProductById = (id) => {
  return products.find(product => product.id === id);
};