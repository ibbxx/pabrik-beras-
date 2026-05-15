"use client";
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

interface CircularImageCarouselProps {
  images: string[];
  autoplay?: boolean;
}

function calculateGap(width: number) {
  const minWidth = 1024;
  const maxWidth = 1456;
  const minGap = 60;
  const maxGap = 86;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth) return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

export const CircularImageCarousel = ({ images, autoplay = true }: CircularImageCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverPrev, setHoverPrev] = useState(false);
  const [hoverNext, setHoverNext] = useState(false);
  const [containerWidth, setContainerWidth] = useState(600); // smaller default for about page

  const imageContainerRef = useRef<HTMLDivElement>(null);
  const autoplayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const imagesLength = useMemo(() => images.length, [images]);

  useEffect(() => {
    function handleResize() {
      if (imageContainerRef.current) {
        setContainerWidth(imageContainerRef.current.offsetWidth);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (autoplay && imagesLength > 1) {
      autoplayIntervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % imagesLength);
      }, 3000);
    }
    return () => {
      if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
    };
  }, [autoplay, imagesLength]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, imagesLength]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % imagesLength);
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
  }, [imagesLength]);
  
  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + imagesLength) % imagesLength);
    if (autoplayIntervalRef.current) clearInterval(autoplayIntervalRef.current);
  }, [imagesLength]);

  function getImageStyle(index: number): React.CSSProperties {
    if (imagesLength === 1) {
      return {
        zIndex: 3,
        opacity: 1,
        pointerEvents: "auto",
        transform: `translateX(0px) translateY(0px) scale(1) rotateY(0deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    }

    const gap = calculateGap(containerWidth) * 0.8; // Reduce gap slightly for smaller container
    const maxStickUp = gap * 0.8;
    
    const isActive = index === activeIndex;
    const isLeft = (activeIndex - 1 + imagesLength) % imagesLength === index;
    const isRight = (activeIndex + 1) % imagesLength === index;
    
    if (isActive) {
      return {
        zIndex: 3,
        opacity: 1,
        pointerEvents: "auto",
        transform: `translateX(0px) translateY(0px) scale(1) rotateY(0deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    }
    if (isLeft) {
      return {
        zIndex: 2,
        opacity: imagesLength >= 2 ? 1 : 0, // show left if 2 or more images
        pointerEvents: "auto",
        transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(15deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    }
    if (isRight) {
      return {
        zIndex: 2,
        opacity: imagesLength >= 3 ? 1 : (imagesLength === 2 ? 0 : 1), // Hide right if only 2 images to avoid overlap, wait actually if 2 images, the other image is both left and right! We should just show it as left or right but not both. Wait, offset math.
        pointerEvents: "auto",
        transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(-15deg)`,
        transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
      };
    }
    
    return {
      zIndex: 1,
      opacity: 0,
      pointerEvents: "none",
      transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
    };
  }

  // Adjust for 2 images so one is left and one is active
  const renderStyle = (index: number) => {
    if (imagesLength === 2) {
      const isActive = index === activeIndex;
      if (isActive) {
        return {
          zIndex: 3,
          opacity: 1,
          pointerEvents: "auto" as any,
          transform: `translateX(0px) translateY(0px) scale(1) rotateY(0deg)`,
          transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
        };
      } else {
        const gap = calculateGap(containerWidth) * 0.8;
        const maxStickUp = gap * 0.8;
        return {
          zIndex: 2,
          opacity: 1,
          pointerEvents: "auto" as any,
          transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.85) rotateY(-15deg)`,
          transition: "all 0.8s cubic-bezier(.4,2,.3,1)",
        };
      }
    }
    return getImageStyle(index);
  }

  return (
    <div className="w-full flex flex-col items-center justify-center gap-6 md:gap-8">
      <div 
        className="w-full aspect-square relative" 
        ref={imageContainerRef}
        style={{ perspective: "1000px" }}
      >
        {images.map((src, index) => (
          <img
            key={`${src}-${index}`}
            src={src}
            alt={`Carousel image ${index + 1}`}
            className="absolute top-0 left-0 w-full h-full object-cover rounded-[2.5rem] md:rounded-[3rem] shadow-2xl"
            style={renderStyle(index)}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>
      
      {imagesLength > 1 && (
        <div className="flex gap-4 z-10">
          <button
            onClick={handlePrev}
            style={{ backgroundColor: hoverPrev ? "#00a6fb" : "#141414" }}
            onMouseEnter={() => setHoverPrev(true)}
            onMouseLeave={() => setHoverPrev(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg"
            aria-label="Previous image"
          >
            <FaArrowLeft size={16} color="#ffffff" />
          </button>
          <button
            onClick={handleNext}
            style={{ backgroundColor: hoverNext ? "#00a6fb" : "#141414" }}
            onMouseEnter={() => setHoverNext(true)}
            onMouseLeave={() => setHoverNext(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg"
            aria-label="Next image"
          >
            <FaArrowRight size={16} color="#ffffff" />
          </button>
        </div>
      )}
    </div>
  );
};
