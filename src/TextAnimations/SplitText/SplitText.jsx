/*
	Simplified SplitText without GSAP SplitText plugin
*/

import { useRef, useEffect, useState } from "react";

const SplitText = ({
  text,
  className = "",
  delay = 100,
  duration = 0.6,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  onLetterAnimationComplete,
}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current || !text) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin, text]);

  const splitText = (text, type) => {
    switch (type) {
      case "chars":
        return text.split("").map((char, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              opacity: inView ? to.opacity : from.opacity,
              transform: `translateY(${inView ? to.y || 0 : from.y || 40}px) rotateX(${inView ? to.rotationX || 0 : from.rotationX || 0}deg)`,
              transition: `all ${duration}s ${ease} ${i * (delay / 1000)}s`,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ));
      case "words":
        return text.split(" ").map((word, i) => (
          <span key={i} className="inline-block mr-1">
            {word.split("").map((char, j) => (
              <span
                key={j}
                className="inline-block"
                style={{
                  opacity: inView ? to.opacity : from.opacity,
                  transform: `translateY(${inView ? to.y || 0 : from.y || 40}px)`,
                  transition: `all ${duration}s ${ease} ${(i * word.length + j) * (delay / 1000)}s`,
                }}
              >
                {char}
              </span>
            ))}
          </span>
        ));
      default:
        return text.split("").map((char, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              opacity: inView ? to.opacity : from.opacity,
              transform: `translateY(${inView ? to.y || 0 : from.y || 40}px) rotateX(${inView ? to.rotationX || 0 : from.rotationX || 0}deg)`,
              transition: `all ${duration}s ${ease} ${i * (delay / 1000)}s`,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ));
    }
  };

  useEffect(() => {
    if (inView && onLetterAnimationComplete) {
      const totalDelay = text.length * delay + duration * 1000;
      const timer = setTimeout(onLetterAnimationComplete, totalDelay);
      return () => clearTimeout(timer);
    }
  }, [inView, onLetterAnimationComplete, text.length, delay, duration]);

  return (
    <div
      ref={ref}
      className={`split-parent overflow-hidden inline-block whitespace-normal ${className}`}
      style={{
        textAlign,
        wordWrap: "break-word",
      }}
    >
      {splitText(text, splitType)}
    </div>
  );
};

export default SplitText;
