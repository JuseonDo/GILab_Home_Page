import { ExternalLink, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Author = { name: string; homepage?: string | null };

export type PubCardData = {
  id: string | number;
  year: number;
  type: "journal" | "conference";
  title: string;
  journal?: string | null;
  conference?: string | null;
  abstract?: string | null; // HTML string 허용
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  pdfUrl?: string | null;
  codeUrl?: string | null;
  url?: string | null;

  /** ✅ 새로 추가: 제목 아래 저자를 한 번에 HTML로 그릴 수 있는 필드 */
  authorsHtml?: string | null;

  /** 기존 호환: 배열로 받은 저자 목록 */
  authors?: Author[];
};

export default function PublicationCard({
  data,
  isAdmin,
  onEdit,
}: {
  data: PubCardData;
  isAdmin?: boolean;
  onEdit?: (id: string | number) => void;
}) {
  const venue =
    data.type === "journal" ? data.journal || "" : data.conference || "";

  const thumb =
    data.thumbnailUrl ||
    data.imageUrl ||
    "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>
          <rect width='100%' height='100%' fill='#F3F4F6'/>
          <rect x='32' y='24' width='336' height='252' rx='12' fill='#E5E7EB'/>
          <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
            font-family='Inter,system-ui,Arial' font-size='16' fill='#9CA3AF'>Preview</text>
        </svg>`
      );

  return (
    <Card className="group relative overflow-hidden rounded-2xl border hover:shadow-xl transition-all duration-300">
      {/* 어드민용 수정 버튼 */}
      {isAdmin && (
        <button
          type="button"
          onClick={() => onEdit?.(data.id)}
          className="absolute top-3 right-3 inline-flex items-center justify-center h-8 w-8 rounded-full border bg-white hover:bg-gray-50"
          aria-label="수정"
          title="수정"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      <div className="flex gap-6 p-5 md:p-6">
        {/* 썸네일 */}
        <div className="w-48 sm:w-60 md:w-72 lg:w-80 shrink-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
            <img
              src={thumb}
              alt={`${data.title} preview`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        </div>

        {/* 본문 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <Badge variant="secondary" className="rounded-full">
              {data.type === "journal" ? "Journal" : "Conference"}
            </Badge>
            <Badge variant="outline" className="rounded-full">{data.year}</Badge>
            {venue && (
              <span className="text-sm text-muted-foreground">{venue}</span>
            )}
          </div>

          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-snug">
              {data.title}
            </h3>

            {/* 일반 URL 있을 때만 외부 링크 아이콘 (PDF와 중복 방지) */}
            {data.url && (
              <a
                href={data.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full border hover:bg-gray-50"
                aria-label="Open link"
                title="Open link"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* ✅ 제목 아래 저자 출력 (authorsHtml 우선, 없으면 배열 사용) */}
          {data.authorsHtml?.trim() ? (
            <div
              className="mt-1 text-sm text-gray-700 flex flex-wrap gap-x-2 gap-y-1"
              dangerouslySetInnerHTML={{ __html: data.authorsHtml! }}
            />
          ) : Array.isArray(data.authors) && data.authors.length > 0 ? (
            <div className="mt-1 text-sm text-gray-700 flex flex-wrap gap-x-2 gap-y-1">
              {data.authors.map((a, i) =>
                a?.homepage ? (
                  <a
                    key={`${i}-${a.name}`}
                    href={a.homepage!}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                    dangerouslySetInnerHTML={{ __html: a.name }}
                  />
                ) : (
                  <span
                    key={`${i}-${a?.name ?? "author"}`}
                    dangerouslySetInnerHTML={{ __html: a?.name ?? "" }}
                  />
                )
              )}
            </div>
          ) : null}

          {/* 초록: HTML 렌더(Quill/Markdown 변환 결과) + 천천히 펼침 (prose 제거로 폭 제한 해제) */}
          {data.abstract && (
            <div className="mt-3">
              <div
                className="
                  text-sm text-muted-foreground
                  overflow-hidden
                  transition-[max-height] duration-500 ease-in-out
                  max-h-[3.25rem] group-hover:max-h-64
                "
                dangerouslySetInnerHTML={{ __html: data.abstract }}
              />
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {/* PDF 버튼(단일) */}
            {data.pdfUrl && (
              <Button asChild variant="outline" size="sm">
                <a href={data.pdfUrl} target="_blank" rel="noreferrer">
                  PDF
                </a>
              </Button>
            )}
            {data.codeUrl && (
              <Button asChild variant="ghost" size="sm" className="text-lab-blue">
                <a href={data.codeUrl} target="_blank" rel="noreferrer">
                  Code
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
