import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function AccessPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest("POST", "/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent successfully!",
        description: "We will get back to you soon.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    contactMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="py-20" data-testid="access-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6" data-testid="text-page-title">
            Contact & Access
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="text-page-description">
            Get in touch with our laboratory or visit us at our state-of-the-art research facility.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
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
                    Advanced Research Laboratory<br />
                    123 University Avenue, Building A, Floor 5<br />
                    Seoul, South Korea 06351
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
                    +82-2-1234-5678
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
                    contact@advancedresearchlab.ac.kr
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
                  <p className="text-gray-600" data-testid="text-hours-value">
                    Monday - Friday: 9:00 AM - 6:00 PM<br />
                    Saturday: 10:00 AM - 2:00 PM<br />
                    Sunday: Closed
                  </p>
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
                      <h3 className="font-semibold text-gray-900 mb-2" data-testid="text-subway">
                        By Subway
                      </h3>
                      <p className="text-gray-600" data-testid="text-subway-info">
                        Line 2, University Station (Exit 3) - 5 minutes walk
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2" data-testid="text-bus">
                        By Bus
                      </h3>
                      <p className="text-gray-600" data-testid="text-bus-info">
                        Bus routes: 143, 241, 361, 420
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2" data-testid="text-parking">
                        Parking
                      </h3>
                      <p className="text-gray-600" data-testid="text-parking-info">
                        Visitor parking available in Building A basement
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-contact-form">
              Send us a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6" data-testid="form-contact">
              <div>
                <Label htmlFor="name" data-testid="label-name">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Your full name"
                  className="mt-2"
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label htmlFor="email" data-testid="label-email">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  className="mt-2"
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="subject" data-testid="label-subject">
                  Subject
                </Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => handleInputChange("subject", value)}
                >
                  <SelectTrigger className="mt-2" data-testid="select-subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collaboration" data-testid="option-collaboration">
                      Research Collaboration
                    </SelectItem>
                    <SelectItem value="visit" data-testid="option-visit">
                      Lab Visit Request
                    </SelectItem>
                    <SelectItem value="internship" data-testid="option-internship">
                      Internship Inquiry
                    </SelectItem>
                    <SelectItem value="general" data-testid="option-general">
                      General Inquiry
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message" data-testid="label-message">
                  Message
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="Please describe your inquiry in detail..."
                  rows={5}
                  className="mt-2 resize-none"
                  data-testid="textarea-message"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-lab-blue text-white hover:bg-blue-700 transition-colors"
                disabled={contactMutation.isPending}
                data-testid="button-submit"
              >
                {contactMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>

        {/* Map Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center" data-testid="text-location">
            Location
          </h2>
          <Card className="bg-gray-200 h-96 flex items-center justify-center" data-testid="card-map">
            <CardContent className="text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600" data-testid="text-map-placeholder">
                Interactive map will be integrated here
              </p>
              <p className="text-sm text-gray-500" data-testid="text-map-location">
                Seoul National University, Building A
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
