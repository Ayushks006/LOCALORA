import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Camera,
  ImageIcon,
  ShieldCheck,
  ExternalLink,
  Layers,
  AlertCircle
} from 'lucide-react';
import { DestinationImage } from '../../types';

interface ImageGalleryProps {
  destinationName: string;
  locality?: string;
  district?: string;
  primaryImage?: string;
  images: DestinationImage[];
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  destinationName,
  locality,
  district,
  primaryImage = '',
  images = [],
  className = '',
}) => {
  // Combine primaryImage and gallery images into a unified manifest
  // Ensuring primaryImage is index 0 if not already in images
  const allImages = React.useMemo(() => {
    const list: Array<{
      url: string;
      caption: string;
      attribution: string;
      license: string;
      alt_text: string;
      is_cover?: number;
    }> = [];

    // Always ensure primary image is present
    const hasPrimaryInList = images.some((img) => img.url === primaryImage);
    if (!hasPrimaryInList && primaryImage) {
      list.push({
        url: primaryImage,
        caption: `${destinationName} — Main Cover Photograph`,
        attribution: 'Official Verified Photography',
        license: 'Standard Editorial License',
        alt_text: `Cover photograph of ${destinationName}`,
        is_cover: 1,
      });
    }

    images.forEach((img, idx) => {
      list.push({
        url: img.url,
        caption: img.caption || `${destinationName} photo ${idx + 1}`,
        attribution: img.attribution || 'Verified Tourism Contributor',
        license: img.license || 'Open Editorial License',
        alt_text: img.alt_text || img.caption || `${destinationName} gallery photograph`,
        is_cover: img.is_cover || (img.url === primaryImage ? 1 : 0),
      });
    });

    return list;
  }, [destinationName, primaryImage, images]);

  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [hasError, setHasError] = useState<Record<string, boolean>>({});

  const modalRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalImages = allImages.length;

  const openLightbox = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalImages - 1)));
    setIsOpen(true);
    setImgLoading(true);
  };

  const closeLightbox = useCallback(() => {
    setIsOpen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalImages);
    setImgLoading(true);
  }, [totalImages]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
    setImgLoading(true);
  }, [totalImages]);

  // Keyboard navigation & escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeLightbox, goToNext, goToPrev]);

  // Scroll locking on document body
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!modalRef.current) return;
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Mobile Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped left -> next
      goToNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev
      goToPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleImageError = (url: string) => {
    setHasError((prev) => ({ ...prev, [url]: true }));
    setImgLoading(false);
  };

  const currentPhoto = allImages[currentIndex] || allImages[0];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. GALLERY HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-forest/10 text-forest rounded-xl">
            <Camera className="w-5 h-5 text-forest" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-charcoal">
              Authentic Location Photography
            </h2>
            <p className="text-xs text-charcoal-500">
              Verified destination imagery & original field archives
            </p>
          </div>
        </div>

        <button
          onClick={() => openLightbox(0)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-forest hover:bg-forest-700 text-white rounded-xl text-xs font-semibold shadow-soft transition group"
        >
          <Layers className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform" />
          <span>View All Photos ({totalImages})</span>
        </button>
      </div>

      {/* 2. PREVIEW GRID (Adaptive layout for Desktop & Mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {allImages.slice(0, 4).map((photo, index) => {
          const isLastThumb = index === 3 && totalImages > 4;
          const remainingCount = totalImages - 4;

          return (
            <motion.div
              key={photo.url + index}
              whileHover={{ y: -3, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              onClick={() => openLightbox(index)}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-ivory-200 bg-charcoal group shadow-soft"
            >
              {hasError[photo.url] ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-ivory-100 text-charcoal-400 text-center space-y-1">
                  <ImageIcon className="w-8 h-8 opacity-40 text-terracotta" />
                  <span className="text-[11px] font-medium">{photo.caption}</span>
                </div>
              ) : (
                <img
                  src={photo.url}
                  alt={photo.alt_text}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={() => handleImageError(photo.url)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

              {/* Badges */}
              {index === 0 && (
                <span className="absolute top-2.5 left-2.5 bg-forest/90 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  Cover
                </span>
              )}

              {/* Caption pill */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-xs">
                <p className="font-medium text-ivory text-[11px] truncate leading-tight drop-shadow-sm">
                  {photo.caption}
                </p>
                <p className="text-[9px] text-ivory-300 truncate opacity-80 mt-0.5">
                  {photo.attribution}
                </p>
              </div>

              {/* "+N More" overlay on 4th thumbnail */}
              {isLastThumb && remainingCount > 0 && (
                <div className="absolute inset-0 bg-charcoal/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-white p-2 text-center group-hover:bg-charcoal/60 transition-colors">
                  <Layers className="w-6 h-6 text-terracotta mb-1" />
                  <span className="font-serif font-bold text-lg text-ivory">+{remainingCount} More</span>
                  <span className="text-[10px] text-ivory-300 font-medium">Click to view all</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 3. INTERACTIVE LIGHTBOX MODAL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-charcoal/95 backdrop-blur-xl flex flex-col justify-between select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* LIGHTBOX TOP BAR */}
            <div className="px-4 py-3 sm:px-6 flex items-center justify-between border-b border-white/10 bg-black/40 z-10">
              <div className="flex items-center gap-3 text-white min-w-0">
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 text-ivory">
                  {currentIndex + 1} / {totalImages}
                </span>
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-ivory truncate">
                    {destinationName}
                  </h3>
                  {(locality || district) && (
                    <p className="text-[10px] text-ivory-300 truncate">
                      {[locality, district, 'Karnataka'].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions: Fullscreen & Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center justify-center"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={closeLightbox}
                  title="Close Gallery (Esc)"
                  className="p-2 rounded-xl bg-white/10 hover:bg-terracotta text-white transition text-xs flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* LIGHTBOX CENTER STAGE (Main Large Image & Navigation Chevrons) */}
            <div className="relative flex-1 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
              {/* Previous Button */}
              {totalImages > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrev();
                  }}
                  title="Previous Photo (Left Arrow)"
                  className="absolute left-3 sm:left-6 z-20 p-3 rounded-2xl bg-black/50 hover:bg-forest text-white transition-all backdrop-blur-md border border-white/10 shadow-soft group hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Main Photo Container with Framer Motion slide transition */}
              <div className="relative w-full h-full flex items-center justify-center max-w-5xl">
                {imgLoading && !hasError[currentPhoto?.url] && (
                  <div className="absolute inset-0 flex items-center justify-center text-ivory-400">
                    <div className="w-10 h-10 border-2 border-forest border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {hasError[currentPhoto?.url] ? (
                  <div className="p-8 bg-white/5 border border-white/10 rounded-3xl text-center text-ivory max-w-md space-y-3">
                    <AlertCircle className="w-12 h-12 text-terracotta mx-auto" />
                    <h4 className="font-serif font-bold text-base">Image Temporarily Unavailable</h4>
                    <p className="text-xs text-ivory-300">
                      The photograph for {currentPhoto.caption} could not be delivered from the remote host.
                    </p>
                    <p className="text-[11px] text-ivory-400">
                      Attribution: {currentPhoto.attribution} • License: {currentPhoto.license}
                    </p>
                  </div>
                ) : (
                  <motion.img
                    key={currentPhoto?.url}
                    initial={{ opacity: 0.6, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.6 }}
                    transition={{ duration: 0.25 }}
                    src={currentPhoto?.url}
                    alt={currentPhoto?.alt_text}
                    referrerPolicy="no-referrer"
                    onLoad={() => setImgLoading(false)}
                    onError={() => handleImageError(currentPhoto.url)}
                    className="max-h-[68vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
                  />
                )}
              </div>

              {/* Next Button */}
              {totalImages > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  title="Next Photo (Right Arrow)"
                  className="absolute right-3 sm:right-6 z-20 p-3 rounded-2xl bg-black/50 hover:bg-forest text-white transition-all backdrop-blur-md border border-white/10 shadow-soft group hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* LIGHTBOX FOOTER (Caption, Attributions, License & Thumbnails Strip) */}
            <div className="border-t border-white/10 bg-black/60 backdrop-blur-md p-3 sm:p-4 space-y-3 z-10">
              {/* Caption & Metadata row */}
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-serif text-sm sm:text-base font-semibold text-ivory leading-snug">
                    {currentPhoto.caption}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-ivory-300">
                    <span className="flex items-center gap-1 font-medium">
                      <Camera className="w-3.5 h-3.5 text-terracotta" />
                      {currentPhoto.attribution}
                    </span>
                    <span>•</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded-full text-[10px] text-emerald-300 font-mono">
                      {currentPhoto.license}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-ivory-400 font-mono self-start sm:self-center">
                  Press <kbd className="bg-white/10 px-1 py-0.5 rounded">←</kbd> <kbd className="bg-white/10 px-1 py-0.5 rounded">→</kbd> to navigate, <kbd className="bg-white/10 px-1 py-0.5 rounded">Esc</kbd> to exit
                </div>
              </div>

              {/* Thumbnails Navigation Strip */}
              {totalImages > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 no-scrollbar max-w-3xl mx-auto">
                  {allImages.map((thumb, idx) => {
                    const isActive = idx === currentIndex;
                    return (
                      <button
                        key={thumb.url + idx}
                        onClick={() => {
                          setCurrentIndex(idx);
                          setImgLoading(true);
                        }}
                        className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden transition-all duration-200 border-2 ${
                          isActive
                            ? 'border-terracotta scale-105 shadow-md shadow-terracotta/40'
                            : 'border-transparent opacity-60 hover:opacity-100 hover:scale-100'
                        }`}
                      >
                        <img
                          src={thumb.url}
                          alt={thumb.alt_text}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
