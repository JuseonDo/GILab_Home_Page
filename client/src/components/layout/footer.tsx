import { Link } from "wouter";
import { Twitter, Linkedin, Youtube, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4" data-testid="text-lab-title">
              Generative Intelligence Lab
            </h3>
            <p className="text-gray-300 mb-4" data-testid="text-lab-description">
              Pioneering research in artificial intelligence, machine learning, and computational sciences to shape the future of technology.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-linkedin">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" data-testid="link-youtube">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4" data-testid="text-quick-links">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link href="/research" data-testid="link-footer-research">
                  <span className="hover:text-white transition-colors cursor-pointer">Research Areas</span>
                </Link>
              </li>
              <li>
                <Link href="/members" data-testid="link-footer-team">
                  <span className="hover:text-white transition-colors cursor-pointer">Our Team</span>
                </Link>
              </li>
              <li>
                <Link href="/research" data-testid="link-footer-publications">
                  <span className="hover:text-white transition-colors cursor-pointer">Publications</span>
                </Link>
              </li>
              <li>
                <Link href="/access" data-testid="link-footer-contact">
                  <span className="hover:text-white transition-colors cursor-pointer">Contact Us</span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4" data-testid="text-contact-info">Contact Info</h4>
            <div className="text-gray-300 space-y-2">
              <p className="flex items-center" data-testid="text-contact-email">
                <Mail className="h-4 w-4 mr-2" />
                jingun.kwon@cnu.ac.kr
              </p>
              <p className="flex items-center" data-testid="text-contact-phone">
                <Phone className="h-4 w-4 mr-2" />
                +82 42-821-5449
              </p>
              <p className="flex items-center" data-testid="text-contact-location">
                <MapPin className="h-4 w-4 mr-2" />
                Daejeon, South Korea
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p data-testid="text-copyright">&copy; 2025 Generative Intelligence AI Laboratory. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
