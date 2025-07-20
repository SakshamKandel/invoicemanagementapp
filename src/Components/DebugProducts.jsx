import React from 'react';
import { products as defaultProducts } from '../data/products';

const DebugProducts = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Product Debug Information</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Total Products: {defaultProducts.length}</h3>
        </div>
        
        {defaultProducts.map((product, index) => (
          <div key={product.id} className="border p-4 rounded">
            <h4 className="font-bold">{index + 1}. {product.name}</h4>
            <p><strong>ID:</strong> {product.id}</p>
            <p><strong>Brand:</strong> {product.brand}</p>
            <p><strong>Size:</strong> {product.size}</p>
            <p><strong>Available:</strong> {product.available ? 'Yes' : 'No'}</p>
            <p><strong>Price:</strong> ${product.pricePerCase}</p>
            <p><strong>Image Path:</strong> {product.image}</p>
            <div className="mt-2">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-24 h-24 object-contain border"
                onLoad={() => console.log(`✅ Image loaded: ${product.name}`)}
                onError={() => console.log(`❌ Image failed: ${product.name} - ${product.image}`)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugProducts;
