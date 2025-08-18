import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Linkedin, Mail, ExternalLink, Plus, X, User, Phone, Edit } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import type { Member } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const memberSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  degree: z.string().min(1, "학위 과정을 입력해주세요"),
  email: z.string().email().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  homepage: z.string().url().optional().or(z.literal("")),
  bio: z.string().optional(),
  joinedAt: z.string().min(1, "연구실 재학기간을 입력해주세요"),
});

const professorSchema = z.object({
  principalInvestigator: z.string().min(1, "교수님 이름을 입력해주세요"),
  piTitle: z.string().min(1, "직책을 입력해주세요"),
  piEmail: z.string().email().optional().or(z.literal("")),
  piPhone: z.string().optional(),
  piPhoto: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;
type ProfessorFormData = z.infer<typeof professorSchema>;

export default function MembersPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditProfessor, setShowEditProfessor] = useState(false);
  
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

  // Fetch lab info for professor information
  const { data: labInfo, isLoading: labInfoLoading } = useQuery({
    queryKey: ["/api/lab-info"],
  });

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      degree: "masters",
      email: "",
      photoUrl: "",
      homepageUrl: "",
      bio: "",
      labDuration: "",
    },
  });

  const professorForm = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      principalInvestigator: "",
      piTitle: "",
      piEmail: "",
      piPhone: "",
      piPhoto: "",
      description: "",
    },
  });

  // Set professor form values when labInfo is loaded
  useEffect(() => {
    if (labInfo && !labInfoLoading) {
      professorForm.reset({
        principalInvestigator: labInfo.principalInvestigator || "",
        piTitle: labInfo.piTitle || "",
        piEmail: labInfo.piEmail || "",
        piPhone: labInfo.piPhone || "",
        piPhoto: labInfo.piPhoto || "",
        description: labInfo.description || "",
      });
    }
  }, [labInfo, labInfoLoading]);

  const createMemberMutation = useMutation({
    mutationFn: (data: MemberFormData) => {
      return apiRequest("POST", "/api/members", data);
    },
    onSuccess: () => {
      toast({
        title: "멤버 추가 완료",
        description: "새 멤버가 성공적으로 추가되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setShowAddForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "멤버 추가 실패",
        description: error.message || "멤버 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateProfessorMutation = useMutation({
    mutationFn: (data: ProfessorFormData) => {
      // Merge professor data with existing labInfo
      const updateData = {
        ...labInfo,
        ...data,
      };
      return apiRequest("PUT", "/api/lab-info", updateData);
    },
    onSuccess: () => {
      toast({
        title: "교수님 정보 수정 완료",
        description: "교수님 정보가 성공적으로 수정되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lab-info"] });
      setShowEditProfessor(false);
    },
    onError: (error: any) => {
      toast({
        title: "교수님 정보 수정 실패",
        description: error.message || "교수님 정보 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MemberFormData) => {
    createMemberMutation.mutate(data);
  };

  const onProfessorSubmit = (data: ProfessorFormData) => {
    updateProfessorMutation.mutate(data);
  };

  const MemberCard = ({ member }: { member: Member }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-member-${member.id}`}>
      <CardContent className="p-6">
        <div className="text-center">
          <img
            src={member.imageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"}
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
            {member.joinedAt}
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
            {member.homepage && (
              <Button variant="outline" size="sm" asChild data-testid={`button-member-homepage-${member.id}`}>
                <a href={member.homepage} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading || labInfoLoading) {
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
            {isAdmin && (
              <div className="mt-8">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  onClick={() => setShowAddForm(!showAddForm)}
                  data-testid="button-add-member"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {showAddForm ? "취소" : "멤버 추가"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Professor Section - Main, prominently displayed */}
        {labInfo && (
          <div className="mb-12">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">지도교수</h2>
                  {isAdmin && (
                    <Button
                      onClick={() => setShowEditProfessor(true)}
                      data-testid="button-edit-professor"
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      정보 수정
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  <div className="flex justify-center">
                    {labInfo.piPhoto ? (
                      <img
                        src={labInfo.piPhoto}
                        alt={labInfo.principalInvestigator}
                        data-testid="img-professor-photo"
                        className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="h-20 w-20 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-professor-name">
                        {labInfo.principalInvestigator}
                      </h3>
                      <p className="text-lg text-blue-700 font-medium" data-testid="text-professor-title">
                        {labInfo.piTitle}
                      </p>
                    </div>
                    {labInfo.piEmail && (
                      <div className="flex items-center text-gray-700">
                        <Mail className="h-5 w-5 mr-2 text-blue-600" />
                        <a
                          href={`mailto:${labInfo.piEmail}`}
                          className="hover:text-blue-600 transition-colors"
                          data-testid="link-professor-email"
                        >
                          {labInfo.piEmail}
                        </a>
                      </div>
                    )}
                    {labInfo.piPhone && (
                      <div className="flex items-center text-gray-700">
                        <Phone className="h-5 w-5 mr-2 text-blue-600" />
                        <span data-testid="text-professor-phone">{labInfo.piPhone}</span>
                      </div>
                    )}
                    {labInfo.description && (
                      <div className="mt-4">
                        <div 
                          className="text-gray-700 leading-relaxed prose prose-sm max-w-none" 
                          data-testid="text-professor-description"
                          dangerouslySetInnerHTML={{ __html: labInfo.description }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Member Form */}
        {showAddForm && isAdmin && (
          <div className="mb-16">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">새 멤버 추가</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이름 *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="멤버 이름을 입력하세요" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="degree"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>학위 과정 *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="학위 과정 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bachelors">학부생</SelectItem>
                                <SelectItem value="masters">석사과정</SelectItem>
                                <SelectItem value="phd">박사과정</SelectItem>
                                <SelectItem value="other">기타</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="joinedAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>연구실 재학기간 *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="2021.03 ~ 현재" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이메일</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="example@email.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>사진 URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://example.com/photo.jpg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="homepage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>홈페이지 URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://example.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>소개</FormLabel>
                            <FormControl>
                              <div className="min-h-[200px]">
                                <ReactQuill
                                  theme="snow"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                  modules={{
                                    toolbar: [
                                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                      ['bold', 'italic', 'underline', 'strike'],
                                      [{ 'color': [] }, { 'background': [] }],
                                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                      [{ 'indent': '-1'}, { 'indent': '+1' }],
                                      [{ 'align': [] }],
                                      ['link'],
                                      ['clean']
                                    ],
                                  }}
                                  formats={[
                                    'header',
                                    'bold', 'italic', 'underline', 'strike',
                                    'color', 'background',
                                    'list', 'bullet',
                                    'indent',
                                    'align',
                                    'link'
                                  ]}
                                  placeholder="멤버 소개를 입력하세요"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-4 pt-6">
                      <Button 
                        type="submit" 
                        disabled={createMemberMutation.isPending}
                        data-testid="button-submit-member"
                      >
                        {createMemberMutation.isPending ? "추가 중..." : "멤버 추가"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowAddForm(false);
                          form.reset();
                        }}
                      >
                        취소
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}

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

      {/* Professor Edit Dialog */}
      <Dialog open={showEditProfessor} onOpenChange={setShowEditProfessor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>교수님 정보 수정</DialogTitle>
          </DialogHeader>
          <Form {...professorForm}>
            <form onSubmit={professorForm.handleSubmit(onProfessorSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={professorForm.control}
                  name="principalInvestigator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>교수님 성함 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="교수님 이름을 입력하세요" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={professorForm.control}
                  name="piTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>직책 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="예: 교수, 부교수, 조교수" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={professorForm.control}
                  name="piEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>이메일</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="professor@university.edu" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={professorForm.control}
                  name="piPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>전화번호</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="연락처를 입력하세요" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={professorForm.control}
                name="piPhoto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>프로필 사진 URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="프로필 사진 URL을 입력하세요" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={professorForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>소개</FormLabel>
                    <FormControl>
                      <div className="min-h-[200px]">
                        <ReactQuill
                          theme="snow"
                          value={field.value || ""}
                          onChange={field.onChange}
                          modules={{
                            toolbar: [
                              [{ 'header': [1, 2, 3, false] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ 'color': [] }, { 'background': [] }],
                              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                              [{ 'align': [] }],
                              ['link'],
                              ['clean']
                            ],
                          }}
                          formats={[
                            'header',
                            'bold', 'italic', 'underline', 'strike',
                            'color', 'background',
                            'list', 'bullet',
                            'align',
                            'link'
                          ]}
                          placeholder="교수님 소개를 입력하세요"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditProfessor(false)}
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProfessorMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateProfessorMutation.isPending ? "저장 중..." : "저장"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
