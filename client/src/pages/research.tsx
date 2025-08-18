import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Download, Brain, Bot, Dna, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { Publication, Author, ResearchArea } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function ResearchPage() {
  const { isAuthenticated } = useAuth();
  const { data: publications = [], isLoading: publicationsLoading } = useQuery<(Publication & { authors: Author[] })[]>({
    queryKey: ["/api/publications"],
  });

  const { data: researchAreas = [], isLoading: areasLoading } = useQuery<ResearchArea[]>({
    queryKey: ["/api/research-areas"],
  });

  const mainAreas = researchAreas.filter(area => !area.parentId);
  const getSubAreas = (parentId: string) => researchAreas.filter(area => area.parentId === parentId);

  if (publicationsLoading || areasLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-12 bg-blue-400 rounded w-64 mx-auto mb-4"></div>
                <div className="h-6 bg-blue-400 rounded w-96 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse">
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="text-research-title">
              Research & Publications
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto" data-testid="text-research-description">
              Explore our comprehensive research portfolio and discover the cutting-edge work we're doing across various scientific domains.
            </p>
            {isAuthenticated && (
              <div className="mt-8 space-x-4">
                <Link href="/admin">
                  <Button variant="secondary" size="lg" data-testid="button-manage-research">
                    <Plus className="h-5 w-5 mr-2" />
                    Manage Research Areas
                  </Button>
                </Link>
                <Link href="/create-publication">
                  <Button variant="secondary" size="lg" data-testid="button-add-publication">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Publication
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Research Areas */}
        {mainAreas.length > 0 && (
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center" data-testid="text-research-areas-title">
              Research Areas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mainAreas.map((area) => {
                const subAreas = getSubAreas(area.id);
                return (
                  <Card key={area.id} className="hover:shadow-lg transition-shadow" data-testid={`card-research-area-${area.id}`}>
                    <CardHeader>
                      <CardTitle className="text-xl text-gray-900" data-testid={`text-area-title-${area.id}`}>
                        {area.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4" data-testid={`text-area-description-${area.id}`}>
                        {area.description}
                      </p>
                      {subAreas.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Research Focus:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {subAreas.map((subArea) => (
                              <li key={subArea.id} data-testid={`text-subarea-${subArea.id}`}>
                                • {subArea.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Publications */}
        {publications.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center" data-testid="text-publications-title">
              Recent Publications
            </h2>
            <div className="space-y-6">
              {publications.map((publication) => (
                <Card
                  key={publication.id}
                  className="hover:shadow-lg transition-shadow"
                  data-testid={`card-publication-${publication.id}`}
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold"
                          data-testid={`badge-publication-type-${publication.id}`}
                        >
                          {publication.type}
                        </Badge>
                        <span className="text-gray-500 text-sm" data-testid={`text-publication-year-${publication.id}`}>
                          {publication.year}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        {publication.doi && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            data-testid={`button-publication-link-${publication.id}`}
                          >
                            <a href={`https://doi.org/${publication.doi}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    <h3
                      className="text-xl font-bold text-gray-900 mb-3"
                      data-testid={`text-publication-title-${publication.id}`}
                    >
                      {publication.title}
                    </h3>
                    {publication.authors && publication.authors.length > 0 && (
                      <p className="text-gray-600 mb-4" data-testid={`text-publication-authors-${publication.id}`}>
                        {publication.authors.map(author => author.name).join(", ")}
                      </p>
                    )}
                    {publication.venue && (
                      <p className="text-gray-700 mb-4" data-testid={`text-publication-venue-${publication.id}`}>
                        <strong>{publication.venue}</strong>
                      </p>
                    )}
                    {publication.abstract && (
                      <p className="text-gray-600 text-sm" data-testid={`text-publication-abstract-${publication.id}`}>
                        {publication.abstract}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty States */}
        {mainAreas.length === 0 && publications.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2" data-testid="text-no-research-title">
              No Research Content Yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-8" data-testid="text-no-research-description">
              Research areas and publications will be displayed here once they are added to the system.
            </p>
            {isAuthenticated && (
              <div className="space-x-4">
                <Link href="/admin">
                  <Button data-testid="button-add-first-research">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Research Areas
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
