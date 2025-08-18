import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Plus } from "lucide-react";
import { Link } from "wouter";
import type { News } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function NewsPage() {
  const { isAuthenticated } = useAuth();
  const { data: news = [], isLoading, error } = useQuery<News[]>({
    queryKey: ["/api/news"],
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading news</h2>
          <p className="text-gray-600">Failed to load news articles. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="text-news-title">
              Latest News
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto" data-testid="text-news-description">
              Stay informed about our latest research breakthroughs, publications, and laboratory updates.
            </p>
            {isAuthenticated && (
              <div className="mt-8">
                <Link href="/admin">
                  <Button variant="secondary" size="lg" data-testid="button-manage-news">
                    <Plus className="h-5 w-5 mr-2" />
                    Manage News
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse" data-testid={`skeleton-news-${i}`}>
                <Card>
                  <div className="aspect-video bg-gray-200 rounded-t-lg"></div>
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : news.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {news.map((newsItem) => (
                <Card key={newsItem.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-news-${newsItem.id}`}>
                  {newsItem.imageUrl && (
                    <div className="aspect-video bg-gray-200">
                      <img
                        src={newsItem.imageUrl}
                        alt={newsItem.title}
                        className="w-full h-full object-cover"
                        data-testid={`img-news-${newsItem.id}`}
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span data-testid={`text-news-date-${newsItem.id}`}>
                          {new Date(newsItem.publishedAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>

                    </div>
                    <CardTitle className="line-clamp-2" data-testid={`text-news-title-${newsItem.id}`}>
                      {newsItem.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 line-clamp-3 mb-4" data-testid={`text-news-summary-${newsItem.id}`}>
                      {newsItem.summary || newsItem.content.substring(0, 150) + "..."}
                    </p>
                    <div className="flex items-center justify-between">
                      <Link href={`/news/${newsItem.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-read-more-${newsItem.id}`}>
                          Read More
                        </Button>
                      </Link>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{Math.ceil(newsItem.content.split(' ').length / 200)} min read</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {news.length > 6 && (
              <div className="mt-16 text-center">
                <p className="text-gray-600 mb-4">
                  Showing {Math.min(6, news.length)} of {news.length} articles
                </p>
                <Button variant="outline" size="lg" data-testid="button-load-more">
                  Load More Articles
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2" data-testid="text-no-news-title">
              No News Available
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8" data-testid="text-no-news-description">
              There are no news articles available at the moment. Check back later for updates.
            </p>
            {isAuthenticated && (
              <Link href="/admin">
                <Button data-testid="button-add-first-news">
                  <Plus className="h-5 w-5 mr-2" />
                  Add First News Article
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}