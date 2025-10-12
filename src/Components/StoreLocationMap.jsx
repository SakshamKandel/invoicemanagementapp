import React, { useState } from 'react';
import { MapPin, Users, AlertCircle, Search, ExternalLink } from 'lucide-react';

const CustomerLocationMap = ({ customers = [] }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const processedCustomers = customers.map((customer, index) => ({
    ...customer,
    displayName: customer.businessName || customer.name || `Customer ${index + 1}`,
    fullAddress: customer.address || `${customer.city || 'Kathmandu'}, ${customer.state || 'Nepal'}`,
    id: customer.id || `customer-${index}`,
    status: customer.status || 'active',
    lat: customer.lat || (27.7 + (Math.random() - 0.5) * 0.15),
    lng: customer.lng || (85.3 + (Math.random() - 0.5) * 0.15)
  }));

  const filteredCustomers = processedCustomers.filter(customer =>
    customer.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.fullAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openInGoogleMaps = (customer) => {
    const address = encodeURIComponent(customer.fullAddress);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <MapPin className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Customer Locations</h1>
              <p className="text-sm text-gray-600">Click on any customer to view their location on the map</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className="w-96 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-lg p-4 border">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-red-600" />
                Customer Overview
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{customers.length}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{filteredCustomers.length}</div>
                  <div className="text-xs text-gray-600">Displayed</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3 sticky top-0 bg-gray-50 py-2 z-10">
                Customers ({filteredCustomers.length})
              </h4>
              
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No customers found</p>
                  <p className="text-xs">Try adjusting your search</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedCustomer?.id === customer.id
                          ? 'border-red-300 bg-red-50 shadow-md ring-2 ring-red-200'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-900 mb-1 truncate">{customer.displayName}</h5>
                          <p className="text-sm text-gray-600 mb-2 break-words">{customer.fullAddress}</p>
                          
                          {(customer.email || customer.phone) && (
                            <div className="space-y-1 text-xs text-gray-500 mb-2">
                              {customer.email && (
                                <div className="flex items-center gap-1 truncate">
                                  📧 <span className="truncate">{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center gap-1">
                                  📞 {customer.phone}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {customer.status}
                            </span>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openInGoogleMaps(customer);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Maps
                            </button>
                          </div>
                        </div>
                        
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ml-2 ${
                          selectedCustomer?.id === customer.id ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                      </div>
                      
                      {selectedCustomer?.id === customer.id && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <div className="text-sm text-red-700">
                            <p><strong>📍 Selected</strong> - View location on map →</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">How to use:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Click customers to see map location</li>
                    <li>• Use search to filter customers</li>
                    <li>• Scroll through the list</li>
                    <li>• Click Maps for Google Maps</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {filteredCustomers.map((customer) => {
            const x = ((customer.lng - 85.2) / 0.3) * 100;
            const y = ((27.8 - customer.lat) / 0.3) * 100;
            const boundedX = Math.max(5, Math.min(95, x));
            const boundedY = Math.max(5, Math.min(95, y));

            return (
              <div
                key={customer.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                  selectedCustomer?.id === customer.id ? 'scale-150 z-30' : 'hover:scale-125 z-20'
                }`}
                style={{
                  left: `${boundedX}%`,
                  top: `${boundedY}%`
                }}
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className={`relative ${selectedCustomer?.id === customer.id ? 'animate-bounce' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white ${
                    selectedCustomer?.id === customer.id 
                      ? 'bg-red-500 ring-4 ring-red-200' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black opacity-20 rounded-full"></div>
                  
                  {selectedCustomer?.id === customer.id && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-xl p-3 min-w-48 border z-40">
                      <div className="text-xs">
                        <h4 className="font-bold text-gray-800 mb-1">{customer.displayName}</h4>
                        <p className="text-gray-600 mb-2">{customer.fullAddress}</p>
                        {(customer.email || customer.phone) && (
                          <div className="space-y-1 mb-2">
                            {customer.email && (
                              <div className="text-blue-600">📧 {customer.email}</div>
                            )}
                            {customer.phone && (
                              <div className="text-green-600">📞 {customer.phone}</div>
                            )}
                          </div>
                        )}
                        <div className="text-gray-500 text-xs mb-2">
                          📍 {customer.lat.toFixed(4)}, {customer.lng.toFixed(4)}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openInGoogleMaps(customer);
                          }}
                          className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open in Google Maps
                        </button>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="absolute top-4 right-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg">
            <h4 className="font-medium text-gray-800 mb-2 text-sm">Map Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>Customer Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span>Selected Customer</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded text-sm">
            Showing {filteredCustomers.length} customers
          </div>

          {filteredCustomers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No customers found</h3>
                <p className="text-sm">Try adjusting your search criteria</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLocationMap;
