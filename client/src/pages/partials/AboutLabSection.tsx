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
        "py-20 bg-gradient-to-br from-gray-50 to-blue-50",
        "transition-opacity transition-transform duration-700 ease-out",
        "transform-gpu will-change-transform",
        reveal ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      ].join(" ")}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!labInfo ? (
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Lab Information */}
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                About Our Lab
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {labInfo.labName}
                  </h3>
                  {labInfo.description && (
                    <p className="text-gray-600 leading-relaxed">
                      {labInfo.description}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2">Principal Investigator</h4>
                    <p className="text-gray-600">
                      {labInfo.principalInvestigator}
                      {labInfo.piTitle && `, ${labInfo.piTitle}`}
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                    <p className="text-gray-600">
                      {labInfo.university}
                      {labInfo.department && `, ${labInfo.department}`}
                    </p>
                    {labInfo.address && (
                      <p className="text-sm text-gray-500 mt-1">{labInfo.address}</p>
                    )}
                  </div>
                </div>

                {labInfo.researchFocus && (
                  <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-2">Research Focus</h4>
                    <p className="text-gray-600">{labInfo.researchFocus}</p>
                  </div>
                )}
              </div>
            </div>

            {/* PI Photo and Contact */}
            <div className="text-center">
              {labInfo.piPhoto && (
                <div className="mb-6">
                  <img
                    src={labInfo.piPhoto}
                    alt={labInfo.principalInvestigator}
                    className="w-48 h-48 rounded-full object-cover mx-auto shadow-lg"
                  />
                </div>
              )}
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  {labInfo.contactEmail && (
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      <a
                        href={`mailto:${labInfo.contactEmail}`}
                        className="text-blue-600 hover:underline"
                      >
                        {labInfo.contactEmail}
                      </a>
                    </p>
                  )}
                  {labInfo.contactPhone && (
                    <p>
                      <span className="font-medium">Phone:</span> {labInfo.contactPhone}
                    </p>
                  )}
                  {labInfo.officeHours && (
                    <p>
                      <span className="font-medium">Office Hours:</span> {labInfo.officeHours}
                    </p>
                  )}
                  {labInfo.website && (
                    <p>
                      <span className="font-medium">Website:</span>{" "}
                      <a
                        href={labInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {labInfo.website}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
