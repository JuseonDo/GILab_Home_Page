import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, User } from "lucide-react";
import type { News } from "@/shared/schema";

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: newsItem, isLoading, error } = useQuery<News>({
    queryKey: ["/news", id],
    enabled: !!id,
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading news</h2>
          <p className="text-gray-600 mb-8">Failed to load news article. Please try again later.</p>
          <Link href="/news">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">News not found</h2>
          <p className="text-gray-600 mb-8">The news article you're looking for doesn't exist.</p>
          <Link href="/news">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link href="/news">
            <Button variant="outline" size="sm" data-testid="button-back-to-news">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to News
            </Button>
          </Link>
        </div>

        <article className="bg-white rounded-lg shadow-sm overflow-hidden">
          {newsItem.imageUrl && (
            <div className="aspect-video bg-gray-200">
              <img
                src={newsItem.imageUrl}
                alt={newsItem.title}
                className="w-full h-full object-cover"
                data-testid="img-news-hero"
              />
            </div>
          )}

          <div className="p-8">
            <header className="mb-8">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="text-news-date">
                    {new Date(newsItem.publishedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span data-testid="text-news-author">
                    GI Lab
                  </span>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4" data-testid="text-news-title">
                {newsItem.title}
              </h1>
            </header>

            <div 
              className="prose prose-lg max-w-none prose-blue prose-headings:text-gray-900 prose-a:text-blue-600 hover:prose-a:text-blue-800"
              dangerouslySetInnerHTML={{ __html: newsItem.content }}
              data-testid="content-news-body"
            />
          </div>
        </article>
      </div>
    </div>
  );
}