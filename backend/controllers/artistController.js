const { supabase, supabaseAdmin, bucket } = require("../config/supabaseClient");

// --- Helper: Upload Image to Supabase Storage ---
const uploadImageToSupabase = async (file) => {
  if (!file) return null;

  const fileName = `${Date.now()}_${file.originalname}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError)
    throw new Error(`Image upload failed: ${uploadError.message}`);

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
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

// --- 2. CREATE ARTIST (Registration) ---
exports.createArtist = async (req, res) => {
  try {
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
      born_date,
      early_life,
      career,
      recognition_awards,
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Name aur email zaroori hain." });
    }

    const finalPassword =
      password && password.trim() !== "" ? password : "DefaultPass123!";

    // STEP 1: Supabase Auth create user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { role: "artist", name },
      });

    if (authError) {
      console.error("Auth Error:", authError);
      if (authError.message.includes("already been registered")) {
        return res
          .status(400)
          .json({ error: "Yeh email pehle se registered hai." });
      }
      return res.status(400).json({ error: authError.message });
    }

    const authUserId = authData.user.id;

    // STEP 2: Image upload
    let imagePath = "https://picsum.photos/seed/default/300/300";
    if (req.file) {
      imagePath = await uploadImageToSupabase(req.file);
    }

    // STEP 3: Artists inset in table
    const { data: artist, error: dbError } = await supabase
      .from("artists")
      .insert([
        {
          id: authUserId,
          name,
          genre,
          image: imagePath,
          bio,
          email,
          phone,
          followers: followers || "0M",
          profile_url: profileUrl,
          spotify_url: spotifyUrl,
          instagram_url: instagramUrl,
          id_document_url: idDocumentUrl,
          status: status || "Pending",
          verified: verified === "true" || verified === true || false,
          born_date: born_date || null,
          early_life: early_life || null,
          career: career || null,
          recognition_awards: recognition_awards || null,
          password: finalPassword,
          role: "artist",
        },
      ])
      .select();

    if (dbError) {
      console.error("DB Error:", dbError);
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return res.status(500).json({ error: dbError.message });
    }

    res.status(201).json({ success: true, artist });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// --- 3. UPDATE ARTIST ---
exports.updateArtist = async (req, res) => {
  try {
    const { id } = req.params;

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
      born_date,
      early_life,
      career,
      recognition_awards,
    } = req.body;

    // Auth update
    const authUpdateData = {};
    if (email) authUpdateData.email = email;
    if (password && password.trim() !== "") {
      authUpdateData.password = password;
    }

    if (Object.keys(authUpdateData).length > 0) {
      
      
      try {
        const { data: existingUser, error: fetchError } =
          await supabaseAdmin.auth.admin.getUserById(id);

        if (fetchError || !existingUser?.user) {
         
          
          if (email) {
            const finalPassword =
              password && password.trim() !== "" ? password : "DefaultPass123!";

            const { error: createError } =
              await supabaseAdmin.auth.admin.createUser({
                email,
                password: finalPassword,
                email_confirm: true,
                user_metadata: { role: "artist", name },
              });

            if (createError) {
              console.log("Auth create skipped:", createError.message);
            } else {
              console.log("Auth user created for existing artist ✅");
            }
          }
        } else {
          
          
          const { error: authError } =
            await supabaseAdmin.auth.admin.updateUserById(id, authUpdateData);
          if (authError) {
            console.log("Auth update skipped:", authError.message);
          }
        }
      } catch (authErr) {
        console.log("Auth operation skipped:", authErr.message);
      }
    }

    // Image upload
    let imagePath;
    if (req.file) {
      imagePath = await uploadImageToSupabase(req.file);
    }

   
    
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
      born_date: born_date || null,
      early_life: early_life || null,
      career: career || null,
      recognition_awards: recognition_awards || null,
    };

    if (password && password.trim() !== "") {
      updateData.password = password;
    }
    if (imagePath) updateData.image = imagePath;

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
      return res.status(404).json({ error: "Artist nahi mila." });
    }

    res.status(200).json({ success: true, artist: data[0] });
  } catch (err) {
    console.error("PUT Error:", err);
    res.status(500).json({ error: err.message });
  }
};



exports.deleteArtist = async (req, res) => {
  try {
    const { id } = req.params;

    const { error: dbError } = await supabase
      .from("artists")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;

    try {
      await supabaseAdmin.auth.admin.deleteUser(id);
    } catch (authErr) {
      console.log("Auth delete skipped:", authErr.message);
    }

    res.status(200).json({ message: "Artist successfully delete ho gaya!" });
  } catch (err) {
    console.error("DELETE Error:", err);
    res.status(500).json({ error: err.message });
  }
};
