// client/src/pages/members.tsx
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Linkedin, Mail, ExternalLink, Plus, User, Phone, Edit, Upload, MapPin } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import type { Member } from "@/shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ====== Types ======
type LabInfo = {
  id?: string;
  principalInvestigator?: string;
  piTitle?: string;
  piEmail?: string;
  piPhone?: string;
  piPhoto?: string;
  description?: string; // HTML (Quill)
  address?: string;
} | null;

// ====== Schemas ======
const UrlOrRelStatic = z.union([z.string().url(), z.string().regex(/^\/static\/.+/)]);
const memberSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  degree: z.string().min(1, "학위 과정을 입력해주세요"),
  email: z.string().email().optional().or(z.literal("")),
  imageUrl: UrlOrRelStatic.optional().or(z.literal("")),
  homepage: z.string().url().optional().or(z.literal("")),
  bio: z.string().optional(),
  joinedAt: z.string().optional().default(""),
  status: z.string().optional().default("current"), // ★ 추가
});
const professorSchema = z.object({
  principalInvestigator: z.string().min(1, "교수님 이름을 입력해주세요"),
  piTitle: z.string().min(1, "직책을 입력해주세요"),
  piEmail: z.string().email().optional().or(z.literal("")),
  piPhone: z.string().optional(),
  piPhoto: UrlOrRelStatic.optional().or(z.literal("")),
  description: z.string().optional(),
  address: z.string().min(1, "주소를 입력해주세요"),
});

type MemberFormData = z.infer<typeof memberSchema>;
type ProfessorFormData = z.infer<typeof professorSchema>;

export default function MembersPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditProfessor, setShowEditProfessor] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // ====== Queries ======
  const { data: membersByLevelRaw, isLoading } = useQuery<{
    masters?: Member[];
    bachelors?: Member[];
    phd?: Member[];
    other?: Member[];
  }>({
    queryKey: ["/members", { grouped: true }],
    queryFn: async () => {
      const response = await fetch("/api/members?grouped=true");
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
  });

  const membersByLevel = useMemo(
    () => ({
      masters: membersByLevelRaw?.masters ?? [],
      bachelors: membersByLevelRaw?.bachelors ?? [],
      phd: membersByLevelRaw?.phd ?? [],
      other: membersByLevelRaw?.other ?? [],
    }),
    [membersByLevelRaw]
  );

  // lab info (교수님 정보)
  const { data: labInfo, isLoading: labInfoLoading } = useQuery<LabInfo>({
    queryKey: ["/lab-info"],
    queryFn: async () => {
      const response = await fetch("/api/lab-info");
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch lab info");
      return response.json();
    },
  });

  // ====== Forms ======
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", degree: "masters", email: "", imageUrl: "", homepage: "", bio: "", joinedAt: "", status: "current" },

  });

  const professorForm = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: { principalInvestigator: "", piTitle: "", piEmail: "", piPhone: "", piPhoto: "", description: "", address: "" },
  });

  // labInfo 수신 후 폼 초기화
  useEffect(() => {
    if (!labInfoLoading) {
      professorForm.reset({
        principalInvestigator: labInfo?.principalInvestigator || "",
        piTitle: labInfo?.piTitle || "",
        piEmail: labInfo?.piEmail || "",
        piPhone: labInfo?.piPhone || "",
        piPhoto: labInfo?.piPhoto || "",
        description: labInfo?.description || "",
        address: labInfo?.address || "",
      });
      setPreviewUrl(labInfo?.piPhoto || "");
    }
  }, [labInfo, labInfoLoading, professorForm]);

  // ====== Mutations ======
  const createMemberMutation = useMutation({
    mutationFn: (data: MemberFormData) => apiRequest("POST", "/members", data),
    onSuccess: () => {
      toast({ title: "멤버 추가 완료", description: "새 멤버가 성공적으로 추가되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/members"] });
      setShowAddForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "멤버 추가 실패", description: error?.message || "멤버 추가 중 오류가 발생했습니다.", variant: "destructive" });
    },
  });

  const upsertProfessorMutation = useMutation({
    mutationFn: (data: ProfessorFormData) => {
      const base = labInfo ?? {
        labName: "My Lab",
        address: "Unknown Address",
        university: "Unknown University",
        department: "Unknown Department",
        contactEmail: "admin@example.com",
        website: "",
        establishedYear: "",
        researchFocus: "",
        contactPhone: "",
        officeHours: "",
        latitude: "",
        longitude: "",
        building: "",
        room: "",
        piBio: "",
        description: "",
        piEmail: "",
        piPhone: "",
        piPhoto: "",
        piTitle: "",
        principalInvestigator: "",
      };
      const body = {
        ...base,
        principalInvestigator: data.principalInvestigator,
        piTitle: data.piTitle,
        piEmail: data.piEmail || "",
        piPhone: data.piPhone || "",
        piPhoto: data.piPhoto || "",
        description: data.description || "",
        address: data.address,
      };
      return apiRequest("PUT", "/lab-info", body);
    },
    onSuccess: () => {
      toast({ title: "교수님 정보 저장 완료", description: "정보가 성공적으로 저장되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/lab-info"] });
      setShowEditProfessor(false);
    },
    onError: (error: any) => {
      toast({ title: "교수님 정보 저장 실패", description: error?.message || "요청 중 오류가 발생했습니다.", variant: "destructive" });
    },
  });

  const onSubmit = (data: MemberFormData) => createMemberMutation.mutate(data);
  const onProfessorSubmit = (data: ProfessorFormData) => upsertProfessorMutation.mutate(data);

  // ====== 이미지 업로드 ======
  const handleUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("이미지 업로드 실패");
      const { url } = await res.json();
      professorForm.setValue("piPhoto", url, { shouldDirty: true });
      setPreviewUrl(url);
      toast({ title: "업로드 성공", description: "프로필 사진이 저장되었습니다." });
    } catch (e: any) {
      toast({ title: "업로드 실패", description: e?.message || "업로드 중 오류", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleMemberUpload = async (file: File | null) => {
  if (!file) return;
  try {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) throw new Error("이미지 업로드 실패");
    const { url } = await res.json();
    form.setValue("imageUrl", url, { shouldDirty: true });
    toast({ title: "업로드 성공", description: "멤버 프로필 사진이 저장되었습니다." });
  } catch (e: any) {
    toast({ title: "업로드 실패", description: e?.message || "업로드 중 오류", variant: "destructive" });
  } finally {
    setUploading(false);
  }
};

  // ====== Member Card ======
  const MemberCard = ({ member }: { member: Member }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="text-center">
          <img
            src={
              member.imageUrl ||
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300"
            }
            alt={member.name}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-2 border-gray-100"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300";
            }}
            data-testid={`img-member-${member.id}`}
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-1" data-testid={`text-member-name-${member.id}`}>
            {member.name}
          </h3>
          <Badge variant="secondary" className="mb-2" data-testid={`badge-member-degree-${member.id}`}>
            {member.degree}
          </Badge>
          <p className="text-sm text-gray-600 mb-3" data-testid={`text-member-duration-${member.id}`}>
            {member.status && (
              <Badge variant="outline" className="mb-2" data-testid={`badge-member-status-${member.id}`}>
                {member.status}
              </Badge>
            )}
            {/* 상태 배지 추가 */}
            {member.status && (
              <Badge variant="outline" className="mb-2" data-testid={`badge-member-status-${member.id}`}>
                {member.status}
              </Badge>
            )}
            {member.joinedAt && (
              <p className="text-xs text-gray-500 mb-3" data-testid={`text-member-duration-${member.id}`}>
                {member.joinedAt}
              </p>
            )}
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

  // ====== Loading Skeleton ======
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

  // ====== Render ======
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="text-members-title">
              Laboratory Members
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto" data-testid="text-members-description">
              {/* Meet our talented research team organized by academic level, working together to advance scientific knowledge. */}
            </p>
          </div>
        </div>
      </div>

      {/* 본문 컨테이너 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 지도교수 섹션 */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg [container-type:inline-size]">
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
                    {labInfo ? "정보 수정" : "정보 추가"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {labInfo ? (
                <div className="grid items-start gap-6 md:grid-cols-[auto,1fr]">
                  {/* 왼쪽: 사진 */}
                  <div className="flex justify-center md:justify-start">
                    {labInfo.piPhoto ? (
                      <img
                        src={
                          labInfo.piPhoto ||
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300"
                        }
                        alt={labInfo.principalInvestigator}
                        className="rounded-full object-cover border-4 border-white shadow-lg aspect-square"
                        style={{
                          width: "clamp(96px, 22cqw, 176px)",
                          height: "clamp(96px, 22cqw, 176px)",
                        } as React.CSSProperties}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&h=300";
                        }}
                      />
                    ) : (
                      <div className="w-[clamp(96px,22cqw,176px)] h-[clamp(96px,22cqw,176px)] rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center border-4 border-white shadow-lg">
                        <User className="h-20 w-20 text-white" />
                      </div>
                    )}
                  </div>

                  {/* 오른쪽: 텍스트 */}
                  <div className="space-y-4">
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
                        <a href={`mailto:${labInfo.piEmail}`} className="hover:text-blue-600 transition-colors" data-testid="link-professor-email">
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
                    {labInfo.address && (
                      <div className="flex items-center text-gray-700">
                        <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                        <span data-testid="text-professor-address">{labInfo.address}</span>
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
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-200 to-indigo-200 flex items-center justify-center">
                      <User className="h-10 w-10 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg text-gray-700">아직 등록된 교수님 정보가 없습니다.</p>
                      <p className="text-sm text-gray-500">관리자 권한으로 “정보 추가” 버튼을 눌러 정보를 등록하세요.</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button onClick={() => setShowEditProfessor(true)} variant="secondary">
                      <Plus className="h-4 w-4 mr-2" />
                      정보 추가
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* (관리자) 멤버 추가 버튼 */}
        {isAdmin && (
          <div className="mb-12 text-center">
            <Button variant="secondary" size="lg" onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-member">
              <Plus className="h-5 w-5 mr-2" />
              {showAddForm ? "취소" : "멤버 추가"}
            </Button>
          </div>
        )}

        {/* (관리자) 멤버 추가 폼 — 스크롤 본문 + 스티키 액션바 */}
        {showAddForm && isAdmin && (
          <div className="mb-16">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm p-0 overflow-hidden">
              <CardHeader className="px-6 pt-6 pb-3">
                <CardTitle className="text-2xl">새 멤버 추가</CardTitle>
              </CardHeader>

              <div className="max-h-[70vh] overflow-y-auto px-6 pb-6">
                <Form {...form}>
                  <form id="member-create-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>현재 상태</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="예: 재학중 / 네이버 인턴 중 / 졸업" className="h-10" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>사진 URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="업로드를 하면 자동으로 채워져요" className="h-10" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-end">
                          <label className="inline-flex items-center px-3 py-2 border rounded-md cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? "업로드 중..." : "파일 업로드"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleMemberUpload(e.target.files?.[0] || null)}
                              disabled={uploading}
                            />
                          </label>
                        </div>
                      </div>
                      {form.watch("imageUrl") && (
                        <div className="md:col-span-2 flex items-center gap-4">
                          <img
                            src={form.watch("imageUrl")}
                            alt="미리보기"
                            className="w-20 h-20 rounded-full object-cover border"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                          <span className="text-sm text-gray-600 break-all">{form.watch("imageUrl")}</span>
                        </div>
                      )}
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
                                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                                      ["bold", "italic", "underline", "strike"],
                                      [{ color: [] }, { background: [] }],
                                      [{ list: "ordered" }, { list: "bullet" }],
                                      [{ indent: "-1" }, { indent: "+1" }],
                                      [{ align: [] }],
                                      ["link"],
                                      ["clean"],
                                    ],
                                  }}
                                  formats={[
                                    "header",
                                    "bold",
                                    "italic",
                                    "underline",
                                    "strike",
                                    "color",
                                    "background",
                                    "list",
                                    "bullet",
                                    "indent",
                                    "align",
                                    "link",
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
                  </form>
                </Form>
              </div>

              <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t px-6 py-4 flex gap-4">
                <Button type="submit" form="member-create-form" disabled={createMemberMutation.isPending} data-testid="button-submit-member">
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
            </Card>
          </div>
        )}

        {/* 멤버 리스트 */}
        <>
          {membersByLevel.masters.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-masters-section">
                Master's Students
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {membersByLevel.masters.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            </div>
          )}

          {membersByLevel.bachelors.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-bachelors-section">
                Bachelor's Students
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {membersByLevel.bachelors.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            </div>
          )}

          {membersByLevel.phd.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-phd-section">
                PhD Students
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {membersByLevel.phd.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            </div>
          )}

          {membersByLevel.other.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-other-section">
                Other Members
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {membersByLevel.other.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            </div>
          )}

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
      </div>

      {/* 교수님 정보 수정/추가 Dialog — 스크롤 본문 + 스티키 푸터 */}
      <Dialog open={showEditProfessor} onOpenChange={setShowEditProfessor}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-3">
            <DialogTitle>{labInfo ? "교수님 정보 수정" : "교수님 정보 추가"}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto px-6 pb-6">
            <Form {...professorForm}>
              <form id="professor-edit-form" onSubmit={professorForm.handleSubmit(onProfessorSubmit)} className="space-y-6">
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
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>주소 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="예: 대전광역시 유성구 대학로 99, 공대 1호관 123호" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* 업로드 + 미리보기 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <FormField
                    control={professorForm.control}
                    name="piPhoto"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>프로필 사진 URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="프로필 사진 URL을 입력하거나 아래에서 업로드하세요" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center px-3 py-2 border rounded-md cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "업로드 중..." : "파일 업로드"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>

                {previewUrl && (
                  <div className="flex gap-4 items-center">
                    <img src={previewUrl} alt="미리보기" className="w-24 h-24 rounded-full object-cover border" />
                    <span className="text-sm text-gray-600 break-all">{previewUrl}</span>
                  </div>
                )}

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
                                [{ header: [1, 2, 3, false] }],
                                ["bold", "italic", "underline", "strike"],
                                [{ color: [] }, { background: [] }],
                                [{ list: "ordered" }, { list: "bullet" }],
                                [{ align: [] }],
                                ["link"],
                                ["clean"],
                              ],
                            }}
                            formats={["header", "bold", "italic", "underline", "strike", "color", "background", "list", "bullet", "align", "link"]}
                            placeholder="교수님 소개를 입력하세요"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t px-6 py-4 flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setShowEditProfessor(false)}>
              취소
            </Button>
            <Button type="submit" form="professor-edit-form" disabled={upsertProfessorMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
              {upsertProfessorMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
