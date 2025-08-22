import { useEffect, useLayoutEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LabInfo } from "@/shared/schema";

export default function AboutLabSection() {
  const [reveal, setReveal] = useState(false);

  const labInfoQuery = useQuery<LabInfo | null>({
    queryKey: ["/lab-info"],
    queryFn: async () => {
      const r = await fetch("/api/lab-info");
      if (!r.ok) throw new Error("Failed to fetch lab info");
      return r.json();
    },
    enabled: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // idle 타이밍에 fetch
  useEffect(() => {
    const refetch = () => labInfoQuery.refetch();
    const id =
      "requestIdleCallback" in window
        ? (window as any).requestIdleCallback(refetch)
        : setTimeout(refetch, 0);
    return () => {
      if ("cancelIdleCallback" in window) (window as any).cancelIdleCallback(id);
      else clearTimeout(id as number);
    };
  }, []);

  // 첫 등장 애니메이션: 한 프레임 뒤에 reveal
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

  const labInfo = labInfoQuery.data;

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
        {!labInfo ? (
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        ) : (
          // 기존 About 섹션 내용으로 교체하세요
          <div>...About content using labInfo...</div>
        )}
      </div>
    </div>
  );
}
