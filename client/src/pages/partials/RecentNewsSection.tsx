import { useEffect, useLayoutEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function RecentNewsSection() {
  const [reveal, setReveal] = useState(false);

  const newsQuery = useQuery({
    queryKey: ["/news", { limit: 3 }],
    queryFn: async () => {
      const r = await fetch("/api/news?limit=3");
      if (!r.ok) throw new Error("Failed to fetch news");
      return r.json();
    },
    enabled: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const refetch = () => newsQuery.refetch();
    const id =
      "requestIdleCallback" in window
        ? (window as any).requestIdleCallback(refetch)
        : setTimeout(refetch, 0);
    return () => {
      if ("cancelIdleCallback" in window) (window as any).cancelIdleCallback(id);
      else clearTimeout(id as number);
    };
  }, []);

  // 첫 등장 애니메이션
  useLayoutEffect(() => {
    let raf1 = 0,
      raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setReveal(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <div
      style={{ contentVisibility: "auto", containIntrinsicSize: "1200px 800px" }}
      className={[
        "py-20 bg-white",
        "transition-opacity transition-transform duration-700 ease-out",
        "transform-gpu will-change-transform",
        reveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!newsQuery.data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Recent News</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Stay updated with the latest news.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {newsQuery.data.map((n: any) => (
                <Link key={n.id} href={`/news/${n.id}`} className="block">
                  <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    {n.imageUrl && (
                      <div className="aspect-video bg-gray-200">
                        <img
                          src={n.imageUrl}
                          alt={n.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {n.title}
                      </h3>
                      {n.summary && (
                        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                          {n.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {new Date(n.publishedAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        {n.author && (
                          <span>
                            {n.author.firstName} {n.author.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link href="/news" className="inline-flex px-4 py-2 border rounded">
                View All News
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
