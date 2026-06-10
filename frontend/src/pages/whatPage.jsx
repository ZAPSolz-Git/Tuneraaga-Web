import React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Music,
  Briefcase,
  Globe,
  Headphones,
  BarChart2,
  DollarSign,
  Rocket,
} from "lucide-react";

// ─── Blue Gradient Palette (Same Theme) ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const TEXT_BLACK = "#0f172a";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const WhatPage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative">
      
      {/* Hero Section */}
      <div className="relative w-full overflow-hidden py-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-50 mb-6">
              <Rocket className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Our Offerings</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6">
              What <span style={{ color: BLUE_DARK }}>TuneRaaga</span> Offers You
            </h1>
            
            <p className="max-w-3xl mx-auto text-lg text-slate-600 leading-relaxed">
              We have built our platform around one simple belief — every creator deserves a fair shot at a global audience. Here is everything we bring to the table.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Offerings Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Card 1: Independent Artists */}
          <OfferCard
            icon={Music}
            title="For Independent Artists"
            price="₹999"
            frequency="One-Time"
            features={[
              "Global music distribution to 150+ countries across all major DSPs.",
              "Unlimited song uploads with no cap on releases.",
              "100% royalties credited back to you (minus service commission).",
              "Real-time streaming analytics and revenue dashboard.",
              "ISRC code generation and metadata management.",
              "Cover art upload and release scheduling support.",
              "Dedicated support for content and distribution issues.",
              "Access to artist community, newsletters, and resources."
            ]}
            delay={0.1}
          />

          {/* Card 2: White Label Companies */}
          <OfferCard
            icon={Briefcase}
            title="For White Label Companies"
            price="₹14,000 - ₹15,000"
            frequency="One-Time"
            features={[
              "Fully branded White Label platform under your identity.",
              "Admin dashboard to onboard and manage artists.",
              "Complete revenue management infrastructure.",
              "Global DSP relationships and distribution infrastructure.",
              "Technical onboarding, training, and operational support.",
              "Scalable platform that grows with your roster.",
              "Confidential, professional partnership approach."
            ]}
            delay={0.2}
            highlight // Optional: make this card stand out slightly
          />

        </div>
      </div>

      {/* Platform Promise Section */}
      <div className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-white p-8 rounded-2xl border border-blue-200 shadow-sm"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Our Platform Promise</h3>
            <p className="text-slate-600 text-lg leading-relaxed">
              Every upload treated with priority. Every stream tracked with precision. Every rupee of revenue returned with full transparency. That is the <span style={{ color: BLUE_DARK }} className="font-semibold">TuneRaaga</span> promise.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Platforms Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-slate-900">Platforms Where Your Music Lives</h2>
          <p className="text-slate-500 mt-2">When you distribute through TuneRaaga, your music reaches listeners on:</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PlatformBadge name="Spotify" listeners="600M+ listeners" />
          <PlatformBadge name="Apple Music" listeners="90M+ subscribers" />
          <PlatformBadge name="Amazon Music" listeners="100M+ subscribers" />
          <PlatformBadge name="YouTube Music" listeners="80M+ premium" />
          <PlatformBadge name="JioSaavn" listeners="100M+ users (India)" />
          <PlatformBadge name="Gaana" listeners="185M+ users (India)" />
          <PlatformBadge name="Wynk Music" listeners="80M+ users" />
          <PlatformBadge name="Others" listeners="Tidal, Deezer & more" />
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to Be Heard?</h2>
          <p className="max-w-2xl mx-auto text-slate-600 text-lg mb-8">
            The world is listening. Over four billion people stream music every day. Your next fan could be anywhere. All they need is to find your music.
          </p>
          
          <button 
            className="px-8 py-4 rounded-xl font-bold text-white transition-all duration-300 hover:scale-105 shadow-lg shadow-blue-500/30"
            style={{ background: BLUE_GRADIENT }}
          >
            Join TuneRaaga Today
          </button>
          
          <p className="text-slate-500 mt-6 text-sm">
            Upload your music. Own your journey. Build your legacy — one stream at a time.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const OfferCard = ({ icon: Icon, title, price, frequency, features, delay, highlight }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`group relative h-full rounded-2xl border overflow-hidden transition-all duration-300 ${
      highlight 
        ? 'bg-white border-blue-500 shadow-lg shadow-blue-100' 
        : 'bg-slate-50 border-slate-200 hover:border-blue-300'
    }`}
  >
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors duration-300 ${
           highlight ? 'bg-blue-100 border-blue-200' : 'bg-white border-slate-200 group-hover:bg-blue-100 group-hover:border-blue-200'
        }`}>
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{frequency}</p>
        </div>
      </div>

      <div className="mb-8">
        <span className="text-4xl font-extrabold text-slate-900">{price}</span>
      </div>

      <ul className="space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <span className="text-slate-600 text-sm leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
    
    {/* Bottom Accent Line */}
    <div className={`h-1 w-full ${highlight ? 'bg-blue-500' : 'bg-transparent group-hover:bg-blue-500'} transition-all duration-500`}></div>
  </motion.div>
);

const PlatformBadge = ({ name, listeners }) => (
  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 hover:border-blue-300 transition-colors">
    <h4 className="font-bold text-slate-900 text-lg">{name}</h4>
    <p className="text-xs text-slate-500">{listeners}</p>
  </div>
);

export default WhatPage;