import React, { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { Trash2, Plus, Music, Loader2 } from "lucide-react";

// --- ENV CONFIGURATION ---
// .env file se variables load kar rahe hain
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Top10IndiaAdmin = () => {
  const [listItems, setListItems] = useState([]);
  const [allReleases, setAllReleases] = useState([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Note: Changed table to 'top10_india'
    const { data: listData } = await supabase
      .from('top10_india')
      .select(`*, releases (id, title, cover_url)`);
    
    const { data: releasesData } = await supabase
      .from('releases')
      .select('id, title');

    if (listData) setListItems(listData);
    if (releasesData) setAllReleases(releasesData);
    setLoading(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedReleaseId) return;

    const { error } = await supabase
      .from('top10_india')
      .insert([{ release_id: selectedReleaseId }]);

    if (error) {
      alert("Error adding: " + error.message);
    } else {
      setSelectedReleaseId("");
      fetchData();
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('top10_india')
      .delete()
      .eq('id', id);

    if (!error) fetchData();
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Manage Top 10 in India</h2>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" /> Add New Song
        </h3>
        <form onSubmit={handleAdd} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Select Song</label>
            <select
              value={selectedReleaseId}
              onChange={(e) => setSelectedReleaseId(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Choose a song --</option>
              {allReleases.map(rel => (
                <option key={rel.id} value={rel.id}>{rel.title}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium">
            Add to List
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                <th className="p-4">Cover</th>
                <th className="p-4">Song Title</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <img 
                      src={item.releases?.cover_url || "https://via.placeholder.com/50"} 
                      alt="cover" 
                      className="w-12 h-12 rounded object-cover border border-slate-200"
                    />
                  </td>
                  <td className="p-4 font-medium text-slate-900">
                    {item.releases?.title || "Unknown Title"}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {listItems.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-500">
                    No songs added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Top10IndiaAdmin;