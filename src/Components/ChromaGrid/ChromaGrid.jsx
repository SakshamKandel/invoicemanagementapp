/*
	Installed from https://reactbits.dev/tailwind/
*/

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";

const ChromaGrid = ({
  items,
  className = "",
  radius = 300,
  damping = 0.45,
  fadeOut = 0.6,
  ease = "power3.out",
}) => {
  const rootRef = useRef(null);
  const fadeRef = useRef(null);
  const setX = useRef(null);
  const setY = useRef(null);
  const pos = useRef({ x: 0, y: 0 });
  const [flippedCards, setFlippedCards] = useState(new Set());

  const demo = [
    {
      image: "https://i.pravatar.cc/300?img=8",
      title: "Alex Rivera",
      subtitle: "Full Stack Developer",
      handle: "@alexrivera",
      borderColor: "#4F46E5",
      gradient: "linear-gradient(145deg,#4F46E5,#000)",
      url: "https://github.com/",
    },
    {
      image: "https://i.pravatar.cc/300?img=11",
      title: "Jordan Chen",
      subtitle: "DevOps Engineer",
      handle: "@jordanchen",
      borderColor: "#10B981",
      gradient: "linear-gradient(210deg,#10B981,#000)",
      url: "https://linkedin.com/in/",
    },
    {
      image: "https://i.pravatar.cc/300?img=3",
      title: "Morgan Blake",
      subtitle: "UI/UX Designer",
      handle: "@morganblake",
      borderColor: "#F59E0B",
      gradient: "linear-gradient(165deg,#F59E0B,#000)",
      url: "https://dribbble.com/",
    },
    {
      image: "https://i.pravatar.cc/300?img=16",
      title: "Casey Park",
      subtitle: "Data Scientist",
      handle: "@caseypark",
      borderColor: "#EF4444",
      gradient: "linear-gradient(195deg,#EF4444,#000)",
      url: "https://kaggle.com/",
    },
    {
      image: "https://i.pravatar.cc/300?img=25",
      title: "Sam Kim",
      subtitle: "Mobile Developer",
      handle: "@thesamkim",
      borderColor: "#8B5CF6",
      gradient: "linear-gradient(225deg,#8B5CF6,#000)",
      url: "https://github.com/",
    },
    {
      image: "https://i.pravatar.cc/300?img=60",
      title: "Tyler Rodriguez",
      subtitle: "Cloud Architect",
      handle: "@tylerrod",
      borderColor: "#06B6D4",
      gradient: "linear-gradient(135deg,#06B6D4,#000)",
      url: "https://aws.amazon.com/",
    },
  ];

  const data = items?.length ? items : demo;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setX.current = gsap.quickSetter(el, "--x", "px");
    setY.current = gsap.quickSetter(el, "--y", "px");
    const { width, height } = el.getBoundingClientRect();
    pos.current = { x: width / 2, y: height / 2 };
    setX.current(pos.current.x);
    setY.current(pos.current.y);
  }, []);

  const moveTo = (x, y) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x);
        setY.current?.(pos.current.y);
      },
      overwrite: true,
    });
  };

  const handleMove = (e) => {
    const r = rootRef.current.getBoundingClientRect();
    moveTo(e.clientX - r.left, e.clientY - r.top);
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.25, overwrite: true });
  };

  const handleLeave = () => {
    gsap.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: true,
    });
  };

  const handleCardClick = (url, customClick, cardIndex) => {
    if (customClick) {
      return; // Let the custom click handler take over
    }
    
    // Toggle card flip
    setFlippedCards(prev => {
      const newFlipped = new Set(prev);
      if (newFlipped.has(cardIndex)) {
        newFlipped.delete(cardIndex);
      } else {
        newFlipped.add(cardIndex);
      }
      return newFlipped;
    });
    
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCardMove = (e) => {
    const c = e.currentTarget;
    const rect = c.getBoundingClientRect();
    c.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    c.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`relative w-full h-full flex flex-wrap justify-center items-center gap-6 ${className}`}
      style={{
        "--r": `${radius}px`,
        "--x": "50%",
        "--y": "50%",
      }}
    >
      {data.map((c, i) => {
        const isFlipped = flippedCards.has(i);
        return (
          <div
            key={i}
            className="relative w-[250px] h-[320px] cursor-pointer perspective-1000"
            onMouseMove={handleCardMove}
            onClick={() => handleCardClick(c.url, c.onClick, i)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front of Card - Beer Showcase */}
              <article
                className={`absolute inset-0 w-full h-full rounded-[20px] overflow-hidden border-2 border-transparent transition-all duration-300 shadow-lg hover:shadow-xl backface-hidden ${
                  !isFlipped ? 'z-10' : ''
                }`}
                style={{
                  "--card-border": c.borderColor || "transparent",
                  background: c.backgroundColor || c.gradient,
                  "--spotlight-color": "rgba(255,255,255,0.6)",
                  "--hover-gradient": "linear-gradient(145deg, #EF4444, #DC2626)",
                }}
                onMouseEnter={(e) => {
                  if (!isFlipped) {
                    e.currentTarget.style.background = "var(--hover-gradient)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isFlipped) {
                    e.currentTarget.style.background = c.backgroundColor || c.gradient;
                  }
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-20 opacity-0 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 70%)",
                  }}
                />
                
                {/* Stock Status Badge - Top Right */}
                <div className="absolute top-3 right-3 z-30">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    c.originalProduct?.available 
                      ? 'bg-white text-green-600 border-2 border-green-600' 
                      : 'bg-white text-red-600 border-2 border-red-600'
                  }`}>
                    {c.originalProduct?.available ? 'IN STOCK' : 'OUT OF STOCK'}
                  </span>
                </div>

                {/* Add to Cart Button - Top Left */}
                <div className="absolute top-3 left-3 z-30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (c.originalProduct?.onAddToCart && c.originalProduct?.available) {
                        c.originalProduct.onAddToCart();
                      }
                    }}
                    disabled={!c.originalProduct?.available}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors duration-200 ${
                      c.originalProduct?.available
                        ? 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-600 hover:text-white'
                        : 'bg-white/50 text-gray-400 border-2 border-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {c.originalProduct?.available ? 'ADD TO CART' : 'UNAVAILABLE'}
                  </button>
                </div>

                <div className="relative z-10 flex-1 p-[10px] box-border h-full flex flex-col justify-center">
                  <img
                    src={c.image}
                    alt={c.title}
                    loading="lazy"
                    className="w-full h-[180px] object-contain rounded-[10px] bg-white/20"
                    style={{ userSelect: 'none' }}
                  />
                  {/* Beer Name below image */}
                  <div className="mt-3 text-center">
                    <h3 className="text-white text-lg font-bold drop-shadow-lg">{c.title}</h3>
                  </div>
                </div>
                
                <footer className="relative z-10 p-3 text-white font-sans grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
                  <p className="m-0 text-[0.85rem] opacity-85">{c.subtitle}</p>
                  {c.handle && (
                    <span className="text-[0.95rem] opacity-80 text-right">
                      {c.handle}
                    </span>
                  )}
                  <span className="text-[0.75rem] opacity-70 col-span-2 text-center">
                    Click to manage stock
                  </span>
                </footer>
              </article>

              {/* Back of Card - Stock Management */}
              <article
                className={`absolute inset-0 w-full h-full rounded-[20px] overflow-hidden border-2 border-transparent transition-all duration-300 shadow-lg hover:shadow-xl backface-hidden rotate-y-180 bg-white ${
                  isFlipped ? 'z-10' : ''
                }`}
                style={{
                  "--card-border": c.borderColor || "transparent",
                }}
              >
                <div className="p-4 h-full flex flex-col justify-between">
                  {/* Header Section */}
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      c.originalProduct?.available 
                        ? 'bg-green-100' 
                        : 'bg-red-100'
                    }`}>
                      {c.originalProduct?.available ? (
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{c.title}</h3>
                    <p className="text-xs text-gray-600">{c.subtitle}</p>
                  </div>

                  {/* Current Status */}
                  <div className={`rounded-lg p-3 border ${
                    c.originalProduct?.available 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-700 mb-1">Current Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        c.originalProduct?.available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          c.originalProduct?.available ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        {c.originalProduct?.available ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (c.originalProduct?.onToggleStock) {
                          c.originalProduct.onToggleStock();
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        c.originalProduct?.available
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {c.originalProduct?.available ? (
                        <>
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Mark Out of Stock
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Mark In Stock
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (c.originalProduct?.onAddToCart && c.originalProduct?.available) {
                          c.originalProduct.onAddToCart();
                        }
                      }}
                      disabled={!c.originalProduct?.available}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        c.originalProduct?.available
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 2.5M7 13l2.5 2.5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                      {c.originalProduct?.available ? 'Add to Cart' : 'Unavailable'}
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="text-center text-xs text-gray-600 border-t border-gray-200 pt-2">
                    <p className="font-medium">{c.handle}</p>
                    <p>{c.originalProduct?.unitsPerCase} units/case</p>
                  </div>

                  {/* Back Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFlippedCards(prev => {
                        const newFlipped = new Set(prev);
                        newFlipped.delete(i);
                        return newFlipped;
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    ← Back
                  </button>
                </div>
              </article>
            </div>
          </div>
        );
      })}
      <div
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          backdropFilter: "grayscale(1) brightness(0.78)",
          WebkitBackdropFilter: "grayscale(1) brightness(0.78)",
          background: "rgba(0,0,0,0.001)",
          maskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22)45%,rgba(0,0,0,0.35)60%,rgba(0,0,0,0.50)75%,rgba(0,0,0,0.68)88%,white 100%)",
          WebkitMaskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),transparent 0%,transparent 15%,rgba(0,0,0,0.10) 30%,rgba(0,0,0,0.22)45%,rgba(0,0,0,0.35)60%,rgba(0,0,0,0.50)75%,rgba(0,0,0,0.68)88%,white 100%)",
        }}
      />
      <div
        ref={fadeRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-[250ms] z-40"
        style={{
          backdropFilter: "grayscale(1) brightness(0.78)",
          WebkitBackdropFilter: "grayscale(1) brightness(0.78)",
          background: "rgba(0,0,0,0.001)",
          maskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90)30%,rgba(255,255,255,0.78)45%,rgba(255,255,255,0.65)60%,rgba(255,255,255,0.50)75%,rgba(255,255,255,0.32)88%,transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle var(--r) at var(--x) var(--y),white 0%,white 15%,rgba(255,255,255,0.90)30%,rgba(255,255,255,0.78)45%,rgba(255,255,255,0.65)60%,rgba(255,255,255,0.50)75%,rgba(255,255,255,0.32)88%,transparent 100%)",
          opacity: 1,
        }}
      />
    </div>
  );
};

export default ChromaGrid;
