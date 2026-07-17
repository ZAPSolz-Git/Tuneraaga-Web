import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { PlayerProvider } from "./components/PlayerContext";
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
import Radio from "./pages/Radio";
import TopArtist from "./pages/TopArtist";
import History from "./pages/History";
import LikedSongs from "./pages/LikedSongs";
import MyAlbums from "./pages/MyAlbums";
import MyArtists from "./pages/MyArtists";
import MyPodcasts from "./pages/MyPodcasts";
import NewPlaylist from "./pages/NewPlaylist";
import Footer from "./components/Footer";

// Getway Payment Integration pages
import ProPlans from "./pages/ProPlans";
import PackageSummary from "./pages/PackageSummary";

import ProLogin from "./pages/ProLogin";
import PaymentReceipt from "./pages/PaymentReceipt";

// Forgot Password reset page
import ResetPassword from "./pages/ResetPassword";

// Aniinspect
// import useAntiInspect from "./hooks/useAntiInspect";

import AlbumDetail from "./pages/AlbumDetail";
import ArtistProfile from "./pages/ArtistProfile";
import AdminDash from "./admin/AdminDash.jsx";
import ArtistManager from "./admin/ArtistManager";
import TopPlaylistAdmin from "./admin/TopPlaylistAdmin";
import TopChartAdmin from "./admin/TopChartAdmin";
import TrendingSongsAdmin from "./admin/TrendingSongsAdmin";
import LatestReleasesAdmin from "./admin/LatestReleasesAdmin";
import Top10IndiaAdmin from "./admin/Top10IndiaAdmin";
import AdminNewRelease from "./admin/AdminNewRelease";
import SongEditAdmin from "./admin/SongEditAdmin";
import PodcastAdmin from "./admin/PodcastAdmin";
import RadioAdmin from "./admin/RadioAdmin";
import ProtectedRoute from "./components/ProtectedRoute";
import ArtistDashboard from "./artist/ArtistDashboard";
import ArtistSettings from "./artist/ArtistSettings";
import ArtistLayout from "./artist/ArtistLayout1";
import AdminLayout from "./admin/AdminLayout1";
import LoginPage from "./pages/LoginPage";

// ✅ Center Toast
import CenterToast from "./components/CenterToast";

// Authfetchuser
import { AuthProvider } from "./components/AuthContext";

function App() {
  // useAntiInspect();
  return (
    <Router>
      <AuthProvider>
        <PlayerProvider>
          <Routes>
            {/* ═══ PUBLIC ROUTES (inside Layout — with sidebar) ═══ */}
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
              <Route path="radio" element={<Radio />} />
              <Route path="history" element={<History />} />
              <Route path="liked" element={<LikedSongs />} />
              <Route path="my-albums" element={<MyAlbums />} />
              <Route path="my-artists" element={<MyArtists />} />
              <Route path="my-podcasts" element={<MyPodcasts />} />
              <Route path="playlist/new" element={<NewPlaylist />} />
              <Route
                path="playlist/:playlistId/edit"
                element={<NewPlaylist />}
              />

              <Route path="pro" element={<ProPlans />} />
              <Route path="/pro/plan/:id" element={<PackageSummary />} />

              <Route path="/pro/login" element={<ProLogin />} />
              <Route path="/pro/receipt" element={<PaymentReceipt />} />

              <Route
                path="new-playlist"
                element={<Navigate to="/playlist/new" replace />}
              />
            </Route>

            {/* ═══ FULL-SCREEN PAGES (no sidebar) ═══ */}

            <Route path="/album/:albumName" element={<AlbumDetail />} />
            <Route path="/artist/:artistName" element={<ArtistProfile />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Forgot Password reset page (full-screen, no sidebar) */}
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ═══ ARTIST ROUTES (PROTECTED) ═══ */}
            <Route
              path="/artist"
              element={
                <ProtectedRoute requiredRole="artist">
                  <ArtistLayout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={<Navigate to="/artist/dashboard" replace />}
              />
              <Route path="dashboard" element={<ArtistDashboard />} />
              <Route path="settings" element={<ArtistSettings />} />
            </Route>

            {/* ═══ ADMIN ROUTES (PROTECTED) ═══ */}
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
              <Route path="new-release" element={<AdminNewRelease />} />
              <Route path="song-edit" element={<SongEditAdmin />} />
              <Route path="podcasts" element={<PodcastAdmin />} />
              <Route path="radio" element={<RadioAdmin />} />
            </Route>

            {/* ═══ 404 ═══ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PlayerProvider>
      </AuthProvider>

      {/* ✅ CENTER TOAST — outside everything, always on top */}
      <CenterToast />
    </Router>
  );
}

export default App;
