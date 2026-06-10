const { supabase, supabaseAdmin, bucket } = require("../config/supabaseClient");

// --- Helper: Upload Image to Supabase Storage ---
const uploadImageToSupabase = async (file) => {
  if (!file) return null;

  const fileName = `${Date.now()}_${file.originalname}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
};

// --- 1. GET ALL ARTISTS ---
exports.getAllArtists = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("artists")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    console.error("GET Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// --- 2. ADD NEW ARTIST (Registration) ---
exports.createArtist = async (req, res) => {
  try {
    const file = req.file;
    
    // 1. Handle Image Upload
    let imagePath = "https://picsum.photos/seed/default/300/300";
    if (file) {
      imagePath = await uploadImageToSupabase(file);
    }

    // 2. Extract Data
    const {
      name,
      genre,
      bio,
      email,
      password,
      phone,
      followers,
      profileUrl,
      spotifyUrl,
      instagramUrl,
      idDocumentUrl,
      status,
      verified,
    } = req.body;

    // 3. Create User in Supabase Auth
    const finalPassword = password || "defaultPassword123!"; // Default if public form

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { role: "artist" },
      });

    if (authError) {
      console.error("Auth Error:", authError);
      return res.status(400).json({ error: authError.message });
    }

    const authUserId = authData.user.id;

    // 4. Insert into Database
    const { data: artist, error: dbError } = await supabase
      .from("artists")
      .insert([
        {
          id: authUserId, // Link to Auth User
          name,
          genre,
          image: imagePath,
          bio,
          email,
          phone,
          followers: followers || '0M',
          profile_url: profileUrl,
          spotify_url: spotifyUrl,
          instagram_url: instagramUrl,
          id_document_url: idDocumentUrl,
          status: status || 'Pending',
          verified: verified === "true" || false,
        },
      ])
      .select();

    if (dbError) {
      console.error("DB Error:", dbError);
      return res.status(500).json({ error: dbError.message });
    }

    res.json({ success: true, artist });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// --- 3. UPDATE ARTIST ---
exports.updateArtist = async (req, res) => {
  try {
    const { id } = req.params;
    
    // --- SECURITY CHECK: Kya logged-in user wahi hai jo update kar raha hai? ---
    if (req.user.id !== id) {
      return res.status(403).json({ error: "Access Denied: You can only update your own profile." });
    }

    const file = req.file;

    // 1. Handle Image Upload if new file provided
    let imagePath;
    if (file) {
      imagePath = await uploadImageToSupabase(file);
    }

    // 2. Extract Fields
    const {
      name,
      genre,
      bio,
      email,
      password,
      phone,
      followers,
      profileUrl,
      spotifyUrl,
      instagramUrl,
      idDocumentUrl,
      status,
      verified,
    } = req.body;

    // 3. Update Auth User (Email/Password)
    const authUpdateData = {};
    if (email) authUpdateData.email = email;
    if (password && password.trim() !== "") {
      authUpdateData.password = password;
    }

    if (Object.keys(authUpdateData).length > 0) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.updateUserById(id, authUpdateData);
      if (authError) {
        console.error("Auth Update Error:", authError);
        return res.status(400).json({ error: authError.message });
      }
    }

    // 4. Update Database Record
    const updateData = {
      name,
      genre,
      bio,
      email,
      phone,
      followers,
      profile_url: profileUrl,
      spotify_url: spotifyUrl,
      instagram_url: instagramUrl,
      id_document_url: idDocumentUrl,
      status,
      verified: verified === "true" || verified === true,
    };

    if (imagePath) {
      updateData.image = imagePath;
    }

    const { data, error } = await supabase
      .from("artists")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("DB Update Error:", error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Artist not found" });
    }

    res.status(200).json({ success: true, artist: data[0] });
  } catch (err) {
    console.error("PUT Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// --- 4. DELETE ARTIST ---
exports.deleteArtist = async (req, res) => {
  try {
    const { id } = req.params;

    // --- SECURITY CHECK: Kya logged-in user wahi hai jo delete kar raha hai? ---
    if (req.user.id !== id) {
      return res.status(403).json({ error: "Access Denied: You can only delete your own profile." });
    }
    
    // Optional: Supabase Auth se user delete karna
    // await supabaseAdmin.auth.admin.deleteUser(id);

    const { error } = await supabase.from("artists").delete().eq("id", id);

    if (error) throw error;
    res.status(200).json({ message: "Artist deleted successfully" });
  } catch (err) {
    console.error("DELETE Error:", err);
    res.status(500).json({ error: err.message });
  }
};