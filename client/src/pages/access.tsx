import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LabInfo } from "@/shared/schema";

// Google Maps 설정
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function AccessPage() {
  // lab info 데이터 가져오기
  const { data: labInfo } = useQuery<LabInfo>({
    queryKey: ["/lab-info"],
    queryFn: async () => {
      const response = await fetch("/api/lab-info");
      if (response.status === 404) return {};
      if (!response.ok) throw new Error("Failed to fetch lab info");
      return response.json();
    },
  });

  // Google Maps 초기화
  const initMap = () => {
    console.log("initMap called");
    try {
      const lat = parseFloat(labInfo?.latitude || "36.3664");
      const lng = parseFloat(labInfo?.longitude || "127.3441");
      console.log("Map coordinates:", { lat, lng });
      
      const mapElement = document.getElementById("map");
      if (!mapElement) {
        console.error("Map element not found");
        return;
      }
      
      if (!window.google || !window.google.maps) {
        console.error("Google Maps API not loaded");
        return;
      }
      
      const map = new window.google.maps.Map(mapElement, {
        zoom: 16,
        center: { lat, lng },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      // 지도 에러 리스너 추가
      map.addListener('tilesloaded', () => {
        console.log("Map tiles loaded successfully");
      });

      new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: labInfo?.labName || "Research Laboratory",
      });
      
      // Hide fallback content
      const fallbackElement = document.querySelector("#map .absolute");
      if (fallbackElement) {
        (fallbackElement as HTMLElement).style.display = "none";
      }
      
      console.log("Map initialized successfully");
    } catch (error: any) {
      console.error("Error initializing map:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      
      let errorMessage = "Failed to load map";
      if (error.message && error.message.includes("RefererNotAllowed")) {
        errorMessage = "API key domain restriction error";
      } else if (error.message && error.message.includes("RequestDenied")) {
        errorMessage = "API request denied - check API key";
      }
      
      // Show error message in fallback content
      const fallbackElement = document.querySelector("#map .absolute");
      if (fallbackElement) {
        fallbackElement.innerHTML = `
          <div class="text-center">
            <div class="h-16 w-16 mx-auto mb-4 text-red-400">⚠️</div>
            <p class="text-red-600">${errorMessage}</p>
            <p class="text-sm mt-2 text-gray-600">Location: 대전 유성구 대학로 99 충남대학교 공과대학5호관 Room W2-512</p>
            <p class="text-xs mt-1 text-gray-500">Check console for technical details</p>
          </div>
        `;
      }
    }
  };

  // Google Maps API 로드
  const loadGoogleMaps = () => {
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    console.log("Loading Google Maps...", { hasApiKey: !!GOOGLE_MAPS_API_KEY });
    
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("Google Maps API key not found in environment variables");
      console.error("Available env vars:", Object.keys(import.meta.env));
      return;
    }
    
    if (window.google && window.google.maps) {
      console.log("Google Maps already loaded, initializing...");
      initMap();
      return;
    }

    console.log("Loading Google Maps script...");
    window.initMap = initMap;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    script.onerror = (error) => {
      console.error("Failed to load Google Maps script:", error);
      console.error("API Key being used:", GOOGLE_MAPS_API_KEY);
      console.error("Script URL:", script.src);
      
      // Show fallback message
      const fallbackElement = document.querySelector("#map .absolute");
      if (fallbackElement) {
        fallbackElement.innerHTML = `
          <div class="text-center">
            <div class="h-16 w-16 mx-auto mb-4 text-yellow-400">🗺️</div>
            <p class="text-yellow-600 font-semibold">Google Maps API Error</p>
            <p class="text-sm mt-2 text-gray-600">Location: 대전 유성구 대학로 99 충남대학교 공과대학5호관 Room W2-512</p>
            <p class="text-xs mt-1 text-gray-500">Check browser console for details</p>
            <button onclick="window.location.reload()" class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
              Retry
            </button>
          </div>
        `;
      }
    };
    
    script.onload = () => {
      console.log("Google Maps script loaded successfully");
    };
    
    document.head.appendChild(script);
    console.log("Google Maps script added to head");
  };

  // lab info가 로드되면 지도 초기화 (lab info가 없어도 기본 좌표로 로드)
  React.useEffect(() => {
    // 5초 후에도 지도가 로드되지 않으면 static map 표시
    const fallbackTimer = setTimeout(() => {
      const mapElement = document.getElementById("map");
      if (mapElement && !window.google) {
        const fallbackElement = mapElement.querySelector(".absolute");
        if (fallbackElement) {
          const lat = labInfo?.latitude || "36.3664";
          const lng = labInfo?.longitude || "127.3441";
          fallbackElement.innerHTML = `
            <div class="relative w-full h-full">
              <iframe
                width="100%"
                height="100%"
                frameborder="0"
                scrolling="no"
                marginheight="0"
                marginwidth="0"
                src="https://www.openstreetmap.org/export/embed.html?bbox=127.340,36.362,127.348,36.370&layer=mapnik&marker=${lat},${lng}"
                style="border: none; height: 100%; width: 100%;"
                class="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
          `;
        }
      }
    }, 5000);

    loadGoogleMaps();

    return () => clearTimeout(fallbackTimer);
  }, [labInfo]);

  return (
    <div className="py-20" data-testid="access-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6" data-testid="text-page-title">
            Contact & Access
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="text-page-description">
            Get in touch with our laboratory or visit us at our laboratory.
          </p>
        </div>

        {/* Contact Information */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-contact-info">
            Contact Information
          </h2>

          <div className="space-y-6">
            <div className="flex items-start space-x-4" data-testid="contact-address">
              <div className="w-12 h-12 bg-lab-blue rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1" data-testid="text-address-label">
                  Address
                </h3>
                <p className="text-gray-600" data-testid="text-address-value">
                  {"대전 유성구 대학로 99 충남대학교 공과대학5호관 Room W2-512"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4" data-testid="contact-phone">
              <div className="w-12 h-12 bg-lab-blue rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1" data-testid="text-phone-label">
                  Phone
                </h3>
                <p className="text-gray-600" data-testid="text-phone-value">
                  {labInfo?.contactPhone || "Phone not available"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4" data-testid="contact-email">
              <div className="w-12 h-12 bg-lab-blue rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1" data-testid="text-email-label">
                  Email
                </h3>
                <p className="text-gray-600" data-testid="text-email-value">
                  {labInfo?.contactEmail || "Email not available"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4" data-testid="contact-hours">
              <div className="w-12 h-12 bg-lab-blue rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1" data-testid="text-hours-label">
                  Office Hours
                </h3>
                <div className="text-gray-600" data-testid="text-hours-value" dangerouslySetInnerHTML={{
                  __html: labInfo?.officeHours || "Monday - Friday: 9:00 AM - 6:00 PM<br />Saturday: 10:00 AM - 2:00 PM<br />Sunday: Closed"
                }} />
              </div>
            </div>
          </div>

          {/* Transportation */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6" data-testid="text-transportation">
              Transportation
            </h2>
            <Card className="bg-gray-50" data-testid="card-transportation">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2" data-testid="text-bus">
                      By Bus
                    </h3>
                    <p className="text-gray-600" data-testid="text-bus-info">
                      Bus routes: 48, 108
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2" data-testid="text-parking">
                      Parking
                    </h3>
                    <p className="text-gray-600" data-testid="text-parking-info">
                      Visitor parking available in Chungnam National University
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center" data-testid="text-location">
            Location
          </h2>
          <Card className="overflow-hidden" data-testid="card-map">
            <div 
              id="map" 
              className="w-full h-96 relative"
              data-testid="google-map"
            >
              {/* Fallback content while map loads */}
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p>Loading map...</p>
                  <p className="text-sm mt-2">If the map doesn't load, please check your internet connection</p>
                </div>
              </div>
            </div>
          </Card>
          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">
              📍 {"대전 유성구 대학로 99 충남대학교 공과대학5호관 Room W2-512"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}