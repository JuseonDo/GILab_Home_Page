import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ResearchProject } from "@/shared/schema";

interface ResearchSliderProps {
  projects: ResearchProject[];
}

export default function ResearchSlider({ projects }: ResearchSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay || projects.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % projects.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay, projects.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % projects.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + projects.length) % projects.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (projects.length === 0) {
    return (
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Latest Research</h2>
            <p className="text-gray-600">No research projects available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-white" data-testid="research-slider">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-testid="text-latest-research">
            Latest Research
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-testid="text-research-description">
            Discover our cutting-edge research projects that are pushing the boundaries of scientific knowledge.
          </p>
        </div>

        <div
          className="research-slider-container relative overflow-hidden"
          onMouseEnter={() => setIsAutoPlay(false)}
          onMouseLeave={() => setIsAutoPlay(true)}
        >
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            data-testid="slider-container"
          >
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="research-slide w-full flex-shrink-0 px-4"
                data-testid={`slide-${index}`}
              >
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 group">
                  <img
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-64 lg:h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                    data-testid={`img-project-${index}`}
                  />
                  <div className="p-8">
                    <div className="flex items-center mb-4">
                      <Badge
                        variant="secondary"
                        className={`${
                          project.category === "AI Research"
                            ? "bg-blue-100 text-blue-800"
                            : project.category === "Robotics"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        } text-xs font-semibold`}
                        data-testid={`badge-category-${index}`}
                      >
                        {project.category}
                      </Badge>
                      <span className="text-gray-500 text-sm ml-4" data-testid={`text-date-${index}`}>
                        {project.date}
                      </span>
                    </div>
                    <h3
                      className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-lab-blue transition-colors"
                      data-testid={`text-title-${index}`}
                    >
                      {project.title}
                    </h3>
                    <p
                      className="text-gray-600 mb-6 leading-relaxed"
                      data-testid={`text-description-${index}`}
                    >
                      {project.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700" data-testid={`text-lead-${index}`}>
                          {project.leadResearcher}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-lab-blue hover:text-lab-sky font-medium"
                        data-testid={`button-read-more-${index}`}
                      >
                        Read More <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-8 space-x-2" data-testid="slider-dots">
            {projects.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  currentSlide === index ? "bg-lab-blue" : "bg-gray-300 hover:bg-gray-400"
                }`}
                data-testid={`dot-${index}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          {projects.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-lg"
                data-testid="button-prev-slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-lg"
                data-testid="button-next-slide"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
