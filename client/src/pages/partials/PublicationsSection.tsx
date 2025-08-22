// src/pages/partials/PublicationsSection.tsx
import { useEffect, useState } from "react";
import PublicationSlider from "@/components/publication-slider"; // ← 경로 확인
// 위 경로가 다르면 예) import PublicationSlider from "@/pages/publication-slider";

type Author = {
  name: string;
  homepage?: string | null;
};

type Publication = {
  id: string | number;
  year: number;
  type: "journal" | "conference";
  journal?: string | null;
  conference?: string | null;
  title: string;
  abstract?: string | null;
  pdfUrl?: string | null;
  url?: string | null;
  imageUrl?: string | null;
  authors?: Author[];
};

export default function PublicationsSection() {
  const [data, setData] = useState<Publication[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // requestIdleCallback로 첫 페인트 후 네트워크 (원래 코드 스타일 유지)
    const run = () => {
      fetch("/api/publications/recent?limit=8")
        .then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const json = (await r.json()) as Publication[];
          if (!cancelled) {
            setData(Array.isArray(json) ? json : []);
            setLoading(false);
          }
        })
        .catch((e: any) => {
          if (!cancelled) {
            setErr(e?.message ?? "Failed to load");
            setLoading(false);
          }
        });
    };

    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(run);
    } else {
      // 폴백
      setTimeout(run, 0);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className={[
        "relative z-20 isolate overflow-visible", // 슬라이더가 아래 섹션에 가려지지 않게
      ].join(" ")}
      data-testid="publications-section"
    >
      {/* 헤더(필요시 유지/수정) */}
      <div className="text-center mb-10">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Latest Publications</h2>
        <p className="text-gray-600 mt-2">Recent Work in Top-Teir conferences.</p>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200/70 rounded-2xl" />
        </div>
      )}

      {/* 에러 상태 (있어도 화면 죽지 않게) */}
      {!loading && err && (
        <div className="rounded-xl border bg-red-50 text-red-700 p-4 text-sm">
          Failed to load publications: {err}
        </div>
      )}

      {/* 데이터 렌더 */}
      {!loading && !err && (
        <PublicationSlider publications={data ?? []} />
      )}
    </section>
  );
}
