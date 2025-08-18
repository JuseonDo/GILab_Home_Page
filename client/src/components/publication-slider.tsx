import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import type { Publication } from "@shared/schema";

interface PublicationSliderProps {
  publications: Publication[];
}

export default function PublicationSlider({ publications }: PublicationSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides
  useEffect(() => {
    if (publications.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % publications.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [publications.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % publications.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + publications.length) % publications.length);
  };

  if (!publications || publications.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">No publications available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Slider Container */}
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          data-testid="slider-container"
        >
          {publications.map((publication, index) => (
            <div
              key={publication.id}
              className="publication-slide w-full flex-shrink-0 px-4"
              data-testid={`slide-${index}`}
            >
              <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 max-w-5xl mx-auto cursor-pointer hover:scale-[1.02] relative">
                {/* Hover background overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-purple-50/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                
                <div className={`grid ${publication.imageUrl ? 'lg:grid-cols-2 gap-8' : 'grid-cols-1'} p-8 relative`}>
                  {/* Image Section */}
                  {publication.imageUrl && (
                    <div className="flex items-center justify-center">
                      <div className="relative aspect-square w-full max-w-sm rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-300">
                        <img
                          src={publication.imageUrl}
                          alt={`${publication.title} illustration`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          data-testid={`img-publication-${index}`}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                      </div>
                    </div>
                  )}
                  
                  {/* Content Section */}
                  <div className="flex flex-col justify-center space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge 
                        variant={publication.type === 'journal' ? 'default' : 'secondary'}
                        className="text-sm group-hover:bg-blue-100 group-hover:text-blue-800 transition-colors duration-300"
                        data-testid={`badge-type-${index}`}
                      >
                        {publication.type === 'journal' ? 'Journal' : 'Conference'}
                      </Badge>
                      <Badge variant="outline" className="group-hover:border-blue-300 transition-colors duration-300" data-testid={`badge-year-${index}`}>
                        {publication.year}
                      </Badge>
                    </div>
                    
                    {/* Title - make it clickable if URL exists */}
                    {publication.url ? (
                      <a 
                        href={publication.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <h3 
                          className="text-2xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-blue-900 transition-colors duration-300 hover:underline cursor-pointer" 
                          data-testid={`text-title-${index}`}
                          dangerouslySetInnerHTML={{ __html: publication.title }}
                        />
                      </a>
                    ) : (
                      <h3 
                        className="text-2xl font-bold text-gray-900 mb-4 leading-tight group-hover:text-blue-900 transition-colors duration-300" 
                        data-testid={`text-title-${index}`}
                        dangerouslySetInnerHTML={{ __html: publication.title }}
                      />
                    )}
                    
                    <div className="text-sm text-gray-600 mb-4 group-hover:text-gray-800 transition-colors duration-300" data-testid={`text-venue-${index}`}>
                      <span className="font-medium">{publication.journal || publication.conference}</span>
                    </div>
                    
                    <div className="mb-6">
                      <div className="text-sm text-gray-500 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Authors:</div>
                      <div className="flex flex-wrap gap-2">
                        {publication.authors && publication.authors.map((author, authorIndex) => (
                          <span key={authorIndex} className="text-sm">
                            {author.homepage ? (
                              <a
                                href={author.homepage}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                                data-testid={`link-author-${index}-${authorIndex}`}
                                dangerouslySetInnerHTML={{ __html: author.name }}
                              />
                            ) : (
                              <span 
                                className="text-gray-700 font-medium" 
                                data-testid={`text-author-${index}-${authorIndex}`}
                                dangerouslySetInnerHTML={{ __html: author.name }}
                              />
                            )}
                            {authorIndex < publication.authors.length - 1 && (
                              <span className="text-gray-400 ml-1">•</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Keywords - shown only on hover */}
                    {publication.keywords && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="text-xs font-medium text-gray-500 mb-2">Keywords:</div>
                        <div className="flex flex-wrap gap-1">
                          {publication.keywords.split(',').map((keyword, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {keyword.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick action buttons - shown on hover */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {publication.url && (
                        <a
                          href={publication.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Visit
                        </a>
                      )}
                      {publication.pdfUrl && (
                        <a
                          href={publication.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                          data-testid={`link-pdf-${index}`}
                        >
                          <ExternalLink className="h-3 w-3" />
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {publications.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 z-10"
            data-testid="prev-slide"
            aria-label="Previous publication"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 z-10"
            data-testid="next-slide"
            aria-label="Next publication"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {publications.length > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {publications.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentSlide
                  ? "bg-lab-blue scale-110"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              onClick={() => setCurrentSlide(index)}
              data-testid={`dot-${index}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}