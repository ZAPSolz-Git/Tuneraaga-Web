import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  BarChart2,
  ListMusic,
  Share2,
  Heart,
  Rocket,
  CalendarCheck,
  Radio,
} from "lucide-react";

// ─── Blue Gradient Palette (Same Theme) ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const TEXT_BLACK = "#0f172a";
const BLUE_GRADIENT = `linear-gradient(135deg, ${BLUE_LIGHT}, ${BLUE_DARK})`;

const AudiencePage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative">
      {/* Hero Section - CLEAR Background Image, No Blur Overlay */}
      <div className="relative w-full overflow-hidden py-24 border-b border-slate-200">
        {/* Background Image - Clean, No Opacity/Blur */}
        <img
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1920&h=800&fit=crop"
          alt="Audience Engagement"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient Overlay: Fades from White (bottom) to Dark (top) for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-black/20 to-black/60" />

        {/* Hero Content - Glass Card for Readability */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            // Glassmorphism card so text pops over the busy concert image
            className="bg-black/20 backdrop-blur-lg p-8 md:p-12 rounded-2xl border border-white/10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-6">
              <Users className="w-4 h-5 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">
                Audience Engagement
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
              How We Engage <span style={{ color: BLUE_LIGHT }}>Our Audience</span>
            </h1>

            <p className="max-w-3xl mx-auto text-lg text-gray-200 leading-relaxed">
              At TuneRaaga, we understand that distribution is only half the
              journey. Getting your music onto platforms is the beginning —
              getting people to listen, share, save, and come back for more is
              where the real work happens.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Engagement Strategies Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Item 1 */}
          <EngagementCard
            icon={Radio}
            title="Curated Artist Spotlights"
            description="We regularly feature artists from our platform across our social media channels, newsletters, and website — giving creators visibility beyond their own audiences."
            delay={0.1}
          />

          {/* Item 2 */}
          <EngagementCard
            icon={BarChart2}
            title="Data-Driven Insights"
            description="Every creator on our platform has access to real-time streaming analytics — including listener demographics, geographic reach, playlist placements, and stream count trends."
            delay={0.2}
          />

          {/* Item 3 */}
          <EngagementCard
            icon={ListMusic}
            title="Playlist Pitching & Placement"
            description="Getting placed on the right playlist can change an artist's trajectory overnight. We actively pitch eligible releases to editorial playlist curators on major DSPs."
            delay={0.3}
          />

          {/* Item 4 */}
          <EngagementCard
            icon={Share2}
            title="Social Media Integration"
            description="Our platform links directly with social media tools that allow your music to be embedded, shared, and discovered across Instagram, Facebook, Twitter, TikTok, and YouTube."
            delay={0.4}
          />

          {/* Item 5 */}
          <EngagementCard
            icon={Heart}
            title="Community Building"
            description="We are building a community — not just a client list. Through our creator forums, newsletters, and exclusive webinars, we connect artists with each other."
            delay={0.5}
          />

          {/* Item 6 */}
          <EngagementCard
            icon={Rocket}
            title="Pre-Release Campaigns"
            description="We help artists build anticipation before their music drops — through pre-save campaigns, teaser strategies, and coordinated release timing."
            delay={0.6}
          />

          {/* Item 7 - Full Width */}
          <div className="md:col-span-2">
            <EngagementCard
              icon={CalendarCheck}
              title="Content Calendar Guidance"
              description="Consistency is the currency of digital success. We provide our creators with guidance on release frequency, content cadence, and social media timing — so their audience always has something to look forward to."
              delay={0.7}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Reusable Card Component (Light Theme, No Shadow) ---
const EngagementCard = ({ icon: Icon, title, description, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay }}
      whileHover={{ y: -5 }}
      className="group bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-400 transition-all duration-300 overflow-hidden"
    >
      <div className="p-8 flex gap-6">
        {/* Icon Box */}
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-500 group-hover:border-transparent">
            <Icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
          <p className="text-slate-600 leading-relaxed text-sm md:text-base">
            {description}
          </p>
        </div>
      </div>

      {/* Bottom Accent Line (Blue Animation) */}
      <div className="h-1 w-0 group-hover:w-full bg-blue-500 transition-all duration-500"></div>
    </motion.div>
  );
};

export default AudiencePage;