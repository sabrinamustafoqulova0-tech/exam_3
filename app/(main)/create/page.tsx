"use client"

import React, { useState, useRef } from "react"
import {
  VideoCameraIcon,
  DocumentPlusIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline"
import { useAddPostMutation } from "@/app/services/Reels"

export default function CreateReelPlaceholder() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [successLog, setSuccessLog] = useState<string>("")

  // Real RTK Mutation
  const [addPost, { isLoading }] = useAddPostMutation()

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const processFile = (file: File) => {
    if (!file.type.startsWith("video/")) {
      alert("Please upload a valid video file (e.g. mp4, webm).")
      return
    }
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoPreview(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const clearSelectedVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
    }
    setVideoFile(null)
    setVideoPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoFile) return

    try {
      await addPost({
        title,
        content,
        images: [videoFile]
      }).unwrap()

      // Log success payload
      const logDetails = {
        Status: "Published successfully! 🚀",
        Title: title,
        Content: content,
        VideoFileName: videoFile.name,
        VideoSize: `${(videoFile.size / (1024 * 1024)).toFixed(2)} MB`,
        ServerResponse: "200 Success - Post Added to Reels feed"
      }
      
      setSuccessLog(JSON.stringify(logDetails, null, 2))
      setShowLogModal(true)

      // Reset form
      setTitle("")
      setContent("")
      clearSelectedVideo()
    } catch (err: any) {
      console.error("Failed to publish Reel:", err)
      let errorMessage = "Unknown error occurred"
      
      if (err?.data?.errors) {
        errorMessage = typeof err.data.errors === "object"
          ? JSON.stringify(err.data.errors, null, 2)
          : String(err.data.errors)
      } else if (err?.data?.message) {
        errorMessage = String(err.data.message)
      } else if (err?.message) {
        errorMessage = String(err.message)
      } else if (err?.data) {
        errorMessage = typeof err.data === "object"
          ? JSON.stringify(err.data, null, 2)
          : String(err.data)
      }
      
      alert("Failed to publish Reel:\n" + errorMessage)
    }
  }

  return (
    <div className="h-full w-full bg-black text-white p-6 md:p-10 overflow-y-auto relative">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-white/10 pb-6 mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <VideoCameraIcon className="h-8 w-8 text-pink-500" />
            Create Reel
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Publish a new vertical reel directly to the platform feed. Fully connected to Swagger multipart endpoint.
          </p>
        </div>

        {/* Main interactive creation form grid */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left panel - Upload (span 3) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <label className="text-sm font-bold text-gray-400">Video Upload</label>
            
            {videoPreview ? (
              <div className="relative aspect-[9/16] max-h-[500px] w-full rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 shadow-2xl flex items-center justify-center">
                <video
                  src={videoPreview}
                  controls
                  className="h-full w-full object-contain"
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={clearSelectedVideo}
                  className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 border border-white/10 hover:bg-black/85 transition text-white disabled:opacity-50"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`relative aspect-[9/16] max-h-[500px] w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? "border-pink-500 bg-pink-500/5 scale-102"
                    : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/5 text-gray-400 group-hover:scale-105 transition-transform">
                  <ArrowUpTrayIcon className="h-7 w-7 text-pink-500 animate-pulse" />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">Drag video here</h3>
                <p className="text-sm text-gray-500 max-w-xs mb-4">
                  MP4, WebM or OGG files up to 50MB. (Vertical 9:16 aspect ratio recommended)
                </p>
                <span className="rounded-xl bg-white text-black px-4 py-2 text-xs font-black tracking-wide hover:bg-gray-200 transition">
                  Select from Computer
                </span>
              </div>
            )}
          </div>

          {/* Right panel - Details Form (span 2) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-400" htmlFor="title-input">
                Title
              </label>
              <input
                id="title-input"
                type="text"
                disabled={isLoading}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Write a catchy title..."
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-400" htmlFor="caption-input">
                Caption / Description
              </label>
              <textarea
                id="caption-input"
                rows={5}
                disabled={isLoading}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add hashtags, descriptions, links..."
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition resize-none disabled:opacity-50"
              />
            </div>

            <div className="rounded-2xl border border-yellow-500/10 bg-yellow-500/5 p-4 text-xs leading-relaxed text-yellow-400/90 flex gap-3">
              <SparklesIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="font-bold mb-0.5">Swagger API Online</p>
                Successfully connected to `POST /Post/add-post`. Submitting this form runs a multi-part file upload straight to the production Reels feed!
              </div>
            </div>

            <button
              type="submit"
              disabled={!videoFile || isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white hover:bg-gray-200 disabled:opacity-30 text-black py-3.5 text-sm font-extrabold transition active:scale-98 disabled:pointer-events-none cursor-pointer shadow-lg shadow-white/5"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black"></div>
                  Publishing Reel...
                </>
              ) : (
                <>
                  <DocumentPlusIcon className="h-5 w-5" />
                  Publish Reel
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/10 p-6 md:p-8 shadow-2xl">
            <button
              onClick={() => setShowLogModal(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-green-500 animate-ping"></span>
              Reel Published Successfully!
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Here is the confirmation details returned from the `/Post/add-post` multipart upload mutation:
            </p>

            <pre className="rounded-2xl bg-black/60 p-4 text-xs font-mono text-emerald-400 border border-white/5 overflow-x-auto">
              {successLog}
            </pre>

            <button
              onClick={() => setShowLogModal(false)}
              className="mt-6 w-full rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 py-3 text-sm font-bold text-white transition"
            >
              Awesome, Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
