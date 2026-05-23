"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAddPostMutation } from "../../services/postApi";

// Material UI Icons
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import ImageIcon from "@mui/icons-material/Image";

export default function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addPost, { isLoading }] = useAddPostMutation();

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  // Handle Drag Leave
  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Handle Drop File
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
      } else {
        alert("Please drop a valid image file.");
      }
    }
  };

  // Handle File Input Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Clear Selected Image
  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please upload an image first.");
      return;
    }
    if (!title.trim()) {
      alert("Please enter a title for your post.");
      return;
    }

    try {
      await addPost({
        Title: title.trim(),
        Content: content.trim(),
        Images: [selectedFile],
      }).unwrap();

      // Successfully posted!
      router.push("/expore"); // Redirect to Explore
    } catch (err: any) {
      console.error("Failed to create post:", err);
      alert("Failed to publish post. Please check your credentials or try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex flex-col md:flex-row h-auto md:h-[70vh] max-h-[680px]">
        
        {/* Left Panel: Image Dropzone or Preview */}
        <div 
          className={`w-full md:w-3/5 bg-gray-50/50 flex flex-col items-center justify-center relative p-6 border-b md:border-b-0 md:border-r border-gray-100 transition-all duration-300 ${
            isDragOver ? "bg-pink-50/40 border-2 border-dashed border-pink-400" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {imagePreview ? (
            <div className="relative w-full h-full flex items-center justify-center group/preview">
              <img
                src={imagePreview}
                alt="Selected preview"
                className="w-full h-full max-h-[350px] md:max-h-full object-contain rounded-2xl"
              />
              <button
                onClick={handleClearImage}
                type="button"
                className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors duration-200 shadow-md"
                title="Remove image"
              >
                <CloseIcon />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center text-center cursor-pointer hover:scale-[1.01] transition-transform duration-300 select-none p-8"
            >
              <div className="w-20 h-20 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <CloudUploadIcon className="text-4xl" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Drag photos here</h3>
              <p className="text-sm text-gray-400 max-w-xs mb-6">
                Drag and drop your image directly or click below to browse files from your computer.
              </p>
              <button
                type="button"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm rounded-full shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                Select from computer
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Right Panel: Caption and Details */}
        <form 
          onSubmit={handleSubmit}
          className="w-full md:w-2/5 flex flex-col p-6 md:p-8 bg-white justify-between"
        >
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-red-500">
              Create New Post
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Publish gorgeous images to the explore feed and share them with the world.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-5 flex-1 mb-8">
            {/* Title Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Post Title
              </label>
              <input
                type="text"
                placeholder="Write a catchy title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all duration-300"
              />
            </div>

            {/* Content Input (Caption) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Caption
              </label>
              <textarea
                placeholder="Write a description or caption (hashtags are welcome!)..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                maxLength={400}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none resize-none focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100 transition-all duration-300"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !selectedFile || !title.trim()}
            className="w-full py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Publishing post...</span>
              </>
            ) : (
              <>
                <SendIcon className="text-sm transform rotate-[-30deg]" />
                <span>Share Post</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
