import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Rocket,
  ShieldCheck,
  Layers,
  Music2,
  Globe,
  Headphones,
  Heart,
} from "lucide-react";

// ─── Blue Gradient Palette ───
const BLUE_LIGHT = "#3b82f6";
const BLUE_DARK = "#1d4ed8";
const TEXT_BLACK = "#0f172a";

const AboutPage = () => {
  return (
    <div className="text-slate-900 font-sans bg-white">
      {/* Hero Section - Clean Image */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1920&h=1080&fit=crop"
          alt="Music Studio"
          className="w-full h-full object-cover" // Removed opacity class
        />
        {/* REMOVED: White gradient overlay. Added subtle dark gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          {/* Glassmorphism Container for Text Readability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 backdrop-blur-md px-8 py-6 rounded-2xl shadow-xl border border-white/20"
          >
            <span className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-2 font-semibold block">
              Movement Creations LLP
            </span>
            <h1
              className="text-5xl md:text-7xl font-extrabold tracking-tight"
              style={{ color: TEXT_BLACK }}
            >
              About <span style={{ color: BLUE_DARK }}>Us</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600 italic">
              "We don't just distribute music. We distribute dreams, voices, and movements."
            </p>
          </motion.div>
        </div>
      </div>

      {/* Introduction Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-sm uppercase tracking-widest mb-4 font-bold" style={{ color: BLUE_DARK }}>
              Who We Are
            </h2>
            <h3 className="text-4xl font-bold mb-6 leading-tight" style={{ color: TEXT_BLACK }}>
              A Launchpad for <br /> Modern Creators
            </h3>
            <p className="text-slate-600 leading-relaxed mb-6 text-lg">
              We are <span className="font-bold" style={{ color: TEXT_BLACK }}>Movement Creations LLP</span> — a forward-thinking music distribution and digital content company built for artists, creators, and brands who believe their work deserves to be heard, seen, and felt by the world.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Born from a passion for music and a deep respect for the craft of creation, we exist at the intersection of artistry and technology. We are not just a distribution platform — we are a launchpad. We are the bridge between a raw recording and a global audience.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* REMOVED: Blur effect behind image */}
            <img
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop"
              alt="Artist Recording"
              className="relative rounded-lg shadow-xl border border-slate-200 w-full object-cover aspect-[4/3]"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg border border-slate-200 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-50">
                  <Music2 className="w-6 h-6" style={{ color: BLUE_DARK }} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tune Raaga</p>
                  <p className="font-semibold" style={{ color: TEXT_BLACK }}>Est. 2024</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* What We Stand For Section */}
      <div className="bg-slate-50 py-24 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-sm uppercase tracking-widest mb-4 font-bold" style={{ color: BLUE_DARK }}>
              Our Values
            </h2>
            <h3 className="text-4xl font-bold" style={{ color: TEXT_BLACK }}>What We Stand For</h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ValueCard
              icon={Users}
              title="Artist Empowerment"
              description="Empowerment of independent artists and creators through accessible, transparent distribution."
              delay={0.1}
            />
            <ValueCard
              icon={Rocket}
              title="Technology First"
              description="Technology-first thinking that keeps your content ahead of the curve."
              delay={0.2}
            />
            <ValueCard
              icon={ShieldCheck}
              title="Revenue Integrity"
              description="Ensuring every stream, every play, and every download counts and pays back to you."
              delay={0.3}
            />
            <ValueCard
              icon={Layers}
              title="White Label Solutions"
              description="Build your own distribution identity under our robust infrastructure."
              delay={0.4}
            />
            <ValueCard
              icon={Heart}
              title="Creator Community"
              description="A community of creators united by a single belief — great music deserves a global stage."
              delay={0.5}
            />
          </div>
        </div>
      </div>

      {/* Quote Section - Clean Background */}
      <div className="relative py-24 overflow-hidden">
        {/* Image opacity increased slightly, overlay REMOVED */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920')] bg-cover bg-center opacity-30" />
        {/* White background for text readability */}
        <div className="absolute inset-0 bg-white/90" /> 
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.blockquote
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-2xl md:text-4xl font-light italic leading-relaxed text-slate-700"
          >
            "We don't just distribute music. We distribute{" "}
            <span className="font-bold" style={{ color: BLUE_DARK }}>
              dreams
            </span>
            , voices, and movements — one stream at a time."
          </motion.blockquote>
        </div>
      </div>

      {/* Our Reach Section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop"
              alt="Global Network"
              className="rounded-lg shadow-xl border border-slate-200 w-full"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-sm uppercase tracking-widest mb-4 font-bold" style={{ color: BLUE_DARK }}>
              Global Reach
            </h2>
            <h3 className="text-4xl font-bold mb-6" style={{ color: TEXT_BLACK }}>Our Reach</h3>
            <p className="text-slate-600 leading-relaxed mb-8 text-lg">
              Through our platform, your content reaches listeners across 150+ countries, spanning every major digital streaming service in the world.
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <Globe className="w-8 h-8 mb-3" style={{ color: BLUE_DARK }} />
                <h4 className="text-3xl font-bold" style={{ color: TEXT_BLACK }}>150+</h4>
                <p className="text-slate-500 text-sm">Countries</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <Headphones className="w-8 h-8 mb-3" style={{ color: BLUE_DARK }} />
                <h4 className="text-3xl font-bold" style={{ color: TEXT_BLACK }}>Global</h4>
                <p className="text-slate-500 text-sm">DSPs Covered</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Whether you are an emerging independent artist in Mumbai or an established label in London — our infrastructure treats your music with the same priority, the same care, and the same global ambition.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for Value Cards
const ValueCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-8 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 group"
  >
    <div
      className="w-12 h-12 rounded-lg flex items-center justify-center mb-6 transition-colors duration-300 bg-blue-50"
    >
      <Icon className="w-6 h-6" style={{ color: BLUE_DARK }} />
    </div>
    <h4 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors" style={{ color: TEXT_BLACK }}>
      {title}
    </h4>
    <p className="text-slate-500 leading-relaxed text-sm">{description}</p>
  </motion.div>
);

export default AboutPage;