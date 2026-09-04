import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Server,
  Globe,
  Layers,
  Database,
  Fingerprint,
  DollarSign,
  Send,
  Zap,
  Music2,
  Film,
} from "lucide-react";

// ─── Blue Gradient Palette ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const TEXT_BLACK = "#0f172a";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const KnowledgePage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* Hero Section - Clean Image WITHOUT White Blur */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&h=1080&fit=crop"
          alt="Technology Background"
          className="w-full h-full object-cover" // Removed opacity-30 for a clean, vibrant image
        />
        {/* 
           Gradient Overlay: 
           'from-black/60' (Top) -> Helps white text pop.
           'via-black/30' (Middle) -> Keeps image visible.
           'to-white' (Bottom) -> Smooth transition to the white section below.
        */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-black/20 to-black/60" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            // Changed to a "Glass" look pill to stand out on the image
            className="text-xs uppercase tracking-[0.3em] text-white/90 mb-4 border border-white/20 px-4 py-1 rounded-full bg-black/10 backdrop-blur-sm"
          >
            Knowledge Base
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-white" // Changed text to white
          >
            The <span style={{ color: BLUE_LIGHT }}>Streaming</span> Ecosystem
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 max-w-2xl text-lg text-slate-200" // Changed text to light gray
          >
            Understanding the technology, infrastructure, and economy behind
            digital media.
          </motion.p>
        </div>
      </div>

      {/* Section 1: What is it? */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2
              className="text-sm uppercase tracking-widest mb-4 font-bold"
              style={{ color: BLUE_DARK }}
            >
              Definition
            </h2>
            <h3 className="text-4xl font-bold mb-6 leading-tight" style={{ color: TEXT_BLACK }}>
              What Is a Digital <br /> Streaming Platform?
            </h3>
            <p className="text-slate-600 leading-relaxed mb-6 text-lg">
              A Digital Streaming Platform is an internet-powered service that
              delivers audio, video, or multimedia content to users in real time
              — without requiring them to download the content permanently.
            </p>
            <p className="text-slate-500 leading-relaxed border-l-2 border-blue-500 pl-4 italic bg-blue-50 py-4 rounded-r-lg">
              "You do not own the content. You access it. And in that access, a
              new economy of music and entertainment was born."
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {/* Audio Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-blue-100 border border-blue-200 group-hover:bg-blue-500 transition-all duration-300">
                  <Music2 className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-2xl font-bold mb-4" style={{ color: TEXT_BLACK }}>Audio Streaming</h4>
                <p className="text-slate-500 leading-relaxed mb-6">
                  Real-time delivery of music, podcasts, and audiobooks.
                  Dominated by platforms like Spotify and Apple Music serving
                  millions of tracks instantly.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Spotify", "Apple Music", "JioSaavn"].map((name) => (
                    <span key={name} className="px-3 py-1 text-xs bg-white rounded-full text-slate-600 border border-slate-200 shadow-sm">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Video Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-blue-100 border border-blue-200 group-hover:bg-blue-500 transition-all duration-300">
                  <Film className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-2xl font-bold mb-4" style={{ color: TEXT_BLACK }}>Video Streaming</h4>
                <p className="text-slate-500 leading-relaxed mb-6">
                  Real-time delivery of visual content, music videos, and
                  documentaries. Dominated by platforms like YouTube and Netflix
                  reaching billions daily.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["YouTube", "Netflix", "Prime Video"].map((name) => (
                    <span key={name} className="px-3 py-1 text-xs bg-white rounded-full text-slate-600 border border-slate-200 shadow-sm">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Section 3: Industry Terms */}
      <div className="bg-slate-50 py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className="text-sm uppercase tracking-widest mb-4 font-bold"
              style={{ color: BLUE_DARK }}
            >
              Glossary
            </h2>
            <h3 className="text-4xl font-bold" style={{ color: TEXT_BLACK }}>Key Industry Terms</h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {termsData.map((term, index) => (
              <TermCard key={index} {...term} delay={index * 0.05} />
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: How It Works Timeline */}
      <div className="bg-white py-24">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className="text-sm uppercase tracking-widest mb-4 font-bold"
              style={{ color: BLUE_DARK }}
            >
              The Process
            </h2>
            <h3 className="text-4xl font-bold" style={{ color: TEXT_BLACK }}>How Streaming Actually Works</h3>
          </motion.div>

          <div className="relative">
            {/* The vertical line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-slate-200 transform md:-translate-x-1/2" />

            {/* Steps */}
            {stepsData.map((step, index) => (
              <StepItem
                key={index}
                step={step}
                index={index}
                totalSteps={stepsData.length}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Term Card Component
const TermCard = ({ title, description, icon: Icon, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group cursor-default"
  >
    <div className="flex items-start gap-4">
      <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors mt-1">
        <Icon className="w-5 h-5 text-blue-600 transition-colors" />
      </div>
      <div>
        <h4 className="text-lg font-bold mb-1" style={{ color: TEXT_BLACK }}>{title}</h4>
        <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  </motion.div>
);

// Step Item Component
const StepItem = ({ step, index, totalSteps }) => {
  const isLeft = index % 2 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`relative flex items-center mb-12 last:mb-0 ${
        isLeft ? "md:flex-row-reverse" : "md:flex-row"
      } flex-row`}
    >
      {/* Content Box */}
      <div
        className={`w-full md:w-1/2 pl-12 md:pl-0 ${isLeft ? "md:pr-12" : "md:pl-12"}`}
      >
        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-300 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: BLUE_GRADIENT }}
            >
              {index + 1}
            </div>
            <h4 className="text-lg font-bold" style={{ color: TEXT_BLACK }}>{step.title}</h4>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            {step.description}
          </p>
        </div>
      </div>

      {/* Center Dot */}
      <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-8 h-8 rounded-full bg-white border-4 border-blue-500 z-10 flex items-center justify-center shadow-md">
        {/* Icon can go here if needed */}
      </div>
    </motion.div>
  );
};

// Data Arrays
const termsData = [
  {
    title: "Streaming",
    description: "Real-time delivery of content without permanent download.",
    icon: Activity,
  },
  {
    title: "DSP",
    description: "Digital Service Provider like Spotify or YouTube.",
    icon: Server,
  },
  {
    title: "CDN",
    description: "Content Delivery Network ensures fast global loading.",
    icon: Globe,
  },
  {
    title: "Bitrate",
    description: "Quality level of audio/video data delivery.",
    icon: Layers,
  },
  {
    title: "Metadata",
    description: "Info attached to content (Artist, Title, ISRC).",
    icon: Database,
  },
  {
    title: "ISRC Code",
    description: "Unique digital fingerprint for every recording.",
    icon: Fingerprint,
  },
  {
    title: "Royalty",
    description: "Revenue generated from licensed streams.",
    icon: DollarSign,
  },
  {
    title: "Distribution",
    description: "Process of delivering content to Platforms.",
    icon: Send,
  },
  {
    title: "Latency",
    description: "Delay between play press and content start.",
    icon: Zap,
  },
];

const stepsData = [
  {
    title: "Content Upload & Encoding",
    description:
      "Raw files are processed into compressed digital formats (AAC, MP3, H.264) optimized for internet delivery.",
  },
  {
    title: "Storage & CDN",
    description:
      "Content is stored on cloud servers and replicated across global edge servers for fast access.",
  },
  {
    title: "Streaming Protocols",
    description:
      "Data is transmitted via standardized rules like HLS or MPEG-DASH to ensure compatibility.",
  },
  {
    title: "Adaptive Bitrate (ABR)",
    description:
      "Quality automatically adjusts to match the listener's internet speed for zero buffering.",
  },
  {
    title: "Device Playback",
    description:
      "The media player decodes the stream in real-time for speakers or screens in milliseconds.",
  },
  {
    title: "Digital Rights (DRM)",
    description:
      "Encrypted licenses protect content from unauthorized copying or redistribution.",
  },
  {
    title: "Royalty Tracking",
    description:
      "Every stream generates a micro-payment which is tracked and reported back to the creator.",
  },
];

export default KnowledgePage;