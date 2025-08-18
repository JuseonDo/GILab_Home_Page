import { useQuery } from "@tanstack/react-query";
import { Linkedin, Mail, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { Member } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function MembersPage() {
  const { isAuthenticated } = useAuth();
  const { data: membersByLevel, isLoading } = useQuery<{
    masters: Member[];
    bachelors: Member[];
    phd: Member[];
    other: Member[];
  }>({
    queryKey: ["/api/members", { grouped: true }],
    queryFn: async () => {
      const response = await fetch("/api/members?grouped=true");
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
  });

  const MemberCard = ({ member }: { member: Member }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-member-${member.id}`}>
      <CardContent className="p-6">
        <div className="text-center">
          <img
            src={member.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"}
            alt={member.name}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-gray-100"
            data-testid={`img-member-${member.id}`}
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-1" data-testid={`text-member-name-${member.id}`}>
            {member.name}
          </h3>
          <Badge variant="secondary" className="mb-2" data-testid={`badge-member-degree-${member.id}`}>
            {member.degree}
          </Badge>
          <p className="text-sm text-gray-600 mb-3" data-testid={`text-member-duration-${member.id}`}>
            {member.labDuration}
          </p>
          {member.bio && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-3" data-testid={`text-member-bio-${member.id}`}>
              {member.bio}
            </p>
          )}
          <div className="flex justify-center space-x-2">
            {member.email && (
              <Button variant="outline" size="sm" asChild data-testid={`button-member-email-${member.id}`}>
                <a href={`mailto:${member.email}`}>
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            )}
            {member.homepageUrl && (
              <Button variant="outline" size="sm" asChild data-testid={`button-member-homepage-${member.id}`}>
                <a href={member.homepageUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-xl"></div>
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
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="text-members-title">
              Laboratory Members
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto" data-testid="text-members-description">
              Meet our talented research team organized by academic level, working together to advance scientific knowledge.
            </p>
            {isAuthenticated && (
              <div className="mt-8">
                <Link href="/admin">
                  <Button variant="secondary" size="lg" data-testid="button-manage-members">
                    <Plus className="h-5 w-5 mr-2" />
                    Manage Members
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {membersByLevel && (
          <>
            {/* Master's Students */}
            {membersByLevel.masters.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-masters-section">
                  Master's Students
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {membersByLevel.masters.map((member) => (
                    <MemberCard key={member.id} member={member} />
                  ))}
                </div>
              </div>
            )}

            {/* Bachelor's Students */}
            {membersByLevel.bachelors.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-bachelors-section">
                  Bachelor's Students
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {membersByLevel.bachelors.map((member) => (
                    <MemberCard key={member.id} member={member} />
                  ))}
                </div>
              </div>
            )}

            {/* PhD Students */}
            {membersByLevel.phd.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-phd-section">
                  PhD Students
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {membersByLevel.phd.map((member) => (
                    <MemberCard key={member.id} member={member} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Members */}
            {membersByLevel.other.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-other-section">
                  Other Members
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {membersByLevel.other.map((member) => (
                    <MemberCard key={member.id} member={member} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {membersByLevel.masters.length === 0 && 
             membersByLevel.bachelors.length === 0 && 
             membersByLevel.phd.length === 0 && 
             membersByLevel.other.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Linkedin className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2" data-testid="text-no-members-title">
                  No Members Yet
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8" data-testid="text-no-members-description">
                  Laboratory members will be displayed here once they are added to the system.
                </p>
                {isAuthenticated && (
                  <Link href="/admin">
                    <Button data-testid="button-add-first-member">
                      <Plus className="h-5 w-5 mr-2" />
                      Add First Member
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
