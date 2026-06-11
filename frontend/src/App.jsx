import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// --- PUBLIC COMPONENTS ---
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import About from "./pages/About";
import Knowledge from "./pages/Knowledge";
import Reached from "./pages/Reached";
import Audience from "./pages/Audience";
import WhatPage from "./pages/whatPage";
import NewRelease from "./pages/NewRelease";
import TopChart from "./pages/TopChart";
import TopPlayList from "./pages/TopPlayList";
import Podcast from "./pages/Podcast";
import TopArtist from "./pages/TopArtist";
import Footer from "./components/Footer";

// --- LOGIN PAGE ---
// import LoginPage from "./pages/LoginPage";

// --- ADMIN COMPONENTS ---
import AdminDash from "./admin/AdminDash.jsx";
import ArtistManager from "./admin/ArtistManager";
import SongManager from "./admin/SongManager";
// hello mc

// --- ADMIN PAGE IMPORTS ---
import TopPlaylistAdmin from "./admin/TopPlaylistAdmin";
import TopChartAdmin from "./admin/TopChartAdmin";
import TrendingSongsAdmin from "./admin/TrendingSongsAdmin";
import LatestReleasesAdmin from "./admin/LatestReleasesAdmin";
import Top10IndiaAdmin from "./admin/Top10IndiaAdmin";
import PodcastAdmin from "./admin/PodcastAdmin";

// --- PROTECTED ROUTE IMPORT ---
import ProtectedRoute from "./components/ProtectedRoute";

// --- ARTIST IMPORTS ---
import ArtistDashboard from "./artist/ArtistDashboard";
import ArtistSettings from "./artist/ArtistSettings";
import ArtistLayout from "./artist/ArtistLayout1";
import AdminLayout from "./admin/AdminLayout1";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="about" element={<About />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="reached" element={<Reached />} />
          <Route path="audience" element={<Audience />} />
          <Route path="what" element={<WhatPage />} />
          <Route path="footer" element={<Footer />} />
          <Route path="new-release" element={<NewRelease />} />
          <Route path="topartist" element={<TopArtist />} />
          <Route path="top-chart" element={<TopChart />} />
          <Route path="top-playlist" element={<TopPlayList />} />
          <Route path="new-releases" element={<NewRelease />} />
          <Route path="podcast" element={<Podcast />} />
        </Route>

        {/* --- LOGIN ROUTE --- */}
        <Route path="/login" element={<LoginPage />} />

        {/* --- ARTIST ROUTES (PROTECTED) --- */}
        <Route
          path="/artist"
          element={
            <ProtectedRoute requiredRole="artist">
              <ArtistLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/artist/dashboard" replace />} />
          <Route path="dashboard" element={<ArtistDashboard />} />
          <Route path="settings" element={<ArtistSettings />} />
        </Route>

        {/* --- ADMIN ROUTES (PROTECTED) --- */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDash />} />
          <Route path="artist" element={<ArtistManager />} />
          <Route path="trending-songs" element={<TrendingSongsAdmin />} />
          <Route path="latest-releases" element={<LatestReleasesAdmin />} />
          <Route path="top-10-india" element={<Top10IndiaAdmin />} />
          <Route path="top-charts" element={<TopChartAdmin />} />
          <Route path="top-playlists" element={<TopPlaylistAdmin />} />
          <Route path="songs" element={<SongManager />} />
          <Route path="podcasts" element={<PodcastAdmin />} />
        </Route>

        {/* --- 404 / FALLBACK --- */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
