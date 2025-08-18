import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Save, Camera, Globe, Clock, Mail, Phone, Building, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { LabInfo } from "@shared/schema";

const labInfoSchema = z.object({
  labName: z.string().min(1, "Lab name is required"),
  principalInvestigator: z.string().min(1, "Principal investigator name is required"),
  piTitle: z.string().min(1, "PI title is required"),
  piEmail: z.string().email().optional().or(z.literal("")),
  piPhone: z.string().optional(),
  piPhoto: z.string().url().optional().or(z.literal("")),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  building: z.string().optional(),
  room: z.string().optional(),
  university: z.string().min(1, "University is required"),
  department: z.string().min(1, "Department is required"),
  website: z.string().url().optional().or(z.literal("")),
  establishedYear: z.string().optional(),
  researchFocus: z.string().optional(),
  contactEmail: z.string().email("Valid contact email is required"),
  contactPhone: z.string().optional(),
  officeHours: z.string().optional(),
});

type LabInfoFormData = z.infer<typeof labInfoSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fetch lab info
  const { data: labInfo, isLoading } = useQuery<LabInfo | null>({
    queryKey: ["/api/lab-info"],
  });

  const form = useForm<LabInfoFormData>({
    resolver: zodResolver(labInfoSchema),
    defaultValues: {
      labName: "",
      principalInvestigator: "",
      piTitle: "",
      piEmail: "",
      piPhone: "",
      piPhoto: "",
      description: "",
      address: "",
      latitude: "",
      longitude: "",
      building: "",
      room: "",
      university: "",
      department: "",
      website: "",
      establishedYear: "",
      researchFocus: "",
      contactEmail: "",
      contactPhone: "",
      officeHours: "",
    },
  });

  // Update form when lab info is loaded
  useEffect(() => {
    if (labInfo) {
      form.reset({
        labName: labInfo.labName || "",
        principalInvestigator: labInfo.principalInvestigator || "",
        piTitle: labInfo.piTitle || "",
        piEmail: labInfo.piEmail || "",
        piPhone: labInfo.piPhone || "",
        piPhoto: labInfo.piPhoto || "",
        description: labInfo.description || "",
        address: labInfo.address || "",
        latitude: labInfo.latitude || "",
        longitude: labInfo.longitude || "",
        building: labInfo.building || "",
        room: labInfo.room || "",
        university: labInfo.university || "",
        department: labInfo.department || "",
        website: labInfo.website || "",
        establishedYear: labInfo.establishedYear || "",
        researchFocus: labInfo.researchFocus || "",
        contactEmail: labInfo.contactEmail || "",
        contactPhone: labInfo.contactPhone || "",
        officeHours: labInfo.officeHours || "",
      });
    }
  }, [labInfo, form]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: LabInfoFormData) => {
      const response = await fetch("/api/lab-info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update lab information");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lab-info"] });
      toast({
        title: "Success",
        description: "Lab information updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update lab information",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LabInfoFormData) => {
    updateMutation.mutate(data);
  };

  // Initialize Google Maps
  useEffect(() => {
    if (!window.google && !document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if (window.google) {
      setMapLoaded(true);
    }
  }, []);

  // Initialize address autocomplete
  useEffect(() => {
    if (mapLoaded && window.google) {
      const addressInput = document.getElementById('address') as HTMLInputElement;
      if (addressInput) {
        const autocomplete = new window.google.maps.places.Autocomplete(addressInput);
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location) {
            form.setValue('latitude', place.geometry.location.lat().toString());
            form.setValue('longitude', place.geometry.location.lng().toString());
          }
        });
      }
    }
  }, [mapLoaded, form]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="settings-page">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Lab Settings</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Configure your laboratory information that will be displayed throughout the website
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Lab Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Essential laboratory details
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="labName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lab Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Advanced AI Research Lab" {...field} data-testid="input-lab-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="establishedYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Established Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2020" {...field} data-testid="input-established-year" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>University *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Stanford University" {...field} data-testid="input-university" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Computer Science" {...field} data-testid="input-department" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lab Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of your lab's mission and work..."
                              className="min-h-[100px]"
                              {...field} 
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="researchFocus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Research Focus</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Machine Learning, AI Ethics" {...field} data-testid="input-research-focus" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lab Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://lab.university.edu" {...field} data-testid="input-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Principal Investigator Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Principal Investigator
                  </CardTitle>
                  <CardDescription>
                    Information about the lab director
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="principalInvestigator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Jane Smith" {...field} data-testid="input-pi-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="piTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Professor, PhD" {...field} data-testid="input-pi-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="piEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="jane.smith@university.edu" {...field} data-testid="input-pi-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="piPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-pi-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="piPhoto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Camera className="w-4 h-4" />
                            Photo URL
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/photo.jpg" {...field} data-testid="input-pi-photo" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location & Contact
                  </CardTitle>
                  <CardDescription>
                    Physical location and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address *</FormLabel>
                          <FormControl>
                            <Input 
                              id="address"
                              placeholder="353 Jane Stanford Way, Stanford, CA 94305"
                              {...field} 
                              data-testid="input-address"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="building"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building</FormLabel>
                        <FormControl>
                          <Input placeholder="Gates Building" {...field} data-testid="input-building" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="room"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room</FormLabel>
                        <FormControl>
                          <Input placeholder="Room 314" {...field} data-testid="input-room" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input placeholder="37.4419" {...field} data-testid="input-latitude" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input placeholder="-122.1430" {...field} data-testid="input-longitude" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Contact Email *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="lab@university.edu" {...field} data-testid="input-contact-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Contact Phone
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-contact-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="officeHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Office Hours
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Mon-Fri 9:00 AM - 5:00 PM" {...field} data-testid="input-office-hours" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  data-testid="button-save-settings"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}