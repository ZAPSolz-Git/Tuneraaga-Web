import React from "react";
import { Link } from "react-router-dom";
import {
  Play,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Heart,
  Copyright,
  Info,
  BookOpen,
  Headphones,
  Globe,
  Shield,
  Coffee,
} from "lucide-react";

// ─── Colors ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: "About Us", path: "/about", icon: Info },
      { name: "Our DNA", path: "/about", icon: Headphones },
      { name: "Knowledge", path: "/knowledge", icon: BookOpen },
      { name: "Reached", path: "/reached", icon: Coffee },
      { name: "Audience", path: "/audience", icon: Globe },
      { name: "What we offer", path: "/what", icon: Globe },
    ],
    support: [
      { name: "Help Center", path: "/help", icon: Headphones },
      { name: "Contact Us", path: "/contact", icon: Mail },
      { name: "Privacy Policy", path: "/privacy", icon: Shield },
      { name: "Terms of Service", path: "/terms", icon: Shield },
      { name: "Cookie Policy", path: "/cookies", icon: Shield },
    ],
  };

  const socialIcons = [
    {
      icon: Facebook,
      href: "https://facebook.com",
      label: "Facebook",
      color: "#1877f2",
    },
    {
      icon: Twitter,
      href: "https://twitter.com",
      label: "Twitter",
      color: "#1da1f2",
    },
    {
      icon: Instagram,
      href: "https://instagram.com",
      label: "Instagram",
      color: "#e4405f",
    },
    {
      icon: Youtube,
      href: "https://youtube.com",
      label: "YouTube",
      color: "#ff0000",
    },
  ];

  return (
    <footer className="bg-gradient-to-br from-white via-slate-50 to-white border-t border-slate-200">
      {/* Decorative Top Border - Thinner */}
      <div className="h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

      {/* Main Footer Content - Reduced Padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        {/* Top Section with Newsletter and Brand - Reduced Gap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 pb-6 border-b border-slate-200">
          {/* Brand Section - Compact */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                style={{ background: BLUE_GRADIENT }}
              >
                <Play className="w-5 h-5 fill-white text-white" />
              </div>
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Tune Raaga
                </span>
                <p className="text-slate-500 text-xs">Where Music Meets Soul</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md">
              Experience the perfect harmony of melodies and knowledge. Premium
              audio entertainment with cultural enrichment.
            </p>
            <div className="flex space-x-2">
              {socialIcons.map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-transparent flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-md group"
                  aria-label={social.label}
                >
                  <social.icon className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter Signup - Compact */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl transform rotate-1"></div>
            <div className="relative bg-white rounded-xl p-5 shadow-md border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Stay Tuned!
                </h3>
              </div>
              <p className="text-slate-600 text-xs mb-3">
                Get exclusive updates about new releases and special offers.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
                />
                <button className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold hover:shadow-md transition-all hover:scale-105">
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                No spam, unsubscribe anytime
              </p>
            </div>
          </div>
        </div>

        {/* Links Grid - Reduced Gap and Compact */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Company Column - Compact */}
          <div className="space-y-3">
            <h3 className="font-bold text-base text-slate-800 relative inline-block">
              Company
              <span
                className="absolute -bottom-1 left-0 w-8 h-0.5 rounded-full"
                style={{ background: BLUE_GRADIENT }}
              ></span>
            </h3>
            <ul className="space-y-2 mt-3">
              {footerLinks.company.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all duration-200"
                  >
                    <div className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition-all">
                      <link.icon className="w-3 h-3 text-slate-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="text-sm">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column - Compact */}
          <div className="space-y-3">
            <h3 className="font-bold text-base text-slate-800 relative inline-block">
              Support
              <span
                className="absolute -bottom-1 left-0 w-8 h-0.5 rounded-full"
                style={{ background: BLUE_GRADIENT }}
              ></span>
            </h3>
            <ul className="space-y-2 mt-3">
              {footerLinks.support.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.path}
                    className="group flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-all duration-200"
                  >
                    <div className="w-6 h-6 rounded-md bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition-all">
                      <link.icon className="w-3 h-3 text-slate-500 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="text-sm">{link.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info Column - Compact */}
          <div className="space-y-3">
            <h3 className="font-bold text-base text-slate-800 relative inline-block">
              Get in Touch
              <span
                className="absolute -bottom-1 left-0 w-8 h-0.5 rounded-full"
                style={{ background: BLUE_GRADIENT }}
              ></span>
            </h3>
            <ul className="space-y-2 mt-3">
              <li className="group flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">
                    support@tuneraaga.com
                  </p>
                </div>
              </li>
              <li className="group flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-700">+1 (555) 123-4567</p>
                </div>
              </li>
              <li className="group flex items-start gap-2">
                <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-700 leading-tight">
                    123 Music Street, Melody City
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar - Compact */}
        <div className="border-t border-slate-200 pt-5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <Copyright className="w-3 h-3" />
              <span>{currentYear} Tune Raaga. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full">
              <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />

              <span className="text-slate-600 text-xs">
                Made with love for music lovers
              </span>
              
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
