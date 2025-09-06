// src/pages/home.tsx
import { Suspense, lazy, useLayoutEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// 아래 2개 섹션은 그대로 코드 스플릿
const PublicationsSection = lazy(() => import("./partials/PublicationsSection"));
const RecentNewsSection   = lazy(() => import("./partials/RecentNewsSection"));

export default function HomePage() {
  // 히어로 첫 등장을 확실히 애니메이션하기 위한 트리거
  const [heroReveal, setHeroReveal] = useState(false);

  // 더블 rAF로 초기 프레임(숨김 상태)을 먼저 그리고, 다음 프레임에 표시 → 애니메이션 보장
  useLayoutEffect(() => {
    let raf1 = 0, raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setHeroReveal(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <div data-testid="home-page">
      {/* ===== Hero ===== */}
      <section
        className={[
          "relative bg-gradient-to-br from-lab-blue to-lab-sky py-20 lg:py-32",
          "transition-opacity duration-700 ease-out",
          heroReveal ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Title */}
          <h1
            className={[
              "text-4xl lg:text-6xl font-bold text-white mb-6",
              "transition-all duration-700 ease-out transform-gpu will-change-transform",
              heroReveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            ].join(" ")}
            style={{ transitionDelay: heroReveal ? "0ms" : "0ms" }}
            data-testid="text-hero-title"
          >
            Generative Intelligence Lab
          </h1>

          {/* Subtitle */}
          <p
            className={[
              "text-xl lg:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto",
              "transition-all duration-700 ease-out transform-gpu will-change-transform",
              heroReveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
            ].join(" ")}
            style={{ transitionDelay: heroReveal ? "80ms" : "0ms" }}
            data-testid="text-hero-description"
          >
            Pioneering research in artificial intelligence, machine learning,
            and computational sciences to shape the future of technology.
          </p>

          {/* CTA Button */}
          <Link href="/research">
            <Button
              size="lg"
              className={[
                "bg-white text-lab-blue hover:bg-gray-100 transition-colors duration-200 transform hover:scale-105",
                "transition-all duration-700 ease-out transform-gpu will-change-transform",
                heroReveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
              ].join(" ")}
              style={{ transitionDelay: heroReveal ? "160ms" : "0ms" }}
              data-testid="button-explore-research"
            >
              Explore Our Research
            </Button>
          </Link>
        </div>
      </section>

      {/* ===== Publications (섹션 래퍼로 레이어/여백/오버플로우 확보) ===== */}
      <Suspense
        fallback={
          <div className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-8"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        }
      >
        <section className="relative z-20 isolate overflow-visible py-16 md:py-24 bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PublicationsSection />
          </div>
        </section>
      </Suspense>

      {/* ===== Recent News ===== */}
      <Suspense
        fallback={
          <div className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <RecentNewsSection />
      </Suspense>

    </div>
  );
}
