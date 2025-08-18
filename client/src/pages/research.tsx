import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExternalLink, Download, Brain, Bot, Dna, Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import type { Publication, Author, ResearchArea } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const publicationSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  journal: z.string().optional(),
  conference: z.string().optional(),
  type: z.enum(["journal", "conference"]),
  year: z.number().min(1900).max(new Date().getFullYear() + 10),
  url: z.string().url().optional().or(z.literal("")),
  pdfUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  abstract: z.string().optional(),
  keywords: z.string().optional(),
  authors: z.array(z.object({
    name: z.string().min(1, "저자 이름을 입력해주세요"),
    homepage: z.string().url().optional().or(z.literal("")),
  })).min(1, "최소 한 명의 저자가 필요합니다"),
});

const researchAreaSchema = z.object({
  name: z.string().min(1, "연구분야 이름을 입력해주세요"),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  order: z.number().default(0),
});

type PublicationFormData = z.infer<typeof publicationSchema>;
type ResearchAreaFormData = z.infer<typeof researchAreaSchema>;

export default function ResearchPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAreaForm, setShowAreaForm] = useState(false);
  
  const { data: publications = [], isLoading: publicationsLoading } = useQuery<(Publication & { authors: Author[] })[]>({
    queryKey: ["/api/publications"],
  });

  const { data: researchAreas = [], isLoading: areasLoading } = useQuery<ResearchArea[]>({
    queryKey: ["/api/research-areas"],
  });

  const form = useForm<PublicationFormData>({
    resolver: zodResolver(publicationSchema),
    defaultValues: {
      title: "",
      journal: "",
      conference: "",
      type: "journal",
      year: new Date().getFullYear(),
      url: "",
      pdfUrl: "",
      imageUrl: "",
      abstract: "",
      keywords: "",
      authors: [{ name: "", homepage: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "authors",
  });

  const areaForm = useForm<ResearchAreaFormData>({
    resolver: zodResolver(researchAreaSchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: "",
      imageUrl: "",
      order: 0,
    },
  });

  const publicationType = form.watch("type");

  const createPublicationMutation = useMutation({
    mutationFn: (data: PublicationFormData) => {
      const { authors, ...publicationData } = data;
      return apiRequest("POST", "/api/publications", {
        publication: {
          ...publicationData,
          year: String(publicationData.year), // Convert year to string for database
        },
        authors: authors.map(author => ({
          name: author.name,
          homepage: author.homepage || undefined,
        })),
      });
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
    mutationFn: (data: ResearchAreaFormData) => {
      return apiRequest("POST", "/api/research-areas", data);
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

  const onSubmit = (data: PublicationFormData) => {
    createPublicationMutation.mutate(data);
  };

  const onAreaSubmit = (data: ResearchAreaFormData) => {
    createResearchAreaMutation.mutate(data);
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
                              <Input {...field} placeholder="논문 제목을 입력하세요" />
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
                              <Input {...field} placeholder="https://example.com" />
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
                          <FormItem>
                            <FormLabel>이미지 URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://example.com/image.jpg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="keywords"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>키워드</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="키워드를 쉼표로 구분하여 입력하세요" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="abstract"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>초록</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="논문 초록을 입력하세요" rows={4} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Authors */}
                    <div>
                      <FormLabel className="text-base font-medium">저자 *</FormLabel>
                      <div className="space-y-3 mt-3">
                        {fields.map((field, index) => (
                          <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                            <FormField
                              control={form.control}
                              name={`authors.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>저자명</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="저자 이름" />
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
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => append({ name: "", homepage: "" })}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          저자 추가
                        </Button>
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
                            <FormLabel>연구분야 이름 *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="연구분야 이름을 입력하세요" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={areaForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이미지 URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://example.com/image.jpg" />
                            </FormControl>
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
                              <Textarea {...field} placeholder="연구분야에 대한 설명을 입력하세요" />
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
                  <Card key={area.id} className="hover:shadow-lg transition-shadow" data-testid={`card-research-area-${area.id}`}>
                    <CardHeader>
                      <CardTitle className="text-xl text-gray-900" data-testid={`text-area-title-${area.id}`}>
                        {area.name}
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
          {publications.length > 0 ? (
            <div className="space-y-6">
              {publications.map((publication) => (
                <Card
                  key={publication.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden"
                  data-testid={`card-publication-${publication.id}`}
                >
                  <CardContent className="p-8 relative">
                    {/* Background overlay on hover */}
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
                      {/* Image Section */}
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
                      
                      {/* Content Section */}
                      <div className={`${publication.imageUrl ? 'lg:col-span-2' : 'col-span-1'} space-y-4`}>
                        <h3
                          className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-900 transition-colors"
                          data-testid={`text-publication-title-${publication.id}`}
                        >
                          {publication.title}
                        </h3>
                        
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
                                    >
                                      {author.name}
                                    </a>
                                  ) : (
                                    <span className="text-gray-700 font-medium">
                                      {author.name}
                                    </span>
                                  )}
                                  {authorIndex < publication.authors.length - 1 && (
                                    <span className="text-gray-400 ml-1">•</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(publication.journal || publication.conference) && (
                          <p className="text-gray-700 font-medium" data-testid={`text-publication-venue-${publication.id}`}>
                            {publication.journal || publication.conference}
                          </p>
                        )}
                        
                        {/* Keywords - shown only on hover */}
                        {publication.keywords && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="text-xs font-medium text-gray-500 mb-2">Keywords:</p>
                            <div className="flex flex-wrap gap-1">
                              {publication.keywords.split(',').map((keyword, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {keyword.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Abstract - truncated, full text on hover */}
                        {publication.abstract && (
                          <div>
                            <p className="text-gray-600 text-sm group-hover:hidden" data-testid={`text-publication-abstract-short-${publication.id}`}>
                              {publication.abstract.length > 200 
                                ? `${publication.abstract.substring(0, 200)}...` 
                                : publication.abstract}
                            </p>
                            <div className="hidden group-hover:block">
                              <p className="text-xs font-medium text-gray-500 mb-2">Abstract:</p>
                              <p className="text-gray-600 text-sm leading-relaxed" data-testid={`text-publication-abstract-${publication.id}`}>
                                {publication.abstract}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Hover indicator */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <span>Hover to see more</span>
                        <ExternalLink className="h-3 w-3" />
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">아직 논문이 등록되지 않았습니다.</p>
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
