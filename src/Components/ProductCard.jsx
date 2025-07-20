import React, { useState } from 'react';
import { Button } from 'react-aria-components';
import StockStatusSelect from './StockStatusSelect';

const ProductCard = ({ product, onAddToInvoice, onStockStatusChange }) => {
  const [showStockSelector, setShowStockSelector] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(product);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setShowStockSelector(true);
  };

  const handleStockStatusChange = (isInStock) => {
    const updatedProduct = { ...currentProduct, available: isInStock };
    setCurrentProduct(updatedProduct);
    if (onStockStatusChange) {
      onStockStatusChange(updatedProduct);
    }
    setShowStockSelector(false);
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative"
      onContextMenu={handleContextMenu}
    >
      <div className="aspect-w-3 aspect-h-2 bg-gray-100">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{currentProduct.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            currentProduct.available 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {currentProduct.available ? 'Available' : 'Out of Stock'}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
        
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Brand:</span>
            <span className="font-medium">{product.brand}</span>
          </div>
          <div className="flex justify-between">
            <span>Size:</span>
            <span className="font-medium">{product.size}</span>
          </div>
          <div className="flex justify-between">
            <span>Alcohol:</span>
            <span className="font-medium">{product.alcohol}</span>
          </div>
          <div className="flex justify-between">
            <span>Units per case:</span>
            <span className="font-medium">{product.unitsPerCase}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-gray-900">
              ${product.pricePerCase}
              <span className="text-sm font-normal text-gray-500">/case</span>
            </span>
            <Button
              onPress={() => onAddToInvoice(currentProduct)}
              isDisabled={!currentProduct.available}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentProduct.available
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Add to Invoice
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stock Status Selector Overlay */}
      {showStockSelector && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <h4 className="text-lg font-semibold mb-4 text-gray-900">Change Stock Status</h4>
            <StockStatusSelect
              value={currentProduct.available}
              onChange={handleStockStatusChange}
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowStockSelector(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCard;