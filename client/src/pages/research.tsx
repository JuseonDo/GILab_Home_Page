import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { z } from "zod";

import {
  insertPublicationSchema,
  type Publication,
  type ResearchArea,
} from "@/shared/schema";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { X, Plus, ChevronDown, ChevronUp, Upload } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

// 카드
import PublicationCard from "@/components/publication-card";


// 저자/초록 정규화 유틸
type AnyPub = Record<string, any>;
function normalizeAuthors(src: AnyPub): { name: string; homepage?: string | null }[] {
  const raw =
    src?.authors ??
    src?.authors_data ??
    src?.publication_authors ??
    [];
  return (Array.isArray(raw) ? raw : []).map((a: any) => ({
    name: a?.nameHtml ?? a?.name ?? "",
    homepage: a?.homepage ?? "",
  }));
}



// ---- 에러 파서: 다양한 백엔드 응답 형태를 사람이 읽을 수 있게 변환 ----
async function parseErrorMessage(err: any): Promise<string> {
  try {
    // fetch/apiRequest 스타일: Response를 err.response로 담는 경우
    const res = err?.response;
    if (res && typeof res?.json === "function") {
      const ct = res.headers?.get?.("content-type") || "";
      if (ct.includes("application/json")) {
        const data = await res.json();

        // 1) FastAPI 전형: { detail: [...] | "..." }
        if (data?.detail) {
          if (Array.isArray(data.detail)) {
            const msgs = data.detail.map((d: any) => d?.msg || d?.message || JSON.stringify(d)).filter(Boolean);
            if (msgs.length) return msgs.join("\n");
          }
          if (typeof data.detail === "string") return data.detail;
        }

        // 2) 일반 케이스: { message, errors }
        if (data?.message) return String(data.message);
        if (Array.isArray(data?.errors)) {
          const msgs = data.errors.map((d: any) => d?.msg || d?.message || JSON.stringify(d)).filter(Boolean);
          if (msgs.length) return msgs.join("\n");
        }

        // 3) 배열로 내려오는 경우: [{message:...}, ...]
        if (Array.isArray(data)) {
          const msgs = data.map((d) => d?.msg || d?.message || JSON.stringify(d)).filter(Boolean);
          if (msgs.length) return msgs.join("\n");
        }

        return JSON.stringify(data);
      } else {
        const text = await res.text();
        if (text) return text;
      }
    }

    // axios/기타
    if (err?.response?.data) {
      const d = err.response.data;
      if (typeof d === "string") return d;
      if (d?.detail) {
        if (Array.isArray(d.detail)) {
          const msgs = d.detail.map((x: any) => x?.msg || x?.message || JSON.stringify(x)).filter(Boolean);
          if (msgs.length) return msgs.join("\n");
        }
        if (typeof d.detail === "string") return d.detail;
      }
      if (d?.message) return String(d.message);
      if (Array.isArray(d?.errors)) {
        const msgs = d.errors.map((x: any) => x?.msg || x?.message || JSON.stringify(x)).filter(Boolean);
        if (msgs.length) return msgs.join("\n");
      }
      return JSON.stringify(d);
    }

    if (err?.message) return String(err.message);
    return "요청 처리 중 오류가 발생했습니다.";
  } catch {
    return "요청 처리 중 오류가 발생했습니다.";
  }
}




/* -----------------------------
 * 스키마/타입
 * ----------------------------- */
const authorItemSchema = z.object({
  nameHtml: z.string().min(1, "저자 이름을 입력하세요"),
  homepage: z.string().url().optional().or(z.literal("")),
});

const uiSchema = insertPublicationSchema.extend({
  venue: z.string().optional().or(z.literal("")),
  authors: z.array(authorItemSchema).min(1, "최소 1명의 저자를 입력하세요"),
  imageUrl: z.string().optional().or(z.literal("")), // 업로드 후 받은 URL 저장
});

type AuthorForm = { nameHtml: string; homepage?: string | null };
type ResearchForm = z.infer<typeof uiSchema> & { authors: AuthorForm[] };

const normalizeType = (
  t: string | null | undefined
): "journal" | "conference" =>
  (t ?? "").toLowerCase() === "journal" ? "journal" : "conference";

export default function ResearchPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  /* ====== 데이터 쿼리 ====== */
  const researchAreasQuery = useQuery<ResearchArea[]>({
    queryKey: ["/research-areas"],
    queryFn: async () => {
      const r = await fetch("/api/research-areas");
      if (r.status === 404) return [];
      if (!r.ok) throw new Error("Failed to fetch research areas");
      return r.json();
    },
    retry: false,
  });

  const publicationsQuery = useQuery<Publication[]>({
    queryKey: ["/publications"],
    queryFn: async () => {
      const r = await fetch("/api/publications");
      if (!r.ok) throw new Error("Failed to fetch publications");
      return r.json();
    },
  });

  /* ====== 토글 ====== */
  const [showAddArea, setShowAddArea] = useState(false);
  const [showAddPub, setShowAddPub] = useState(false);

  /* ====== 연구분야 폼/생성 ====== */
  const areaFormSchema = z.object({
    name: z.string().min(1, "연구분야명을 입력하세요"),
    description: z.string().optional().or(z.literal("")),
    imageUrl: z.string().optional().or(z.literal("")),
    order: z.coerce.number().min(0).optional().default(0),
    parentId: z.string().optional().or(z.literal("")),
    isActive: z.boolean().optional().default(true),
  });
  type AreaForm = z.infer<typeof areaFormSchema>;

  const areaForm = useForm<AreaForm>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      order: 0,
      parentId: "",
      isActive: true,
    },
  });

  const createAreaMutation = useMutation({
    mutationFn: async (data: AreaForm) => {
      return apiRequest("POST", "/research-areas", {
        name: data.name,
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        order: Number(data.order || 0),
        parentId: data.parentId || undefined,
        isActive: data.isActive ?? true,
      });
    },
    onSuccess: () => {
      toast({ title: "연구분야가 추가되었습니다." });
      qc.invalidateQueries({ queryKey: ["/research-areas"] });
      areaForm.reset({
        name: "",
        description: "",
        imageUrl: "",
        order: 0,
        parentId: "",
        isActive: true,
      });
      setShowAddArea(false);
    },
    onError: async (e: any) => {
      console.error("[publications] mutation error:", e);
      const desc = await parseErrorMessage(e);
      toast({
        title: "논문 추가 실패",
        description: desc,
        variant: "destructive",
      });
    },
  });

  /* ====== 논문 폼/생성 ====== */
  const pubForm = useForm<ResearchForm>({
    resolver: zodResolver(uiSchema),
    defaultValues: {
      title: "",
      type: "journal",
      year: new Date().getFullYear(),
      venue: "",
      abstract: "",
      pdfUrl: "",
      imageUrl: "", // 업로드 후 세팅
      order: 0,
      authors: [{ nameHtml: "", homepage: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: pubForm.control,
    name: "authors",
  });

  // 이미지 업로드(생성)
  const [uploadingCreate, setUploadingCreate] = useState(false);
  const handlePubUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploadingCreate(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("이미지 업로드 실패");
      const { url } = await res.json();
      pubForm.setValue("imageUrl", url, { shouldDirty: true });
      toast({ title: "업로드 성공", description: "논문 이미지가 저장되었습니다." });
    } catch (e: any) {
      toast({
        title: "업로드 실패",
        description: e?.message || "업로드 중 오류",
        variant: "destructive",
      });
    } finally {
      setUploadingCreate(false);
    }
  };

  const createPubMutation = useMutation({
    mutationFn: async (data: ResearchForm) => {
      const publication_data = {
        title: data.title,
        journal: data.type === "journal" ? data.venue || "" : "",
        conference: data.type === "conference" ? data.venue || "" : "",
        year: data.year,
        type: data.type,
        abstract: data.abstract || "",
        pdfUrl: data.pdfUrl || "",
        imageUrl: data.imageUrl || "", // 업로드된 경로
        order: data.order ?? 0,
      };
      const authors_data = (data.authors ?? []).map((a) => ({
        name: a.nameHtml || "",
        homepage: a.homepage || "",
      }));
      return apiRequest("POST", "/publications", {
        publication_data,
        authors_data,
      });
    },
    onSuccess: () => {
      toast({ title: "논문이 추가되었습니다." });
      qc.invalidateQueries({ queryKey: ["/publications"] });
      pubForm.reset({
        title: "",
        type: "journal",
        year: new Date().getFullYear(),
        venue: "",
        abstract: "",
        pdfUrl: "",
        imageUrl: "",
        order: 0,
        authors: [{ nameHtml: "", homepage: "" }],
      });
      setShowAddPub(false);
    },
    onError: async (e: any) => {
      console.error("[publications] mutation error:", e);
      const desc = await parseErrorMessage(e);
      toast({
        title: "논문 추가 실패",
        description: desc,
        variant: "destructive",
      });
    },
  });

  /* ====== 인라인 수정 상태/폼 ====== */
  const [editingPubId, setEditingPubId] = useState<string | number | null>(null);
  const pubEditForm = useForm<ResearchForm>({
    resolver: zodResolver(uiSchema),
    defaultValues: {
      title: "",
      type: "journal",
      year: new Date().getFullYear(),
      venue: "",
      abstract: "",
      pdfUrl: "",
      imageUrl: "",
      order: 0,
      authors: [{ nameHtml: "", homepage: "" }],
    },
  });
  const {
    fields: editAuthorFields,
    append: editAuthorAppend,
    remove: editAuthorRemove,
  } = useFieldArray({
    control: pubEditForm.control,
    name: "authors",
  });

  // 이미지 업로드(수정)
  const [uploadingEdit, setUploadingEdit] = useState(false);
  const handlePubEditUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploadingEdit(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("이미지 업로드 실패");
      const { url } = await res.json();
      pubEditForm.setValue("imageUrl", url, { shouldDirty: true });
      toast({ title: "업로드 성공", description: "논문 이미지가 저장되었습니다." });
    } catch (e: any) {
      toast({
        title: "업로드 실패",
        description: e?.message || "업로드 중 오류",
        variant: "destructive",
      });
    } finally {
      setUploadingEdit(false);
    }
  };

  /* ====== 수정 뮤테이션 (생성과 동일한 바디 구조) ====== */
  // ====== 수정 뮤테이션 (PUT 사용) ======
// ====== 수정 뮤테이션 (PUT + 평탄화 바디) ======
  const updatePubMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: ResearchForm }) => {
      const body = {
        title: data.title,
        year: data.year,
        type: data.type, // "journal" | "conference"
        journal: data.type === "journal" ? data.venue || "" : "",
        conference: data.type === "conference" ? data.venue || "" : "",
        abstract: data.abstract || "",
        pdfUrl: data.pdfUrl || "",
        imageUrl: data.imageUrl || "",
        order: data.order ?? 0,
        // ✅ 백엔드가 authors / authors_data 어느 쪽이든 받게 하려면 authors로 통일
        authors: (data.authors ?? []).map((a) => ({
          name: a.nameHtml || "",
          homepage: a.homepage || "",
        })),
      };
      return apiRequest("PUT", `/publications/${id}`, body);
    },
    onSuccess: () => {
      toast({ title: "논문이 수정되었습니다." });
      qc.invalidateQueries({ queryKey: ["/publications"] });
      setEditingPubId(null);
    },
    onError: async (e: any) => {
      const desc = await parseErrorMessage(e);
      toast({ title: "논문 수정 실패", description: desc, variant: "destructive" });
    },
  });



  /* ====== 유틸: 연도 그룹핑 ====== */
  const groupedPubs = useMemo(() => {
    const items = publicationsQuery.data ?? [];
    const m = new Map<number, Publication[]>();
    items.forEach((p) => {
      const y = Number(p.year);
      if (!m.has(y)) m.set(y, []);
      m.get(y)!.push(p);
    });
    return Array.from(m.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, list]) => ({
        year,
        list: list.sort((a, b) =>
          (a.title || "").localeCompare(b.title || "")
        ),
      }));
  }, [publicationsQuery.data]);

  /* ====== 렌더 ====== */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">Research & Publications</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto"></p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12" data-testid="research-page">
        {/* ===== 연구분야 (기존과 동일 / 필요시 추후 업로드 추가 가능) ===== */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">연구분야</h2>
            {isAdmin && (
              <Button variant="secondary" onClick={() => setShowAddArea((v) => !v)}>
                {showAddArea ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                연구분야 추가
              </Button>
            )}
          </div>

          {researchAreasQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-md" />
              ))}
            </div>
          ) : researchAreasQuery.data && researchAreasQuery.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {researchAreasQuery.data.map((area) => (
                <Card key={area.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{area.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {area.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-3">{area.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">설명이 없습니다.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">등록된 연구분야가 없습니다.</p>
          )}
        </section>

        {/* ===== 논문 섹션 ===== */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">논문</h2>
            {isAdmin && (
              <Button variant="secondary" onClick={() => setShowAddPub((v) => !v)}>
                {showAddPub ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                논문 추가
              </Button>
            )}
          </div>

          {/* (어드민) 논문 추가 폼 */}
          {isAdmin && showAddPub && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <Form {...pubForm}>
                  <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    onSubmit={pubForm.handleSubmit((v) => createPubMutation.mutate(v))}
                  >
                    <FormField
                      control={pubForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>제목</FormLabel>
                          <FormControl>
                            <Input placeholder="논문 제목" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pubForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>유형</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="유형" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="journal">Journal</SelectItem>
                              <SelectItem value="conference">Conference</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pubForm.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>발표연도</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1900}
                              max={9999}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pubForm.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>저널/학회</FormLabel>
                          <FormControl>
                            <Input placeholder="예: NeurIPS" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* PDF URL (텍스트) */}
                    <FormField
                      control={pubForm.control}
                      name="pdfUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PDF URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 이미지 업로드 (members와 동일한 /api/upload 사용) */}
                    <FormField
                      control={pubForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>논문 이미지</FormLabel>
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              {...field}
                              placeholder="업로드 시 자동 입력됩니다"
                              className="hidden"
                              readOnly
                            />
                            <label className="inline-flex items-center px-3 py-2 border rounded-md cursor-pointer">
                              <Upload className="w-4 h-4 mr-2" />
                              {uploadingCreate ? "업로드 중..." : "파일 업로드"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePubUpload(e.target.files?.[0] || null)}
                                disabled={uploadingCreate}
                              />
                            </label>
                            {pubForm.watch("imageUrl") && (
                              <img
                                src={pubForm.watch("imageUrl")}
                                alt="미리보기"
                                className="w-14 h-14 rounded object-cover border"
                              />
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 초록(Quill) */}
                    <FormField
                      control={pubForm.control}
                      name="abstract"
                      render={() => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>초록</FormLabel>
                          <FormControl>
                            <Controller
                              control={pubForm.control}
                              name="abstract"
                              render={({ field }) => (
                                <ReactQuill
                                  theme="snow"
                                  value={field.value || ""}
                                  onChange={field.onChange}
                                />
                              )}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 저자 배열 */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel>저자</FormLabel>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => append({ nameHtml: "", homepage: "" })}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          추가
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {fields.map((f, i) => (
                          <div key={f.id} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              control={pubForm.control}
                              name={`authors.${i}.nameHtml`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>이름(HTML 허용)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="예: <b>홍길동</b>" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={pubForm.control}
                              name={`authors.${i}.homepage`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>홈페이지(선택)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="md:col-span-2 flex justify-end">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => remove(i)}
                                aria-label="저자 삭제"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddPub(false)}>
                        취소
                      </Button>
                      <Button type="submit" disabled={createPubMutation.isPending}>
                        추가
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* 목록 + 인라인 수정 */}
          {publicationsQuery.isLoading ? (
            <div className="space-y-6 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
              ))}
            </div>
          ) : (publicationsQuery.data?.length ?? 0) > 0 ? (
            <div className="space-y-10">
              {groupedPubs.map(({ year, list }) => (
                <div key={year}>
                  <h3 className="text-xl md:text-2xl font-bold mb-4">{year}</h3>
                  <div className="space-y-6">
                    {list.map((p) => {
                      const isEditing = editingPubId === p.id;
                      return (
                        <div key={p.id}>
                          <PublicationCard
                            data={{
                              id: p.id,
                              year: p.year,
                              type: normalizeType((p as any).type),
                              title: p.title,
                              journal: (p as any).journal ?? null,
                              conference: (p as any).conference ?? null,
                              abstract: (p as any).abstract ?? "",
                              thumbnailUrl: (p as any).thumbnailUrl ?? undefined,
                              imageUrl: (p as any).imageUrl ?? undefined,
                              pdfUrl: (p as any).pdfUrl ?? undefined,
                              codeUrl: (p as any).codeUrl ?? undefined,
                              url: (p as any).url ?? undefined,
                              // ✅ 여기만 교체
                              authors: normalizeAuthors(p as any),
                            }}
                            isAdmin={isAdmin}
                            onEdit={(id) => {
                              if (isEditing) {
                                setEditingPubId(null);
                              } else {
                                const venue =
                                  normalizeType((p as any).type) === "journal"
                                    ? (p as any).journal ?? ""
                                    : (p as any).conference ?? "";

                                // ✅ 수정 폼에도 정규화 적용
                                const safeAuthors = normalizeAuthors(p as any);
                                const authorsForForm =
                                  safeAuthors.length > 0 ? safeAuthors.map(a => ({ nameHtml: a.name, homepage: a.homepage ?? "" })) : [{ nameHtml: "", homepage: "" }];

                                pubEditForm.reset({
                                  title: p.title ?? "",
                                  type: normalizeType((p as any).type),
                                  year: Number(p.year ?? new Date().getFullYear()),
                                  venue,
                                  abstract: (p as any).abstract ?? "",
                                  pdfUrl: (p as any).pdfUrl ?? "",
                                  imageUrl: (p as any).imageUrl ?? "",
                                  order: Number((p as any).order ?? 0),
                                  authors: authorsForForm,
                                });
                                setEditingPubId(id);
                              }
                            }}
                          />


                          {/* 인라인 수정 폼 */}
                          {isAdmin && isEditing && (
                            <Card className="mt-3">
                              <CardContent className="pt-6">
                                <Form {...pubEditForm}>
                                  <form
                                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                    onSubmit={pubEditForm.handleSubmit((v) =>
                                      updatePubMutation.mutate({ id: p.id, data: v })
                                    )}
                                  >
                                    <FormField
                                      control={pubEditForm.control}
                                      name="title"
                                      render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                          <FormLabel>제목</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={pubEditForm.control}
                                      name="type"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>유형</FormLabel>
                                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="유형" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="journal">Journal</SelectItem>
                                              <SelectItem value="conference">Conference</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={pubEditForm.control}
                                      name="year"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>발표연도</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min={1900}
                                              max={9999}
                                              {...field}
                                              onChange={(e) => field.onChange(Number(e.target.value))}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={pubEditForm.control}
                                      name="venue"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>저널/학회</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={pubEditForm.control}
                                      name="pdfUrl"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>PDF URL</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    {/* 이미지 업로드 (수정) */}
                                    <FormField
                                      control={pubEditForm.control}
                                      name="imageUrl"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>논문 이미지</FormLabel>
                                          <div className="flex items-center gap-3">
                                            <input type="text" {...field} className="hidden" readOnly />
                                            <label className="inline-flex items-center px-3 py-2 border rounded-md cursor-pointer">
                                              <Upload className="w-4 h-4 mr-2" />
                                              {uploadingEdit ? "업로드 중..." : "파일 업로드"}
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handlePubEditUpload(e.target.files?.[0] || null)}
                                                disabled={uploadingEdit}
                                              />
                                            </label>
                                            {pubEditForm.watch("imageUrl") && (
                                              <img
                                                src={pubEditForm.watch("imageUrl")}
                                                alt="미리보기"
                                                className="w-14 h-14 rounded object-cover border"
                                              />
                                            )}
                                          </div>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    {/* 초록(Quill) */}
                                    <FormField
                                      control={pubEditForm.control}
                                      name="abstract"
                                      render={() => (
                                        <FormItem className="md:col-span-2">
                                          <FormLabel>초록</FormLabel>
                                          <FormControl>
                                            <Controller
                                              control={pubEditForm.control}
                                              name="abstract"
                                              render={({ field }) => (
                                                <ReactQuill
                                                  theme="snow"
                                                  value={field.value || ""}
                                                  onChange={field.onChange}
                                                />
                                              )}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />

                                    {/* 저자 배열 */}
                                    <div className="md:col-span-2">
                                      <div className="flex items-center justify-between mb-2">
                                        <FormLabel>저자</FormLabel>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => editAuthorAppend({ nameHtml: "", homepage: "" })}
                                        >
                                          <Plus className="w-4 h-4 mr-1" />
                                          추가
                                        </Button>
                                      </div>
                                      <div className="space-y-3">
                                        {editAuthorFields.map((f, i) => (
                                          <div key={f.id} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <FormField
                                              control={pubEditForm.control}
                                              name={`authors.${i}.nameHtml`}
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>이름(HTML 허용)</FormLabel>
                                                  <FormControl>
                                                    <Input {...field} />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                            <FormField
                                              control={pubEditForm.control}
                                              name={`authors.${i}.homepage`}
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>홈페이지(선택)</FormLabel>
                                                  <FormControl>
                                                    <Input {...field} />
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                            <div className="md:col-span-2 flex justify-end">
                                              <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => editAuthorRemove(i)}
                                                aria-label="저자 삭제"
                                              >
                                                <X className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="md:col-span-2 flex justify-end gap-2">
                                      <Button type="button" variant="outline" onClick={() => setEditingPubId(null)}>
                                        취소
                                      </Button>
                                      <Button type="submit" disabled={updatePubMutation.isPending}>
                                        저장
                                      </Button>
                                    </div>
                                  </form>
                                </Form>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">등록된 논문이 없습니다.</p>
          )}
        </section>
      </div>
    </div>
  );
}
