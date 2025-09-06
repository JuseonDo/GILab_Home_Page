import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, User, Plus, Upload, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import type { News, InsertNews } from "@/shared/schema";
import { insertNewsSchema } from "@/shared/schema";
import { useAuth } from "@/hooks/useAuth";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function NewsPage() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: news = [], isLoading, error } = useQuery<News[]>({
    queryKey: ["/news"],
    queryFn: () => apiRequest("GET", "/news"),
  });

  const form = useForm<InsertNews>({
    resolver: zodResolver(insertNewsSchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      imageUrl: "",
    },
  });

  const editForm = useForm<InsertNews>({
    resolver: zodResolver(insertNewsSchema),
    defaultValues: {
      title: "",
      content: "",
      summary: "",
      imageUrl: "",
    },
  });

  const createNewsMutation = useMutation({
    mutationFn: async (data: InsertNews) => {
      return apiRequest("POST", "/news", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/news"] });
      setIsCreateDialogOpen(false);
      form.reset();
      setPreviewUrl("");
      toast({
        title: "뉴스 생성 완료",
        description: "새로운 뉴스가 성공적으로 생성되었습니다.",
      });
    },
    onError: (error) => {
      console.error("Failed to create news:", error);
      toast({
        title: "뉴스 생성 실패",
        description: "뉴스 생성에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const updateNewsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertNews }) => {
      return apiRequest("PUT", `/news/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/news"] });
      setIsEditDialogOpen(false);
      setEditingNews(null);
      editForm.reset();
      setPreviewUrl("");
      toast({
        title: "뉴스 수정 완료",
        description: "뉴스가 성공적으로 수정되었습니다.",
      });
    },
    onError: (error) => {
      console.error("Failed to update news:", error);
      toast({
        title: "뉴스 수정 실패",
        description: "뉴스 수정에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/news/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/news"] });
      toast({
        title: "뉴스 삭제 완료",
        description: "뉴스가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error) => {
      console.error("Failed to delete news:", error);
      toast({
        title: "뉴스 삭제 실패",
        description: "뉴스 삭제에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertNews) => {
    createNewsMutation.mutate(data);
  };

  const onEditSubmit = (data: InsertNews) => {
    if (editingNews) {
      updateNewsMutation.mutate({ id: editingNews.id, data });
    }
  };

  const startEditNews = (newsItem: News) => {
    setEditingNews(newsItem);
    editForm.reset({
      title: newsItem.title || "",
      content: newsItem.content || "",
      summary: newsItem.summary || "",
      imageUrl: newsItem.imageUrl || "",
    });
    setPreviewUrl(newsItem.imageUrl || "");
    setIsEditDialogOpen(true);
  };

  const handleImageUpload = async (file: File | null, isEdit: boolean = false) => {
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("이미지 업로드 실패");
      const { url } = await res.json();
      
      if (isEdit) {
        editForm.setValue("imageUrl", url, { shouldDirty: true });
      } else {
        form.setValue("imageUrl", url, { shouldDirty: true });
      }
      setPreviewUrl(url);
      toast({ title: "업로드 성공", description: "이미지가 업로드되었습니다." });
    } catch (e: any) {
      toast({ title: "업로드 실패", description: e?.message || "업로드 중 오류", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const deleteNews = (newsId: string, title: string) => {
    if (confirm(`"${title}" 뉴스를 삭제하시겠습니까?`)) {
      deleteNewsMutation.mutate(newsId);
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="text-news-title">
              Latest News
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto" data-testid="text-news-description">
              Stay informed about our latest research breakthroughs and news.
            </p>
            {isAdmin && (
              <div className="mt-8">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="lg" data-testid="button-add-news">
                      <Plus className="h-5 w-5 mr-2" />
                      Add News
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>새로운 뉴스 추가</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>제목</FormLabel>
                              <FormControl>
                                <Input placeholder="뉴스 제목을 입력하세요" {...field} data-testid="input-news-title" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="summary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>요약 (선택사항)</FormLabel>
                              <FormControl>
                                <Input placeholder="뉴스 요약을 입력하세요" {...field} value={field.value || ""} data-testid="input-news-summary" />
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
                                <FormLabel>이미지 URL (선택사항)</FormLabel>
                                <FormControl>
                                  <Input placeholder="업로드를 하면 자동으로 채워져요" {...field} value={field.value || ""} data-testid="input-news-image" />
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
                                onChange={(e) => handleImageUpload(e.target.files?.[0] || null, false)}
                                disabled={uploading}
                              />
                            </label>
                          </div>
                        </div>
                        {(previewUrl || form.watch("imageUrl")) && (
                          <div className="flex items-center gap-4">
                            <img
                              src={previewUrl || form.watch("imageUrl")}
                              alt="미리보기"
                              className="w-20 h-20 rounded object-cover border"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <span className="text-sm text-gray-600 break-all">
                              {previewUrl || form.watch("imageUrl")}
                            </span>
                          </div>
                        )}

                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>내용</FormLabel>
                              <FormControl>
                                <div className="min-h-[300px]">
                                  <ReactQuill
                                    theme="snow"
                                    value={field.value}
                                    onChange={field.onChange}
                                    modules={{
                                      toolbar: [
                                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                        ['bold', 'italic', 'underline', 'strike'],
                                        [{ 'color': [] }, { 'background': [] }],
                                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                                        [{ 'align': [] }],
                                        ['link', 'image'],
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
                                      'link', 'image'
                                    ]}
                                    placeholder="뉴스 내용을 작성하세요..."
                                    style={{ height: '250px' }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end gap-4 pt-12">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsCreateDialogOpen(false)}
                            data-testid="button-cancel-news"
                          >
                            취소
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createNewsMutation.isPending}
                            data-testid="button-save-news"
                          >
                            {createNewsMutation.isPending ? "저장 중..." : "저장"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
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
                <Card key={newsItem.id} className="overflow-hidden hover:shadow-lg transition-shadow relative" data-testid={`card-news-${newsItem.id}`}>
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 bg-white/80 backdrop-blur-sm"
                        onClick={() => startEditNews(newsItem)}
                        disabled={updateNewsMutation.isPending}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 bg-white/80 backdrop-blur-sm"
                        onClick={() => deleteNews(newsItem.id, newsItem.title)}
                        disabled={deleteNewsMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
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
                      {newsItem.summary || newsItem.content.replace(/<[^>]*>/g, '').substring(0, 150) + "..."}
                    </p>
                    <div className="flex items-center justify-between">
                      <Link href={`/news/${newsItem.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-read-more-${newsItem.id}`}>
                          Read More
                        </Button>
                      </Link>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{Math.ceil(newsItem.content.replace(/<[^>]*>/g, '').split(' ').length / 200)} min read</span>
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
            {isAdmin && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-first-news">
                    <Plus className="h-5 w-5 mr-2" />
                    Add First News Article
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>새로운 뉴스 추가</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>제목</FormLabel>
                            <FormControl>
                              <Input placeholder="뉴스 제목을 입력하세요" {...field} data-testid="input-news-title-2" />
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
                            <FormLabel>이미지 URL (선택사항)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} data-testid="input-news-image-2" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>내용</FormLabel>
                            <FormControl>
                              <div className="min-h-[300px]">
                                <ReactQuill
                                  theme="snow"
                                  value={field.value}
                                  onChange={field.onChange}
                                  modules={{
                                    toolbar: [
                                      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                      ['bold', 'italic', 'underline', 'strike'],
                                      [{ 'color': [] }, { 'background': [] }],
                                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                      [{ 'indent': '-1'}, { 'indent': '+1' }],
                                      [{ 'align': [] }],
                                      ['link', 'image'],
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
                                    'link', 'image'
                                  ]}
                                  placeholder="뉴스 내용을 작성하세요..."
                                  style={{ height: '250px' }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-4 pt-12">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateDialogOpen(false)}
                          data-testid="button-cancel-news-2"
                        >
                          취소
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createNewsMutation.isPending}
                          data-testid="button-save-news-2"
                        >
                          {createNewsMutation.isPending ? "저장 중..." : "저장"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>

      {/* Edit News Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>뉴스 수정</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>제목</FormLabel>
                    <FormControl>
                      <Input placeholder="뉴스 제목을 입력하세요" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>요약 (선택사항)</FormLabel>
                    <FormControl>
                      <Input placeholder="뉴스 요약을 입력하세요" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={editForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>이미지 URL (선택사항)</FormLabel>
                      <FormControl>
                        <Input placeholder="업로드를 하면 자동으로 채워져요" {...field} value={field.value || ""} />
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
                      onChange={(e) => handleImageUpload(e.target.files?.[0] || null, true)}
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>
              {(previewUrl || editForm.watch("imageUrl")) && (
                <div className="flex items-center gap-4">
                  <img
                    src={previewUrl || editForm.watch("imageUrl")}
                    alt="미리보기"
                    className="w-20 h-20 rounded object-cover border"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="text-sm text-gray-600 break-all">
                    {previewUrl || editForm.watch("imageUrl")}
                  </span>
                </div>
              )}

              <FormField
                control={editForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>내용</FormLabel>
                    <FormControl>
                      <div className="min-h-[300px]">
                        <ReactQuill
                          theme="snow"
                          value={field.value}
                          onChange={field.onChange}
                          modules={{
                            toolbar: [
                              [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ 'color': [] }, { 'background': [] }],
                              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                              [{ 'indent': '-1'}, { 'indent': '+1' }],
                              [{ 'align': [] }],
                              ['link', 'image'],
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
                            'link', 'image'
                          ]}
                          placeholder="뉴스 내용을 작성하세요..."
                          style={{ height: '250px' }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-12">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingNews(null);
                    editForm.reset();
                    setPreviewUrl("");
                  }}
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateNewsMutation.isPending}
                >
                  {updateNewsMutation.isPending ? "저장 중..." : "저장"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}