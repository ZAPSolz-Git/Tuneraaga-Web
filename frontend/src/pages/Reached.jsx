import React from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Users,
  Music2,
  Film,
  TrendingUp,
  IndianRupee,
  MapPin,
  Smartphone,
  Languages,
  Video,
  BarChart2,
} from "lucide-react";

// ─── Blue Gradient Palette (Same as KnowledgePage) ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const TEXT_BLACK = "#0f172a";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const ReachedPage = () => {
  return (
    // Clean White Background
    <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden">
      
      {/* Hero Section - Clean Image WITHOUT White Blur */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&h=1080&fit=crop"
          alt="Global Network"
          className="w-full h-full object-cover" // Removed opacity for clean image
        />
        {/* Gradient Overlay: Dark on top/center for text contrast, fading to White at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-black/20 to-black/60" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.3em] text-blue-300 mb-4 border border-white/20 px-4 py-1 rounded-full bg-black/10 backdrop-blur-sm"
          >
            Section 04
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white"
          >
            The Projected <span style={{ color: BLUE_LIGHT }}>Reach</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 max-w-2xl text-lg text-slate-200"
          >
            We are living through the single greatest shift in how content is
            consumed.
          </motion.p>
        </div>
      </div>

      {/* Audio Streaming Stats */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-100 border border-blue-200">
              <Music2 className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-sm uppercase tracking-widest text-blue-600 font-semibold">
              Global Audio Streaming
            </h2>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">
            The Numbers Behind The Music
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            value="700 Million+"
            label="Active Paid Subscribers"
            icon={Users}
            delay={0.1}
          />
          <StatCard
            value="4 Billion+"
            label="Total Music Streaming Users"
            icon={Globe}
            delay={0.2}
          />
          <StatCard
            value="100,000+"
            label="New Tracks Uploaded Daily"
            icon={TrendingUp}
            delay={0.3}
          />
          <StatCard
            value="82%"
            label="Global Music Revenue via Streaming"
            icon={BarChart2}
            delay={0.4}
          />
          <StatCard
            value="₹16,000+ Cr"
            label="India's Digital Market Value by 2030"
            icon={IndianRupee}
            delay={0.5}
          />
          <StatCard
            value="150+"
            label="Countries Within Instant Reach"
            icon={MapPin}
            delay={0.6}
          />
        </div>
      </div>

      {/* Video Streaming Stats */}
      <div className="bg-slate-50 py-24 border-y border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-100 border border-blue-200">
                <Film className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-sm uppercase tracking-widest text-blue-600 font-semibold">
                Global Video Streaming
              </h2>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">
              Visual Content Domination
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              value="2.7 Billion+"
              label="Monthly YouTube Users"
              icon={Globe}
              delay={0.1}
            />
            <StatCard
              value="500 Hours"
              label="Video Uploaded Per Minute"
              icon={Video}
              delay={0.2}
            />
            <StatCard
              value="1.5 Billion+"
              label="Connected TV & Smart Device Users"
              icon={Smartphone}
              delay={0.3}
            />
            <StatCard
              value="$330 Billion+"
              label="Projected Market Value by 2030"
              icon={TrendingUp}
              delay={0.4}
            />
          </div>
        </div>
      </div>

      {/* India's Streaming Opportunity */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
        >
          <div>
            <h2 className="text-sm uppercase tracking-widest mb-4 font-bold text-blue-600">
              The Indian Market
            </h2>
            <h3 className="text-4xl font-bold mb-6 leading-tight text-slate-900">
              India's Streaming <br /> Opportunity
            </h3>
            <p className="text-slate-600 leading-relaxed mb-6 text-lg">
              India represents one of the most exciting and rapidly expanding
              digital streaming markets in the world. With over 800 million
              internet users, the explosion of affordable data plans, and a
              deeply music-loving culture, India's streaming audience is growing
              at an unparalleled pace.
            </p>

            <div className="space-y-3">
              <FeatureHighlight
                title="6th Largest Market"
                description="India is the world's 6th largest music market by streaming volume."
                icon={TrendingUp}
              />
              <FeatureHighlight
                title="Regional Content Growth"
                description="Bhojpuri, Punjabi, Tamil, Telugu are the fastest-growing categories."
                icon={Languages}
              />
              <FeatureHighlight
                title="Independent Scene"
                description="Independent music scene grown by 300% in five years via digital distribution."
                icon={Music2}
              />
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-slate-700 italic text-base font-medium border-l-2 border-blue-500 pl-4">
                "The question is no longer whether to be on streaming platforms.
                The question is whether your content is being heard — and
                whether you are being paid. We ensure both."
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative w-full h-[500px] rounded-2xl overflow-hidden group border border-slate-200"
          >
            <img
              src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop"
              alt="India Market"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Clean Gradient overlay to make text readable on image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Floating Glass Card */}
            <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-lg p-5 rounded-xl border border-slate-200 shadow-lg">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-blue-600 mb-1 uppercase font-semibold">
                    Active Monthly Users
                  </p>
                  <p className="text-3xl font-bold text-slate-900">200 Million+</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1 uppercase font-semibold">
                    Internet Users
                  </p>
                  <p className="text-3xl font-bold text-slate-900">800 Million+</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// --- Premium StatCard Component (Light Theme) ---
const StatCard = ({ value, label, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="relative p-6 rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg"
  >
    {/* Corner Shine Effect */}
    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="mb-5 flex justify-between items-start">
        {/* Icon Box: Blue Theme */}
        <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 bg-blue-50 border border-blue-100 group-hover:bg-blue-500 group-hover:border-transparent">
          <Icon className="w-7 h-7 transition-colors duration-300 text-blue-500 group-hover:text-white" />
        </div>
      </div>
      <div>
        <h4 className="text-4xl font-extrabold mb-2 text-slate-900 tracking-tight">
          {value}
        </h4>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
      </div>
    </div>
  </motion.div>
);

// --- Feature Highlight Component (Light Theme) ---
const FeatureHighlight = ({ title, description, icon: Icon }) => (
  <div className="flex gap-4 items-start p-4 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50/50 transition-all group cursor-default">
    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100 border border-blue-200 group-hover:bg-blue-500 transition-colors duration-300">
      <Icon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
    </div>
    <div>
      <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  </div>
);

export default ReachedPage;