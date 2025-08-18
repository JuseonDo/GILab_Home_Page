import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPublicationSchema, insertResearchAreaSchema, type Publication, type ResearchArea } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ExternalLink, Download, Trash2, Edit, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

type PublicationFormData = z.infer<typeof insertPublicationSchema>;
type ResearchAreaFormData = z.infer<typeof insertResearchAreaSchema>;

export default function Research() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [editingPublication, setEditingPublication] = useState<string | null>(null);
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.email === "gilab@admin.com";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: publications = [], isLoading: publicationsLoading } = useQuery<Publication[]>({
    queryKey: ["/api/publications"],
  });

  const sortedPublications = publications.sort((a, b) => (a.order || 0) - (b.order || 0));

  const { data: researchAreas = [], isLoading: areasLoading } = useQuery<ResearchArea[]>({
    queryKey: ["/api/research-areas"],
  });

  const form = useForm<PublicationFormData>({
    resolver: zodResolver(insertPublicationSchema),
    defaultValues: {
      title: "",
      authors: [{ name: "", homepage: "" }],
      type: "journal",
      year: new Date().getFullYear(),
      journal: "",
      conference: "",
      url: "",
      pdfUrl: "",
      imageUrl: "",
    },
  });

  const areaForm = useForm<ResearchAreaFormData>({
    resolver: zodResolver(insertResearchAreaSchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: undefined,
    },
  });

  const editPublicationForm = useForm<PublicationFormData>({
    resolver: zodResolver(insertPublicationSchema),
  });

  const editAreaForm = useForm<ResearchAreaFormData>({
    resolver: zodResolver(insertResearchAreaSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "authors",
  });

  const publicationType = form.watch("type");

  const createPublicationMutation = useMutation({
    mutationFn: async (data: PublicationFormData) => {
      return apiRequest("/api/publications", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "논문 게시 완료",
        description: "논문이 성공적으로 게시되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/publications"] });
      setShowAddForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "논문 게시 실패",
        description: error.message || "논문 게시 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const createResearchAreaMutation = useMutation({
    mutationFn: async (data: ResearchAreaFormData) => {
      return apiRequest("/api/research-areas", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "연구분야 추가 완료",
        description: "연구분야가 성공적으로 추가되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/research-areas"] });
      setShowAreaForm(false);
      areaForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "연구분야 추가 실패",
        description: error.message || "연구분야 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const movePublicationMutation = useMutation({
    mutationFn: async (data: { id: string; direction: 'up' | 'down' }) => {
      const currentIndex = sortedPublications.findIndex(p => p.id === data.id);
      if (currentIndex === -1) return;
      
      let newOrder;
      if (data.direction === 'up' && currentIndex > 0) {
        // Move up: use previous item's order - 1
        const prevPublication = sortedPublications[currentIndex - 1];
        newOrder = (prevPublication.order || 0) - 1;
      } else if (data.direction === 'down' && currentIndex < sortedPublications.length - 1) {
        // Move down: use next item's order + 1
        const nextPublication = sortedPublications[currentIndex + 1];
        newOrder = (nextPublication.order || 0) + 1;
      } else {
        return; // Can't move
      }
      
      return apiRequest(`/api/publications/${data.id}/order`, "PUT", { order: newOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publications"] });
      toast({
        title: "순서 변경 완료",
        description: "논문 순서가 성공적으로 변경되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "순서 변경 실패",
        description: error.message || "논문 순서 변경에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const updatePublicationMutation = useMutation({
    mutationFn: async (data: { id: string; publication: PublicationFormData }) => {
      return apiRequest(`/api/publications/${data.id}`, "PUT", data.publication);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publications"] });
      setEditingPublication(null);
      toast({
        title: "논문 수정 완료",
        description: "논문이 성공적으로 수정되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "논문 수정 실패",
        description: error.message || "논문 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deletePublicationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/publications/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publications"] });
      toast({
        title: "논문 삭제 완료",
        description: "논문이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "논문 삭제 실패",
        description: error.message || "논문 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const deleteResearchAreaMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/research-areas/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research-areas"] });
      toast({
        title: "연구분야 삭제 완료",
        description: "연구분야가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "연구분야 삭제 실패",
        description: error.message || "연구분야 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const updateResearchAreaMutation = useMutation({
    mutationFn: async (data: { id: string; area: ResearchAreaFormData }) => {
      return apiRequest(`/api/research-areas/${data.id}`, "PUT", data.area);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/research-areas"] });
      setEditingArea(null);
      toast({
        title: "연구분야 수정 완료",
        description: "연구분야가 성공적으로 수정되었습니다.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "연구분야 수정 실패",
        description: error.message || "연구분야 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PublicationFormData) => {
    createPublicationMutation.mutate(data);
  };

  const onAreaSubmit = (data: ResearchAreaFormData) => {
    createResearchAreaMutation.mutate(data);
  };

  const onEditPublicationSubmit = (data: PublicationFormData) => {
    if (editingPublication) {
      updatePublicationMutation.mutate({ id: editingPublication, publication: data });
    }
  };

  const onEditAreaSubmit = (data: ResearchAreaFormData) => {
    if (editingArea) {
      updateResearchAreaMutation.mutate({ id: editingArea, area: data });
    }
  };

  const startEditingPublication = (publication: Publication) => {
    setEditingPublication(publication.id);
    editPublicationForm.reset({
      title: publication.title,
      authors: publication.authors || [{ name: "", homepage: "" }],
      type: publication.type,
      year: publication.year,
      journal: publication.journal || "",
      conference: publication.conference || "",
      abstract: publication.abstract || "",
      url: publication.url || "",
      pdfUrl: publication.pdfUrl || "",
      imageUrl: publication.imageUrl || "",
    });
  };

  const startEditingArea = (area: ResearchArea) => {
    setEditingArea(area.id);
    editAreaForm.reset({
      name: area.name,
      description: area.description || "",
      parentId: area.parentId || undefined,
    });
  };

  const cancelEditingPublication = () => {
    setEditingPublication(null);
    editPublicationForm.reset();
  };

  const cancelEditingArea = () => {
    setEditingArea(null);
    editAreaForm.reset();
  };

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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Add Research Area Form */}
        {showAreaForm && isAdmin && (
          <div className="mb-16">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">새 연구분야 추가</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...areaForm}>
                  <form onSubmit={areaForm.handleSubmit(onAreaSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={areaForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>연구분야명 *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="연구분야명을 입력하세요" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={areaForm.control}
                        name="parentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>상위 연구분야</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="상위 연구분야 선택 (선택사항)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">없음 (최상위 연구분야)</SelectItem>
                                {mainAreas.map((area) => (
                                  <SelectItem key={area.id} value={area.id}>
                                    {area.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={areaForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>설명</FormLabel>
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
                                  placeholder="연구분야에 대한 설명을 입력하세요"
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
                        disabled={createResearchAreaMutation.isPending}
                        data-testid="button-submit-research-area"
                      >
                        {createResearchAreaMutation.isPending ? "추가 중..." : "연구분야 추가"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowAreaForm(false);
                          areaForm.reset();
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

        {/* Edit Research Area Form */}
        {editingArea && isAdmin && (
          <div className="mb-16">
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">연구분야 수정</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...editAreaForm}>
                  <form onSubmit={editAreaForm.handleSubmit(onEditAreaSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={editAreaForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>연구분야명 *</FormLabel>
                            <FormControl>
                              <Input placeholder="AI 연구실" {...field} data-testid="input-edit-area-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editAreaForm.control}
                        name="parentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>상위 연구분야</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger data-testid="select-edit-area-parent">
                                  <SelectValue placeholder="상위 분야 선택 (선택사항)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">독립 연구분야</SelectItem>
                                {mainAreas.map((area) => (
                                  <SelectItem key={area.id} value={area.id}>
                                    {area.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editAreaForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>설명</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <ReactQuill
                                value={field.value || ""}
                                onChange={field.onChange}
                                modules={{
                                  toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
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
                                placeholder="연구분야에 대한 설명을 입력하세요"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4 pt-6">
                      <Button 
                        type="submit" 
                        disabled={updateResearchAreaMutation.isPending}
                        data-testid="button-submit-edit-area"
                      >
                        {updateResearchAreaMutation.isPending ? "수정 중..." : "수정 완료"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={cancelEditingArea}
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

        {/* Research Areas */}
        <div className="mb-20">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 text-center flex-1" data-testid="text-research-areas-title">
              Research Areas
            </h2>
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAreaForm(!showAreaForm)}
                data-testid="button-add-research-area"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAreaForm ? "취소" : "연구분야 추가"}
              </Button>
            )}
          </div>
          {mainAreas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mainAreas.map((area) => {
                const subAreas = getSubAreas(area.id);
                return (
                  <Card key={area.id} className="hover:shadow-lg transition-shadow group" data-testid={`card-research-area-${area.id}`}>
                    <CardHeader className="relative">
                      <CardTitle className="text-xl text-gray-900 pr-12" data-testid={`text-area-title-${area.id}`}>
                        {area.name}
                      </CardTitle>
                      {isAdmin && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingArea(area)}
                            className="hover:bg-blue-100 hover:text-blue-600 shadow-lg bg-white/90"
                            title="편집"
                            data-testid={`button-edit-area-${area.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteResearchAreaMutation.mutate(area.id)}
                            className="hover:bg-red-100 hover:text-red-600 shadow-lg bg-white/90"
                            title="삭제"
                            data-testid={`button-delete-area-${area.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="text-gray-600 mb-4" 
                        data-testid={`text-area-description-${area.id}`}
                        dangerouslySetInnerHTML={{ __html: area.description || "" }}
                      />
                      {subAreas.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Research Focus:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {subAreas.map((subArea) => (
                              <li key={subArea.id} data-testid={`text-subarea-${subArea.id}`}>
                                • {subArea.name}
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
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">아직 연구분야가 등록되지 않았습니다.</p>
              {isAdmin && (
                <Button 
                  variant="outline"
                  onClick={() => setShowAreaForm(true)}
                  data-testid="button-add-first-research-area"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  첫 번째 연구분야 추가
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Publications */}
        <div>
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 text-center flex-1" data-testid="text-publications-title">
              Recent Publications
            </h2>
            {isAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                data-testid="button-add-publication-section"
              >
                <Plus className="h-4 w-4 mr-2" />
                {showAddForm ? "취소" : "논문 추가"}
              </Button>
            )}
          </div>

          {/* Add Publication Form */}
          {showAddForm && isAdmin && (
            <div className="mb-16">
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">새 논문 추가</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>제목 *</FormLabel>
                              <FormControl>
                                <div className="min-h-[100px]">
                                  <ReactQuill
                                    theme="snow"
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    modules={{
                                      toolbar: [
                                        ['bold', 'italic', 'underline'],
                                        [{ 'color': [] }],
                                        ['clean']
                                      ],
                                    }}
                                    formats={[
                                      'bold', 'italic', 'underline',
                                      'color'
                                    ]}
                                    placeholder="논문 제목을 입력하세요"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>유형 *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="논문 유형 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="journal">저널 논문</SelectItem>
                                  <SelectItem value="conference">학회 논문</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>출간 연도 *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  type="number"
                                  min="1900"
                                  max={new Date().getFullYear() + 10}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value ? parseInt(value) : undefined);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {publicationType === "journal" && (
                          <FormField
                            control={form.control}
                            name="journal"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>저널명</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="저널명을 입력하세요" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {publicationType === "conference" && (
                          <FormField
                            control={form.control}
                            name="conference"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>학회명</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="학회명을 입력하세요" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>논문 URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://example.com/paper" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="pdfUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PDF URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://example.com/paper.pdf" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>이미지 URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://example.com/image.jpg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="md:col-span-2">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <FormLabel>저자 *</FormLabel>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ name: "", homepage: "" })}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                저자 추가
                              </Button>
                            </div>
                            {fields.map((item, index) => (
                              <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                                <FormField
                                  control={form.control}
                                  name={`authors.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>저자명</FormLabel>
                                      <FormControl>
                                        <div className="min-h-[80px]">
                                          <ReactQuill
                                            theme="snow"
                                            value={field.value || ""}
                                            onChange={field.onChange}
                                            modules={{
                                              toolbar: [
                                                ['bold', 'italic', 'underline'],
                                                [{ 'color': [] }],
                                                ['clean']
                                              ],
                                            }}
                                            formats={[
                                              'bold', 'italic', 'underline',
                                              'color'
                                            ]}
                                            placeholder="저자 이름"
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`authors.${index}.homepage`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>홈페이지</FormLabel>
                                      <div className="flex gap-2">
                                        <FormControl>
                                          <Input {...field} placeholder="https://example.com" />
                                        </FormControl>
                                        {fields.length > 1 && (
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => remove(index)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-6">
                        <Button 
                          type="submit" 
                          disabled={createPublicationMutation.isPending}
                          data-testid="button-submit-publication"
                        >
                          {createPublicationMutation.isPending ? "게시 중..." : "논문 게시"}
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

          {/* Edit Publication Form */}
          {editingPublication && isAdmin && (
            <div className="mb-16">
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">논문 수정</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...editPublicationForm}>
                    <form onSubmit={editPublicationForm.handleSubmit(onEditPublicationSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={editPublicationForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>제목 *</FormLabel>
                              <FormControl>
                                <div className="min-h-[100px]">
                                  <ReactQuill
                                    theme="snow"
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    modules={{
                                      toolbar: [
                                        ['bold', 'italic', 'underline'],
                                        [{ 'color': [] }],
                                        ['clean']
                                      ],
                                    }}
                                    formats={[
                                      'bold', 'italic', 'underline',
                                      'color'
                                    ]}
                                    placeholder="논문 제목을 입력하세요"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editPublicationForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>유형 *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="논문 유형 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="journal">저널 논문</SelectItem>
                                  <SelectItem value="conference">학회 논문</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editPublicationForm.control}
                          name="year"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>출간 연도 *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field}
                                  type="number"
                                  min="1900"
                                  max={new Date().getFullYear() + 10}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value ? parseInt(value) : undefined);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {editPublicationForm.watch("type") === "journal" && (
                          <FormField
                            control={editPublicationForm.control}
                            name="journal"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>저널명</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="저널명을 입력하세요" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {editPublicationForm.watch("type") === "conference" && (
                          <FormField
                            control={editPublicationForm.control}
                            name="conference"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>학회명</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="학회명을 입력하세요" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={editPublicationForm.control}
                          name="url"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>논문 URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://example.com/paper" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editPublicationForm.control}
                          name="pdfUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PDF URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://example.com/paper.pdf" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={editPublicationForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>이미지 URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://example.com/image.jpg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={editPublicationForm.control}
                        name="abstract"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>초록</FormLabel>
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
                                      ['link'],
                                      ['clean']
                                    ],
                                  }}
                                  formats={[
                                    'header',
                                    'bold', 'italic', 'underline', 'strike',
                                    'color', 'background',
                                    'list', 'bullet',
                                    'link'
                                  ]}
                                  placeholder="논문의 초록을 입력하세요"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-4 pt-6">
                        <Button 
                          type="submit" 
                          disabled={updatePublicationMutation.isPending}
                          data-testid="button-submit-edit-publication"
                        >
                          {updatePublicationMutation.isPending ? "수정 중..." : "수정 완료"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={cancelEditingPublication}
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

          {sortedPublications.length > 0 ? (
            <div className="space-y-6">
              {sortedPublications.map((publication, index) => (
                <Card
                  key={publication.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden"
                  data-testid={`card-publication-${publication.id}`}
                >
                  <CardContent className="p-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant="secondary"
                          className="text-xs font-semibold group-hover:bg-blue-100 group-hover:text-blue-800 transition-colors"
                          data-testid={`badge-publication-type-${publication.id}`}
                        >
                          {publication.type}
                        </Badge>
                        <span className="text-gray-500 text-sm group-hover:text-gray-700 transition-colors" data-testid={`text-publication-year-${publication.id}`}>
                          {publication.year}
                        </span>
                      </div>
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {isAdmin && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingPublication(publication)}
                              className="hover:bg-blue-100 hover:text-blue-600"
                              title="수정"
                              data-testid={`button-edit-${publication.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => movePublicationMutation.mutate({ id: publication.id, direction: 'up' })}
                              disabled={index === 0 || movePublicationMutation.isPending}
                              className="hover:bg-gray-100"
                              title="위로 이동"
                              data-testid={`button-move-up-${publication.id}`}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => movePublicationMutation.mutate({ id: publication.id, direction: 'down' })}
                              disabled={index === sortedPublications.length - 1 || movePublicationMutation.isPending}
                              className="hover:bg-gray-100"
                              title="아래로 이동"
                              data-testid={`button-move-down-${publication.id}`}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePublicationMutation.mutate(publication.id)}
                              className="hover:bg-red-100 hover:text-red-600"
                              title="삭제"
                              data-testid={`button-delete-${publication.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {publication.url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="hover:bg-blue-100"
                            data-testid={`button-publication-url-${publication.id}`}
                          >
                            <a href={publication.url} target="_blank" rel="noopener noreferrer" title="Visit Publication">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {publication.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="hover:bg-red-100"
                            data-testid={`button-publication-pdf-${publication.id}`}
                          >
                            <a href={publication.pdfUrl} target="_blank" rel="noopener noreferrer" title="Download PDF">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className={`grid ${publication.imageUrl ? 'lg:grid-cols-3 gap-6' : 'grid-cols-1'}`}>
                      {publication.imageUrl && (
                        <div className="lg:col-span-1">
                          <div className="relative aspect-square rounded-lg overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                            <img
                              src={publication.imageUrl}
                              alt={`${publication.title} illustration`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              data-testid={`img-publication-${publication.id}`}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                          </div>
                        </div>
                      )}
                      
                      <div className={`${publication.imageUrl ? 'lg:col-span-2' : 'col-span-1'} space-y-4`}>
                        <h3
                          className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-900 transition-colors"
                          data-testid={`text-publication-title-${publication.id}`}
                          dangerouslySetInnerHTML={{ __html: publication.title }}
                        />
                        
                        {publication.authors && publication.authors.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Authors:</p>
                            <div className="flex flex-wrap gap-2" data-testid={`text-publication-authors-${publication.id}`}>
                              {publication.authors.map((author, authorIndex) => (
                                <span key={authorIndex} className="text-sm">
                                  {author.homepage ? (
                                    <a
                                      href={author.homepage}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                      data-testid={`link-author-${publication.id}-${authorIndex}`}
                                      dangerouslySetInnerHTML={{ __html: author.name }}
                                    />
                                  ) : (
                                    <span 
                                      className="text-gray-700 font-medium"
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
                        )}
                        
                        {publication.journal && (
                          <div className="text-sm text-gray-600" data-testid={`text-publication-journal-${publication.id}`}>
                            <span className="font-medium">Journal:</span> {publication.journal}
                          </div>
                        )}
                        
                        {publication.conference && (
                          <div className="text-sm text-gray-600" data-testid={`text-publication-conference-${publication.id}`}>
                            <span className="font-medium">Conference:</span> {publication.conference}
                          </div>
                        )}
                        
                        {/* Abstract - always fully visible */}
                        {publication.abstract && (
                          <div className="mt-4">
                            <p className="text-xs font-medium text-gray-500 mb-2">Abstract:</p>
                            <div 
                              className="text-sm text-gray-700"
                              data-testid={`text-publication-abstract-${publication.id}`}
                              dangerouslySetInnerHTML={{ __html: publication.abstract }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 mb-6">아직 게시된 논문이 없습니다.</p>
              {isAdmin && (
                <Button 
                  variant="outline"
                  onClick={() => setShowAddForm(true)}
                  data-testid="button-add-first-publication"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  첫 번째 논문 추가
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}