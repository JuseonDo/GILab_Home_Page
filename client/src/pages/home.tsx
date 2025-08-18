import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Microscope, Users, GraduationCap, Clock, ArrowRight, MapPin, Mail, Globe } from "lucide-react";
import { Link } from "wouter";
import PublicationSlider from "@/components/publication-slider";
import type { Publication, Author, News, LabInfo } from "@shared/schema";

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

  const { data: labInfo, isLoading: labInfoLoading } = useQuery<LabInfo | null>({
    queryKey: ["/api/lab-info"],
  });

  // Initialize Google Maps when labInfo is loaded and contains coordinates
  useEffect(() => {
    if (labInfo?.latitude && labInfo?.longitude && typeof window !== 'undefined') {
      // Wait for Google Maps API to be loaded, then initialize
      const initMapWhenReady = () => {
        if (typeof google !== 'undefined' && google.maps && window.initGoogleMap) {
          setTimeout(() => window.initGoogleMap(), 100);
        } else {
          setTimeout(initMapWhenReady, 100);
        }
      };
      initMapWhenReady();
    }
  }, [labInfo]);

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-lab-blue to-lab-sky py-20 lg:py-32">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {labInfoLoading ? (
            <div className="animate-pulse">
              <div className="h-16 bg-white bg-opacity-20 rounded w-96 mx-auto mb-6"></div>
              <div className="h-8 bg-white bg-opacity-20 rounded w-full max-w-3xl mx-auto mb-4"></div>
              <div className="h-8 bg-white bg-opacity-20 rounded w-2/3 mx-auto mb-8"></div>
              <div className="h-12 bg-white bg-opacity-20 rounded w-48 mx-auto"></div>
            </div>
          ) : (
            <>
              <h1
                className="text-4xl lg:text-6xl font-bold text-white mb-6 animate-slide-in"
                data-testid="text-hero-title"
              >
                {labInfo?.labName || "Advancing Scientific Discovery"}
              </h1>
              <p
                className="text-xl lg:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto animate-fade-in"
                data-testid="text-hero-description"
              >
                {labInfo?.description || "Pioneering research in artificial intelligence, machine learning, and computational sciences to shape the future of technology."}
              </p>
              {labInfo && (
                <div className="flex flex-wrap justify-center gap-4 mb-8 text-blue-100">
                  {labInfo.university && (
                    <div className="flex items-center gap-2" data-testid="text-university">
                      <GraduationCap className="w-5 h-5" />
                      <span>{labInfo.university}</span>
                    </div>
                  )}
                  {labInfo.department && (
                    <div className="flex items-center gap-2" data-testid="text-department">
                      <Microscope className="w-5 h-5" />
                      <span>{labInfo.department}</span>
                    </div>
                  )}
                  {labInfo.establishedYear && (
                    <div className="flex items-center gap-2" data-testid="text-established">
                      <Clock className="w-5 h-5" />
                      <span>Est. {labInfo.establishedYear}</span>
                    </div>
                  )}
                </div>
              )}
              <Link href="/research">
                <Button
                  size="lg"
                  className="bg-white text-lab-blue hover:bg-gray-100 transition-colors duration-200 transform hover:scale-105"
                  data-testid="button-explore-research"
                >
                  Explore Our Research
                </Button>
              </Link>
            </>
          )}
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

      {/* Contact & Location Section */}
      {labInfo && (
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Visit Our Lab</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Find us on campus and get in touch with our research team.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h3>
                  <div className="space-y-4">
                    {labInfo.address && (
                      <div className="flex items-start gap-3" data-testid="contact-address">
                        <MapPin className="w-5 h-5 text-lab-blue mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Address</p>
                          <p className="text-gray-600">{labInfo.address}</p>
                          {(labInfo.building || labInfo.room) && (
                            <p className="text-gray-600">
                              {labInfo.building && labInfo.building}{labInfo.building && labInfo.room && ', '}{labInfo.room && labInfo.room}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {labInfo.contactEmail && (
                      <div className="flex items-center gap-3" data-testid="contact-email">
                        <Mail className="w-5 h-5 text-lab-blue flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Email</p>
                          <a href={`mailto:${labInfo.contactEmail}`} className="text-lab-blue hover:text-blue-700">
                            {labInfo.contactEmail}
                          </a>
                        </div>
                      </div>
                    )}

                    {labInfo.contactPhone && (
                      <div className="flex items-center gap-3" data-testid="contact-phone">
                        <svg className="w-5 h-5 text-lab-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                          <p className="font-medium text-gray-900">Phone</p>
                          <a href={`tel:${labInfo.contactPhone}`} className="text-lab-blue hover:text-blue-700">
                            {labInfo.contactPhone}
                          </a>
                        </div>
                      </div>
                    )}

                    {labInfo.website && (
                      <div className="flex items-center gap-3" data-testid="contact-website">
                        <Globe className="w-5 h-5 text-lab-blue flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Website</p>
                          <a 
                            href={labInfo.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-lab-blue hover:text-blue-700"
                          >
                            {labInfo.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      </div>
                    )}

                    {labInfo.officeHours && (
                      <div className="flex items-start gap-3" data-testid="contact-hours">
                        <Clock className="w-5 h-5 text-lab-blue mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Office Hours</p>
                          <p className="text-gray-600">{labInfo.officeHours}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Principal Investigator Info */}
                {labInfo.principalInvestigator && (
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Principal Investigator</h3>
                    <div className="flex items-start gap-4">
                      {labInfo.piPhoto && (
                        <img 
                          src={labInfo.piPhoto} 
                          alt={labInfo.principalInvestigator}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{labInfo.principalInvestigator}</h4>
                        {labInfo.piTitle && <p className="text-gray-600">{labInfo.piTitle}</p>}
                        <div className="mt-2 space-y-1">
                          {labInfo.piEmail && (
                            <a href={`mailto:${labInfo.piEmail}`} className="block text-lab-blue hover:text-blue-700 text-sm">
                              {labInfo.piEmail}
                            </a>
                          )}
                          {labInfo.piPhone && (
                            <a href={`tel:${labInfo.piPhone}`} className="block text-lab-blue hover:text-blue-700 text-sm">
                              {labInfo.piPhone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Map */}
              {labInfo.latitude && labInfo.longitude && (
                <div className="h-96 bg-gray-200 rounded-lg overflow-hidden" data-testid="lab-map">
                  <div 
                    id="lab-map-container" 
                    className="w-full h-full"
                    data-lat={labInfo.latitude}
                    data-lng={labInfo.longitude}
                    data-title={labInfo.labName}
                    data-address={labInfo.address}
                  >
                    {/* Google Maps will be initialized here */}
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                      <div className="text-center">
                        <MapPin className="w-12 h-12 text-lab-blue mx-auto mb-2" />
                        <p className="text-gray-700 font-medium">{labInfo.labName}</p>
                        <p className="text-gray-600 text-sm">{labInfo.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
