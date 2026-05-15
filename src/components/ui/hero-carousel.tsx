"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

interface Slide {
  image_url: string;
}

interface HeroCarouselProps {
  slides: Slide[];
  autoplay?: boolean;
}



export const HeroCarousel = ({
  slides,
  autoplay = true,
}: HeroCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);

  const autoplayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slidesLength = useMemo(() => slides.length, [slides]);

  // Autoplay
  useEffect(() => {
    if (autoplay && slidesLength > 1) {
      autoplayIntervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % slidesLength);
      }, 5000);
    }
    return () => {
      if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
    };
  }, [autoplay, slidesLength]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slidesLength);
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
  }, [slidesLength]);
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slidesLength) % slidesLength);
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
  }, [slidesLength]);

  if (!slides || slides.length === 0) return null;

  // Simple fade transition
  function getImageStyle(index: number): React.CSSProperties {
    const isActive = index === activeIndex;
    return {
      zIndex: isActive ? 1 : 0,
      opacity: isActive ? 1 : 0,
      transition: "opacity 1s ease-in-out",
    };
  }

  return (
    <div className="relative w-full lg:max-w-sm xl:max-w-md flex flex-col items-center">
      <div 
        className="relative w-full aspect-square sm:aspect-[4/5] lg:aspect-[4/5] overflow-hidden rounded-none sm:rounded-[2rem] lg:rounded-[3rem] sm:shadow-2xl mb-6"
      >
        {slides.map((slide, index) => (
          <img
            key={slide.image_url + index}
            src={slide.image_url}
            alt={`Slide ${index + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            style={getImageStyle(index)}
          />
        ))}
      </div>

      {slidesLength > 1 && (
        <div className="hidden md:flex gap-4">
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            onClick={handlePrev}
            style={{
              backgroundColor: hoverPrev ? "#10b981" : "#141414",
              color: "#f1f1f7"
            }}
            onMouseEnter={() => setHoverPrev(true)}
            onMouseLeave={() => setHoverPrev(false)}
            aria-label="Previous slide"
          >
            <FaArrowLeft size={20} />
          </button>
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            onClick={handleNext}
            style={{
              backgroundColor: hoverNext ? "#10b981" : "#141414",
              color: "#f1f1f7"
            }}
            onMouseEnter={() => setHoverNext(true)}
            onMouseLeave={() => setHoverNext(false)}
            aria-label="Next slide"
          >
            <FaArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
