// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { supabase } from "@/lib/supabaseClient";
// import { Lock, Key, CheckCircle, ArrowLeft } from "lucide-react";

// const ResetPassword = () => {
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState(false);
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Check if we have a hash fragment from Supabase
//     const hashParams = new URLSearchParams(window.location.hash.substring(1));
//     const accessToken = hashParams.get("access_token");

//     if (!accessToken) {
//       setError("Invalid or expired reset link. Please request a new one.");
//     }
//   }, []);

//   const handleResetPassword = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setMessage("");
//     setError("");

//     // Validate passwords
//     if (newPassword.length < 6) {
//       setError("Password must be at least 6 characters long.");
//       setIsLoading(false);
//       return;
//     }

//     if (newPassword !== confirmPassword) {
//       setError("Passwords do not match.");
//       setIsLoading(false);
//       return;
//     }

//     try {
//       const { error } = await supabase.auth.updateUser({
//         password: newPassword,
//       });

//       if (error) throw error;

//       setSuccess(true);
//       setMessage("Password updated successfully!");

//       setTimeout(() => {
//         navigate("/login");
//       }, 3000);
//     } catch (err) {
//       setError(err.message || "Failed to update password. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center px-4">
//       <motion.div
//         initial={{ opacity: 0, scale: 0.9 }}
//         animate={{ opacity: 1, scale: 1 }}
//         transition={{ duration: 0.5, type: "spring" }}
//         className="w-full max-w-md bg-white/90 backdrop-blur-3xl border border-white/60 p-8 md:p-10 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)]"
//       >
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 shadow-2xl bg-gradient-to-br from-blue-500 to-blue-600">
//             <Key className="w-10 h-10 text-white" />
//           </div>
//           <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 mb-2">
//             Reset Password
//           </h2>
//           <p className="text-slate-500 text-sm">
//             Enter your new password below
//           </p>
//         </div>

//         {success && (
//           <motion.div
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-600 text-sm text-center"
//           >
//             <CheckCircle className="w-5 h-5 inline-block mr-2" />
//             {message}
//           </motion.div>
//         )}

//         {error && (
//           <motion.div
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm text-center"
//           >
//             {error}
//           </motion.div>
//         )}

//         {!success && (
//           <form onSubmit={handleResetPassword} className="space-y-5">
//             <div className="space-y-2">
//               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
//                 New Password
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                   <Lock className="h-5 w-5 text-blue-500" />
//                 </div>
//                 <input
//                   type="password"
//                   required
//                   value={newPassword}
//                   onChange={(e) => setNewPassword(e.target.value)}
//                   placeholder="Enter new password"
//                   className="block w-full pl-11 pr-3 py-4 border border-slate-200 rounded-xl leading-5 bg-white/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
//                 />
//               </div>
//               <p className="text-xs text-slate-400 ml-1">
//                 Minimum 6 characters
//               </p>
//             </div>

//             <div className="space-y-2">
//               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
//                 Confirm Password
//               </label>
//               <div className="relative">
//                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
//                   <Lock className="h-5 w-5 text-blue-500" />
//                 </div>
//                 <input
//                   type="password"
//                   required
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   placeholder="Confirm new password"
//                   className="block w-full pl-11 pr-3 py-4 border border-slate-200 rounded-xl leading-5 bg-white/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
//                 />
//               </div>
//             </div>

//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-70"
//             >
//               {isLoading ? (
//                 <>
//                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                   Updating...
//                 </>
//               ) : (
//                 "Update Password"
//               )}
//             </motion.button>
//           </form>
//         )}

//         <div className="mt-6 pt-4 border-t border-slate-100 text-center">
//           <button
//             onClick={() => navigate("/login")}
//             className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium flex items-center justify-center gap-1 w-full"
//           >
//             <ArrowLeft size={14} /> Back to Login
//           </button>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default ResetPassword;
