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
      className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative flex flex-col h-full"
      onContextMenu={handleContextMenu}
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <div className="p-2 sm:p-3 md:p-4 flex-1 flex flex-col">
        <div className="flex flex-col gap-1 mb-2">
          <div className="flex justify-between items-start gap-1">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 line-clamp-2 flex-1">{currentProduct.name}</h3>
            <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              currentProduct.available 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {currentProduct.available ? '✓' : '✗'}
            </span>
          </div>
        </div>
        
        <div className="space-y-1 text-xs sm:text-sm text-gray-700 mb-3">
          <div className="text-center text-gray-600 font-medium">{product.brand}</div>
          <div className="text-center text-gray-500">{product.size}</div>
        </div>
        
        <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-200">
          <div className="flex flex-col items-center gap-2">
            <div className="text-center">
              <span className="text-lg sm:text-xl font-bold text-gray-900 block">
                ${product.pricePerCase}
              </span>
              <span className="text-xs text-gray-500">{product.unitsPerCase} units</span>
            </div>
            <Button
              onPress={() => onAddToInvoice(currentProduct)}
              isDisabled={!currentProduct.available}
              className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-md font-medium transition-colors duration-200 text-xs sm:text-sm ${
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