import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Microscope, Users, GraduationCap, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import PublicationSlider from "@/components/publication-slider";
import type { Publication, Author, News } from "@shared/schema";

export default function HomePage() {
  const { data: publications = [], isLoading: publicationsLoading } = useQuery<(Publication & { authors: Author[] })[]>({
    queryKey: ["/api/publications"],
  });

  const { data: recentNews = [], isLoading: newsLoading } = useQuery<News[]>({
    queryKey: ["/api/news", { limit: 3 }],
    queryFn: async () => {
      const response = await fetch("/api/news?limit=3");
      if (!response.ok) throw new Error("Failed to fetch news");
      return response.json();
    },
  });

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-lab-blue to-lab-sky py-20 lg:py-32">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className="text-4xl lg:text-6xl font-bold text-white mb-6 animate-slide-in"
            data-testid="text-hero-title"
          >
            Advancing Scientific Discovery
          </h1>
          <p
            className="text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto animate-fade-in"
            data-testid="text-hero-description"
          >
            Pioneering research in artificial intelligence, machine learning, and computational sciences to shape the future of technology.
          </p>
          <Link href="/research">
            <Button
              size="lg"
              className="bg-white text-lab-blue hover:bg-gray-100 transition-colors duration-200 transform hover:scale-105"
              data-testid="button-explore-research"
            >
              Explore Our Research
            </Button>
          </Link>
        </div>
      </div>

      {/* Publications Showcase Slider */}
      {publicationsLoading ? (
        <div className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <PublicationSlider publications={publications} />
      )}

      {/* Recent News Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Recent News</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Stay updated with the latest developments and announcements from our laboratory.
            </p>
          </div>

          {newsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {recentNews.map((newsItem) => (
                <div key={newsItem.id} className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  {newsItem.imageUrl && (
                    <div className="aspect-video bg-gray-200">
                      <img
                        src={newsItem.imageUrl}
                        alt={newsItem.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{new Date(newsItem.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {newsItem.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {newsItem.summary || newsItem.content.substring(0, 120) + "..."}
                    </p>
                    <Link href={`/news/${newsItem.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Read more
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 mb-12">
              <p>No recent news available at the moment.</p>
            </div>
          )}

          <div className="text-center">
            <Link href="/news">
              <Button variant="outline" size="lg">
                View All News
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow" data-testid="feature-research">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Microscope className="h-8 w-8 text-lab-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2" data-testid="text-feature-research-title">
                Advanced Research
              </h3>
              <p className="text-gray-600" data-testid="text-feature-research-description">
                Cutting-edge facilities and equipment for groundbreaking scientific discoveries.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow" data-testid="feature-team">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2" data-testid="text-feature-team-title">
                Expert Team
              </h3>
              <p className="text-gray-600" data-testid="text-feature-team-description">
                World-class researchers and scientists leading innovation in their fields.
              </p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow" data-testid="feature-education">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2" data-testid="text-feature-education-title">
                Education
              </h3>
              <p className="text-gray-600" data-testid="text-feature-education-description">
                Training the next generation of scientists and researchers through hands-on experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
