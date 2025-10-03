"use client";

import { useState } from "react";

export default function AddFriendModal({ isOpen, onClose, onAddFriend }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingFriend, setAddingFriend] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (searchQuery.trim() === "") return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/users/search?q=${searchQuery}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data.results);
        console.log("Hasil pencarian:", data.data.results);
      } else {
        console.log("Error search:", data.message);
        alert("Error: " + data.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.log("Error search:", error);
      alert("Gagal mencari user. Coba lagi.");
      setSearchResults([]);
    }

    setIsSearching(false);
  };

  const handleAddFriend = async (user) => {
    console.log("User yang mau di-add:", user);
    setAddingFriend(user.userId);

    try {
      const token = localStorage.getItem("token");
      const requestData = {
        identifier: user.username,
      };

      console.log("Data yang akan dikirim:", requestData);

      const response = await fetch("/api/friends/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        alert(`Friend request berhasil dikirim ke ${user.displayName}!`);
        // Hapus user dari hasil pencarian
        setSearchResults((prevResults) =>
          prevResults.filter((result) => result.userId !== user.userId)
        );
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.log("Error add friend:", error);
      alert("Gagal mengirim friend request. Coba lagi.");
    }

    setAddingFriend(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/5 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-lg p-6 w-96 max-w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Tambah Teman</h3>
          <button
            onClick={handleClose}
            className="text-gray-700 hover:text-gray-900 text-xl font-bold w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Cari username atau nama..."
            className="w-full px-4 py-3 bg-white/30 backdrop-blur-sm border border-white/50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 text-gray-800 placeholder-gray-600"
            disabled={isSearching}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || searchQuery.trim() === ""}
            className="mt-3 w-full bg-gradient-to-r from-blue-400 to-purple-400 text-white py-3 rounded-full hover:from-blue-500 hover:to-purple-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? "Mencari..." : "Cari User"}
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="text-gray-700 mt-2">Mencari user...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-3 hover:bg-white/10 rounded-lg border border-white/20 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">
                        {user.displayName}
                      </h4>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFriend(user)}
                    disabled={addingFriend === user.userId}
                    className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingFriend === user.userId ? "Adding..." : "Add"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 text-center py-8">
              {searchQuery && !isSearching
                ? "User tidak ditemukan"
                : "Ketik username untuk mencari teman"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
