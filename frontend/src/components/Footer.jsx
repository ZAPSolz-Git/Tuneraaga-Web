import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Music,
  Star,
  TrendingUp,
  ListMusic,
  Podcast,
  Mic2,
} from "lucide-react";

const browseItems = [
  { path: "/music", label: "Music", icon: Music },
  { path: "/new-release", label: "New Release", icon: Star },
  { path: "/top-chart", label: "Top Chart", icon: TrendingUp },
  { path: "/top-playlist", label: "Top PlayList", icon: ListMusic },
  { path: "/podcast", label: "Podcast", icon: Podcast },
  { path: "/radio", label: "Radio", icon: Mic2 },
  { path: "/topartist", label: "Top Artist", icon: Mic2 },
];

const bottomBarLinks = [
  { label: "TuneRaaga Pro", path: "/pro" },
  { label: "TuneRaaga for iOS", path: "/ios" },
  { label: "TuneRaaga for Android", path: "/android" },
  { label: "New Releases", path: "/new-release" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const handleFooterLinkClick = (sectionTitle, linkName) => {
    switch (sectionTitle) {
      case "TOP ARTISTS":
        navigate(`/artist/${encodeURIComponent(linkName)}`);
        break;
      case "TOP ACTORS":
        navigate(`/new-release?actor=${encodeURIComponent(linkName)}`);
        break;
      case "LANGUAGE":
        navigate(`/new-release?language=${encodeURIComponent(linkName)}`);
        break;
      case "ARTIST ORIGINALS": {
        const dashIdx = linkName.indexOf(" - ");
        const artistName =
          dashIdx > -1
            ? linkName.substring(0, dashIdx).trim()
            : linkName.trim();
        navigate(`/artist/${encodeURIComponent(artistName)}`);
        break;
      }
      case "PLAYLISTS":
        navigate(`/top-playlist?playlist=${encodeURIComponent(linkName)}`);
        break;
      case "COMPANY":
        if (linkName === "About Us" || linkName === "Our DNA") {
          navigate("/about");
        } else if (linkName === "Knowledge") {
          navigate("/knowledge");
        } else if (linkName === "Reached") {
          navigate("/reached");
        } else if (linkName === "Audience") {
          navigate("/audience");
        } else if (linkName === "What we offer") {
          navigate("/what");
        }
        break;
      default:
        navigate("#");
    }
  };

  const footerSections = [
    {
      title: "BROWSE",
      isBrowse: true,
    },
    {
      title: "TOP ARTISTS",
      links: [
        "Lata Mangeshkar",
        "Arijit Singh",
        "Reena Roy",
        "Raftaar",
        "Diljit Dosanjh",
        "Jassie Gill",
      ],
    },
    {
      title: "TOP ACTORS",
      links: [
        "Jitendra",
        "Amitabh Bachchan",
        "Akshay Kumar",
        "Shah Rukh Khan",
        "Ranbir Kapoor",
        "Tiger Shroff",
      ],
    },
    {
      title: "PLAYLISTS",
      links: [
        "Top Party Songs",
        "Jawan",
        "Pathan",
        "MARATHI Dhurandhar",
        "Cupiditate ut magna",
        "Id id occaecat nihil",
      ],
    },
    {
      title: "LANGUAGE",
      links: ["Hindi", "Punjabi", "English", "Tamil", "Telugu", "Bhojpuri"],
    },
    {
      title: "ARTIST ORIGINALS",
      links: ["Lata Mangeshkar - Shisha ho ya dil ho", "Arijit Singh - O Mahi"],
    },
    {
      title: "COMPANY",
      links: [
        "About Us",
        "Our DNA",
        "Knowledge",
        "Reached",
        "Audience",
        "What we offer",
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-blue-100 text-slate-500 pt-10 pb-6 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-x-6 gap-y-10">
        {footerSections.map((section, idx) => (
          <div key={idx} className="min-w-0">
            <h3
              className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4 pb-2 inline-block border-b-2"
              style={{ color: "#1e3a5f", borderColor: "#bfdbfe" }}
            >
              {section.title}
            </h3>

            {section.isBrowse ? (
              <ul className="space-y-2.5">
                {browseItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path} className="truncate">
                      <button
                        onClick={() => navigate(item.path)}
                        className="text-[11px] hover:text-blue-600 transition-colors duration-200 flex items-center gap-2 leading-relaxed cursor-pointer bg-transparent border-none p-0 text-left w-full text-slate-500"
                      >
                        <Icon
                          size={12}
                          className="flex-shrink-0 text-slate-400"
                        />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="space-y-2.5">
                {section.links.map((linkName, i) => {
                  return (
                    <li key={i} className="truncate">
                      <button
                        onClick={() =>
                          handleFooterLinkClick(section.title, linkName)
                        }
                        className="text-[11px] hover:text-blue-600 transition-colors duration-200 block leading-relaxed cursor-pointer bg-transparent border-none p-0 text-left w-full"
                      >
                        {linkName}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* ── BOTTOM BAR (TuneRaaga Links) ── */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-blue-50">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-5">
          {bottomBarLinks.map((link, i) => (
            <React.Fragment key={link.label}>
              <button
                onClick={() => navigate(link.path)}
                className="text-[11px] text-slate-500 hover:text-blue-600 transition-colors duration-200 bg-transparent border-none p-0 cursor-pointer"
              >
                {link.label}
              </button>
              {i < bottomBarLinks.length - 1 && (
                <span className="text-slate-300 text-[10px] select-none">
                  |
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-center text-[10px] text-slate-400">
          © {currentYear} TuneRaaga. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
