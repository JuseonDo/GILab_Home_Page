import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Author = { name: string; homepage?: string | null };

type Publication = {
  id: string | number;
  year: number;
  type: "journal" | "conference";
  journal?: string | null;
  conference?: string | null;
  title: string;
  abstract?: string | null; // HTML 문자열 또는 Markdown이 들어올 수 있음(선행 변환 가정)
  pdfUrl?: string | null;
  url?: string | null;
  imageUrl?: string | null;

  /** ✅ 새로 추가: 제목 아래 저자를 한 번에 HTML로 그릴 수 있는 필드 */
  authorsHtml?: string | null;

  /** 기존 호환: 배열로 받은 저자 목록 */
  authors?: Author[];
};

type Props = {
  publications?: Publication[] | null | undefined; // 새 코드
  items?: Publication[] | null | undefined;        // 예전 코드 호환
  intervalMs?: number;
};

export default function PublicationSlider(props: Props) {
  const data: Publication[] = Array.isArray(props.publications)
    ? props.publications
    : Array.isArray(props.items)
    ? props.items!
    : [];

  const [current, setCurrent] = useState(0);
  const [auto, setAuto] = useState(true);
  const intervalMs = props.intervalMs ?? 8000;

  useEffect(() => {
    if (!auto || data.length <= 1) return;
    const t = setInterval(() => setCurrent((p) => (p + 1) % data.length), intervalMs);
    return () => clearInterval(t);
  }, [auto, data.length, intervalMs]);

  const go = (i: number) => setCurrent(i);
  const next = () => setCurrent((p) => (p + 1) % Math.max(data.length, 1));
  const prev = () => setCurrent((p) => (p - 1 + Math.max(data.length, 1)) % Math.max(data.length, 1));

  if (data.length === 0) {
    return (
      <section className="relative z-20 isolate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-64 rounded-2xl border bg-white/60 backdrop-blur flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No publications to show.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="relative z-20 isolate"
      onMouseEnter={() => setAuto(false)}
      onMouseLeave={() => setAuto(true)}
      data-testid="publication-slider"
    >
      <div className="relative overflow-x-hidden overflow-y-visible">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
          data-testid="slider-track"
        >
          {data.map((p, idx) => {
            const venue = p.type === "journal" ? (p.journal || "") : (p.conference || "");
            return (
              <div key={p.id ?? idx} className="w-full flex-shrink-0 px-4 pb-10 md:pb-12">
                <Card className="group relative max-w-5xl mx-auto rounded-2xl shadow-lg hover:shadow-2xl bg-white/90 backdrop-blur transition-all duration-300 overflow-visible">
                  <CardHeader className="space-y-3 pt-6 pb-2 md:pt-7 md:pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="rounded-full">
                        {p.type === "journal" ? "Journal" : "Conference"}
                      </Badge>
                      <Badge variant="outline" className="rounded-full">{p.year}</Badge>
                      {venue && <span className="text-sm text-muted-foreground">{venue}</span>}
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-2xl md:text-3xl font-semibold leading-snug">
                        {p.title}
                      </h3>

                      {/* 🔗 일반 URL 있을 때만 외부 링크 아이콘 (PDF와 중복 방지) */}
                      {p.url && (
                        <a
                          href={p.url}
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
                    {p.authorsHtml?.trim() ? (
                      <div
                        className="mt-1 text-sm text-gray-700 flex flex-wrap gap-x-2 gap-y-1"
                        dangerouslySetInnerHTML={{ __html: p.authorsHtml! }}
                      />
                    ) : Array.isArray(p.authors) && p.authors.length > 0 ? (
                      <div className="mt-1 text-sm text-gray-700 flex flex-wrap gap-x-2 gap-y-1">
                        {p.authors.map((a, i) =>
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
                  </CardHeader>

                  <CardContent className="space-y-4 pt-2 pb-6 md:pt-3 md:pb-7">
                    {/* 🖼️ 썸네일 이미지 */}
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-full h-52 md:h-60 object-cover rounded-xl"
                        loading="lazy"
                      />
                    )}

                    {/* 📝 초록: HTML 그대로 렌더 + 부드러운 펼침 (prose 제거로 폭 제한 해제) */}
                    {p.abstract && (
                      <div>
                        <div
                          className="
                            text-sm md:text-[15px] text-muted-foreground
                            overflow-hidden transition-[max-height] duration-500 ease-in-out
                            max-h-20 group-hover:max-h-[1000px]
                          "
                          dangerouslySetInnerHTML={{ __html: p.abstract }}
                        />
                      </div>
                    )}

                    {/* 📄 PDF 버튼(단일) */}
                    {p.pdfUrl && (
                      <div className="pt-1">
                        <a
                          href={p.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md border"
                        >
                          <span>📄 PDF</span>
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Dots */}
        <div className="flex justify-center mt-4 space-x-2">
          {data.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                current === i ? "bg-lab-blue" : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Arrows */}
        {data.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white rounded-full shadow-lg"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/85 hover:bg-white rounded-full shadow-lg"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
