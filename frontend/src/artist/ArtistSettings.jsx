import React from "react";
import { Lock, Key, Bell, ShieldAlert, UserCircle } from "lucide-react";

const ArtistSettings = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500 text-sm">Manage your preferences and security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <UserCircle size={24} />
            <h3 className="font-bold text-lg">Profile Settings</h3>
          </div>
          <p className="text-slate-500 text-sm mb-4">Update your artist name, genre, and bio details.</p>
          <button className="w-full py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium text-sm">
            Edit Profile
          </button>
        </div>

        {/* Security Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <ShieldAlert size={24} />
            <h3 className="font-bold text-lg">Security</h3>
          </div>
          <p className="text-slate-500 text-sm mb-4">Change your password and manage 2FA.</p>
          <button className="w-full py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium text-sm">
            Change Password
          </button>
        </div>

        {/* Notifications Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <Bell size={24} />
            <h3 className="font-bold text-lg">Notifications</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">Email Alerts</span>
              <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">SMS Alerts</span>
              <div className="w-10 h-5 bg-slate-200 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* API Access */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <Key size={24} />
            <h3 className="font-bold text-lg">API Access</h3>
          </div>
          <p className="text-slate-500 text-sm mb-4">Manage tokens for third-party integrations.</p>
          <button className="w-full py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium text-sm">
            Manage Keys
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistSettings;