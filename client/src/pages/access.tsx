// client/src/pages/access.tsx
import React, { useEffect, useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getLabInfo } from "@/lib/staticApi";

type LabInfo = {
  labName?: string;
  latitude?: string;
  longitude?: string;
  contactPhone?: string;
  contactEmail?: string;
  officeHours?: string;
  address?: string;
} | null;

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function AccessPage() {
  const [labInfo, setLabInfo] = useState<LabInfo>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getLabInfo();
        setLabInfo(data);
      } catch (e) {
        console.error("Failed to load lab info:", e);
      }
    };
    loadData();
  }, []);

  const initMap = () => {
    try {
      const lat = parseFloat(labInfo?.latitude || "36.3664");
      const lng = parseFloat(labInfo?.longitude || "127.3441");

      const mapElement = document.getElementById("map");
      if (!mapElement) return;

      if (!window.google || !window.google.maps) return;

      const map = new window.google.maps.Map(mapElement, {
        zoom: 16,
        center: { lat, lng },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        title: labInfo?.labName || "Research Laboratory",
      });

      const fallbackElement = document.querySelector("#map .absolute");
      if (fallbackElement) {
        (fallbackElement as HTMLElement).style.display = "none";
      }
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  };

  const loadGoogleMaps = () => {
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!GOOGLE_MAPS_API_KEY) {
      showOpenStreetMap();
      return;
    }

    if (window.google && window.google.maps) {
      initMap();
      return;
    }

    window.initMap = initMap;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      showOpenStreetMap();
    };

    document.head.appendChild(script);
  };

  const showOpenStreetMap = () => {
    const mapElement = document.getElementById("map");
    if (mapElement) {
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
  };

  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!window.google) {
        showOpenStreetMap();
      }
    }, 3000);

    loadGoogleMaps();

    return () => clearTimeout(fallbackTimer);
  }, [labInfo]);

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Contact & Access</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get in touch with our laboratory or visit us at our laboratory.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Contact Information</h2>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                <p className="text-gray-600">
                  {labInfo?.address || "대전 유성구 대학로 99 충남대학교 공과대학5호관 Room W2-512"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                <p className="text-gray-600">{labInfo?.contactPhone || "+82 42-821-5449"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <p className="text-gray-600">{labInfo?.contactEmail || "jingun.kwon@cnu.ac.kr"}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Office Hours</h3>
                <div
                  className="text-gray-600"
                  dangerouslySetInnerHTML={{
                    __html:
                      labInfo?.officeHours ||
                      "Monday - Friday: 9:00 AM - 6:00 PM<br />Saturday: Closed<br />Sunday: Closed",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Transportation</h2>
            <Card className="bg-gray-50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">By Bus</h3>
                    <p className="text-gray-600">Bus routes: 48, 108</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Parking</h3>
                    <p className="text-gray-600">Visitor parking available in Chungnam National University</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Location</h2>
          <Card className="overflow-hidden">
            <div id="map" className="w-full h-96 relative">
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
              {labInfo?.address || "대전 유성구 대학로 99 충남대학교 공과대학5호관 Room W2-512"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
