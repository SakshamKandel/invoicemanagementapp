// Using images from assets folder as requested
// src/assets/barahsinghe-hazy.png = Barahsinghe hazy
// src/assets/barahsinghe-pilsner.png = Barahsinghe Pilsner (330ml)
// src/assets/Barahsinghe_pilsner_650ml-630x520-630x520.png = Barahsinghe Pilsner (650ml)
// src/assets/gorkha-premium.png = Gorkha Premium
// src/assets/gorkha-strong.png = Gorkha Strong
// src/assets/nepal-ice-premium.png = Nepal Ice
const barahsinghePilsner330mlImg = '/images/barahsinghe-pilsner.png';
const barahsinghePilsner650mlImg = '/images/Barahsinghe_pilsner_650ml-630x520-630x520.png';
const barahsingheHazyImg = '/images/barahsinghe-hazy.png';
const gorkhaPremiumImg = '/images/gorkha-premium.png';
const gorkhaStrongImg = '/images/gorkha-strong.png';
const nepalIcePremiumImg = '/images/nepal-ice-premium.png';
const arnaImg = '/images/Arna.png';

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
    image: barahsinghePilsner330mlImg,
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
    image: barahsinghePilsner650mlImg,
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
  },
  {
    id: 7,
    name: 'Arna',
    brand: 'Arna',
    size: '330ml',
    alcohol: '5%',
    unitsPerCase: 24,
    pricePerCase: 45,
    available: true,
    image: arnaImg,
    description: 'Premium Beer • 5%'
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