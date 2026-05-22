"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import {
  ArrowLeftIcon,
  MapPinIcon,
  UserIcon,
  ChevronRightIcon,
  SparklesIcon,
  Cog6ToothIcon,
  FaceSmileIcon,
} from "@heroicons/react/24/outline"
import { useAddPostMutation } from "@/app/services/Reels"

// ─── SVG Aspect Ratio Icons ──────────────────────────────────────────────────
const OriginalIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M20.25 20.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
  </svg>
)

const SquareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <rect x={4} y={4} width={16} height={16} rx={2.5} />
  </svg>
)

const PortraitIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <rect x={5} y={3} width={14} height={18} rx={2.5} />
  </svg>
)

const LandscapeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <rect x={3} y={5} width={18} height={14} rx={2.5} />
  </svg>
)

// ─── CSS Instagram Filters ───────────────────────────────────────────────────
const FILTERS = [
  { name: "Original",  css: "none" },
  { name: "Clarendon", css: "contrast(1.2) saturate(1.35)" },
  { name: "Lark",      css: "brightness(1.1) contrast(0.9) saturate(1.4)" },
  { name: "Juno",      css: "saturate(1.4) contrast(1.1) sepia(0.1)" },
  { name: "Ludwig",    css: "saturate(0.75) brightness(1.05)" },
  { name: "Aden",      css: "sepia(0.2) brightness(1.15) saturate(1.4) hue-rotate(-10deg)" },
  { name: "Crema",     css: "sepia(0.4) brightness(1.1) saturate(0.9)" },
  { name: "Gingham",   css: "brightness(1.05) hue-rotate(-10deg) sepia(0.05)" },
  { name: "Moon",      css: "grayscale(1) brightness(1.1) contrast(1.1)" },
  { name: "Reyes",     css: "sepia(0.35) contrast(0.85) brightness(1.1) saturate(0.75)" },
]

// ─── Ratio Selector Mapping ──────────────────────────────────────────────────
const RATIOS = [
  { label: "Original", value: "original", Icon: OriginalIcon },
  { label: "1:1 Square", value: "1/1", Icon: SquareIcon },
  { label: "4:5 Portrait", value: "4/5", Icon: PortraitIcon },
  { label: "16:9 Landscape", value: "16/9", Icon: LandscapeIcon },
]

type Step = "upload" | "crop" | "filter" | "caption"

// ─── Process Image: Crop & Apply Filter via Canvas ───────────────────────────
const processProcessedImage = (
  imageFile: File,
  filterCss: string,
  ratioStr: string
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(imageFile)

    img.onload = () => {
      URL.revokeObjectURL(img.src)

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(imageFile)
        return
      }

      const W = img.naturalWidth
      const H = img.naturalHeight

      let targetWidth = W
      let targetHeight = H
      let sx = 0
      let sy = 0
      let sWidth = W
      let sHeight = H

      if (ratioStr !== "original") {
        let r = 1.0
        if (ratioStr === "1/1") r = 1.0
        else if (ratioStr === "4/5") r = 0.8
        else if (ratioStr === "16/9") r = 16 / 9

        const currentRatio = W / H

        if (currentRatio > r) {
          sHeight = H
          sWidth = H * r
          sx = (W - sWidth) / 2
          sy = 0
        } else {
          sWidth = W
          sHeight = W / r
          sx = 0
          sy = (H - sHeight) / 2
        }

        targetWidth = sWidth
        targetHeight = sHeight
      }

      canvas.width = targetWidth
      canvas.height = targetHeight

      if (filterCss !== "none") {
        ctx.filter = filterCss
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(imageFile)
            return
          }
          const file = new File([blob], imageFile.name, {
            type: imageFile.type || "image/jpeg",
            lastModified: Date.now(),
          })
          resolve(file)
        },
        imageFile.type || "image/jpeg",
        0.95
      )
    }

    img.onerror = (err) => {
      reject(err)
    }
  })
}

export default function CreatePostPage() {
  const [step, setStep] = useState<Step>("upload")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageURL, setImageURL] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [ratio, setRatio] = useState("original")
  const [shaking, setShaking] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState("none")
  
  // Caption & details
  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState("")
  const [showLocationInput, setShowLocationInput] = useState(false)
  
  const [successModal, setSuccessModal] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [addPost] = useAddPostMutation()

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (imageURL) URL.revokeObjectURL(imageURL)
    }
  }, [imageURL])

  // Shake animation when aspect ratio changes
  const triggerShake = () => {
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
  }

  const handleRatioChange = (val: string) => {
    setRatio(val)
    triggerShake()
  }

  // Handle selected image file
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.")
      return
    }
    if (imageURL) URL.revokeObjectURL(imageURL)
    setImageFile(file)
    setImageURL(URL.createObjectURL(file))
    setStep("crop")
  }, [imageURL])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  // Publish Post to Feed
  const handlePublish = async () => {
    if (!imageFile) return
    setIsPublishing(true)
    try {
      let finalFile = imageFile
      try {
        finalFile = await processProcessedImage(imageFile, selectedFilter, ratio)
      } catch (procErr) {
        console.warn("Failed to apply filters, sharing original image:", procErr)
      }

      const fullCaption = location ? `${caption}\n\n📍 ${location}` : caption
      await addPost({
        title: fullCaption,
        content: fullCaption,
        images: [finalFile],
      }).unwrap()
      setSuccessModal(true)
      // reset
      setStep("upload")
      setImageFile(null)
      setImageURL(null)
      setCaption("")
      setLocation("")
      setSelectedFilter("none")
      setRatio("original")
    } catch (err: any) {
      const errorMsg = err?.data?.errors
        ? JSON.stringify(err.data.errors, null, 2)
        : err?.data?.message ?? err?.message ?? "An unexpected error occurred"
      alert("Failed to share post:\n" + errorMsg)
    } finally {
      setIsPublishing(false)
    }
  }

  // Navigate back/next
  const goBack = () => {
    if (step === "crop") {
      setStep("upload")
      setImageFile(null)
      setImageURL(null)
    }
    if (step === "filter") setStep("crop")
    if (step === "caption") setStep("filter")
  }

  const goNext = () => {
    if (step === "crop") setStep("filter")
    if (step === "filter") setStep("caption")
  }

  // Formatting steps
  const stepTitle: Record<Step, string> = {
    upload: "Create new post",
    crop: "Crop",
    filter: "Edit",
    caption: "Create new post",
  }

  const filterStyle = selectedFilter === "none" ? {} : { filter: selectedFilter }

  const emojis = ["😂", "😍", "😭", "👍", "❤️", "🔥", "👏", "🎉", "🙌", "😎", "✨", "💯"]

  return (
    <div className="h-full w-full flex items-center justify-center bg-white overflow-y-auto py-10 px-4">
      {/* Premium Keyframe Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: scale(1) rotate(0deg); }
          20% { transform: scale(1.02) rotate(-1deg); }
          40% { transform: scale(1.02) rotate(1deg); }
          60% { transform: scale(1.01) rotate(-0.5deg); }
          80% { transform: scale(1.01) rotate(0.5deg); }
        }
        .shake-effect { animation: shake 0.45s cubic-bezier(.36,.07,.19,.97) both; }

        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-enter { animation: modalEnter 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>

      {/* ── Instagram-Style Modal Container ── */}
      <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200 w-full max-w-[840px] flex flex-col modal-enter"
           style={{ minHeight: 540 }}>

        {/* ── Modal Header ── */}
        <div className="h-11 flex items-center justify-between px-4 border-b border-gray-200 bg-white select-none flex-shrink-0">
          {step !== "upload" ? (
            <button
              onClick={goBack}
              className="text-black hover:text-gray-600 transition duration-150"
            >
              <ArrowLeftIcon className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <div className="w-5" />
          )}

          <span className="text-black font-semibold text-sm tracking-wide">
            {stepTitle[step]}
          </span>

          {step !== "upload" && step !== "caption" ? (
            <button
              onClick={goNext}
              className="text-[#0095f6] hover:text-[#1aa3ff] font-bold text-sm transition duration-150"
            >
              Next
            </button>
          ) : step === "caption" ? (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="text-[#0095f6] hover:text-[#1aa3ff] font-bold text-sm transition duration-150 disabled:opacity-40"
            >
              {isPublishing ? "Sharing..." : "Share"}
            </button>
          ) : (
            <div className="w-5" />
          )}
        </div>

        {/* ── Modal Body content ── */}
        <div className="flex-1 flex flex-col md:flex-row bg-black overflow-hidden relative">

          {/* ══════════════════════ STEP: UPLOAD ══════════════════════ */}
          {step === "upload" && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-8 bg-white">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center gap-6 cursor-pointer w-full max-w-md rounded-2xl border-2 border-dashed p-12 transition-all duration-300 ${
                  dragActive
                    ? "border-[#0095f6] bg-[#0095f6]/5 scale-102"
                    : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                  className="hidden"
                />

                {/* Highly Authentic Instagram Icon Asset */}
                <div className="text-black">
                  <svg aria-label="Icon to represent media such as images or videos" className="mx-auto" color="currentColor" fill="currentColor" height="77" role="img" viewBox="0 0 97.6 77.3" width="96">
                    <path d="M16.3 24h.3c.1-.2.2-.4.4-.6l2-2.9C20 19 21.8 18 23.5 18h14.7c1.7 0 3.5 1 4.3 2.6l2 2.9c.1.2.3.4.4.6h25.9c3.9 0 7.1 3.2 7.1 7.1v31.8c0 3.9-3.2 7.1-7.1 7.1H16.3c-3.9 0-7.1-3.2-7.1-7.1V31.1c0-3.9 3.2-7.1 7.1-7.1zm54.3 23c-4.2 0-7.7-3.4-7.7-7.7s3.4-7.7 7.7-7.7 7.7 3.4 7.7 7.7-3.5 7.7-7.7 7.7zM16.3 20c-6.1 0-11.1 5-11.1 11.1v31.8c0 6.1 5 11.1 11.1 11.1h54.3c6.1 0 11.1-5 11.1-11.1V31.1c0-6.1-5-11.1-11.1-11.1H60l-2.4-3.6C56 13.9 53 12 49.5 12H23.5c-3.5 0-6.5 1.9-8.1 4.4L13 20H16.3z" fill="currentColor"></path>
                  </svg>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-black text-lg font-light">Drag photos here</p>
                  <p className="text-[11px] text-gray-500 font-semibold tracking-wide uppercase">JPG, PNG, WEBP formats supported</p>
                </div>

                <button
                  type="button"
                  className="bg-[#0095f6] hover:bg-[#1aa3ff] text-white text-xs font-bold px-4 py-2 rounded-lg transition duration-150 active:scale-98"
                >
                  Select from computer
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════ STEP: CROP ══════════════════════ */}
          {step === "crop" && imageURL && (
            <>
              {/* Left Side: Large interactive preview */}
              <div className="flex-1 bg-black flex items-center justify-center p-6 select-none relative" style={{ minHeight: 460 }}>
                <div
                  className={`relative overflow-hidden transition-all duration-300 ${
                    shaking ? "shake-effect" : ""
                  }`}
                  style={{
                    aspectRatio: ratio === "original" ? "auto" : ratio,
                    maxHeight: "420px",
                    maxWidth: "100%",
                    borderRadius: "4px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                >
                  <img
                    src={imageURL}
                    alt="crop preview"
                    className="w-full h-full object-cover block select-none"
                    draggable={false}
                    style={filterStyle}
                  />
                </div>
              </div>

              {/* Right Side: Aspect Ratio Selector Panel */}
              <div className="w-full md:w-[280px] bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col p-4 flex-shrink-0">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3.5">Select Aspect Ratio</span>
                <div className="flex flex-col gap-2">
                  {RATIOS.map(({ label, value, Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleRatioChange(value)}
                      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left text-xs font-bold transition-all duration-150 ${
                        ratio === value
                          ? "bg-gray-100 text-black shadow-sm border border-gray-200/50"
                          : "text-gray-500 hover:text-black hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      <div className={ratio === value ? "text-[#0095f6]" : "text-gray-400"}>
                        <Icon />
                      </div>
                      <span className="tracking-wide">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════ STEP: FILTER ══════════════════════ */}
          {step === "filter" && imageURL && (
            <>
              {/* Left Side: Large interactive preview */}
              <div className="flex-1 bg-black flex items-center justify-center p-6 select-none" style={{ minHeight: 460 }}>
                <div
                  style={{
                    aspectRatio: ratio === "original" ? "auto" : ratio,
                    maxHeight: "420px",
                    maxWidth: "100%",
                    borderRadius: "4px",
                    overflow: "hidden",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                >
                  <img
                    src={imageURL}
                    alt="filter preview"
                    className="w-full h-full object-cover block select-none"
                    draggable={false}
                    style={filterStyle}
                  />
                </div>
              </div>

              {/* Right Side: Premium Filter Grid Scroll Container */}
              <div className="w-full md:w-[280px] bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col p-4 flex-shrink-0 overflow-y-auto" style={{ maxHeight: 480 }}>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Filters</span>
                <div className="grid grid-cols-2 gap-3">
                  {FILTERS.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setSelectedFilter(f.css)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all duration-150 ${
                        selectedFilter === f.css
                          ? "bg-gray-100 ring-2 ring-[#0095f6]"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      {/* Stylized small preview thumbnail */}
                      <div className="w-full aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={imageURL}
                          alt={f.name}
                          className="w-full h-full object-cover"
                          style={{ filter: f.css === "none" ? "none" : f.css }}
                        />
                      </div>
                      <span className={`text-[10px] font-semibold tracking-wide ${
                        selectedFilter === f.css ? "text-[#0095f6]" : "text-gray-500"
                      }`}>
                        {f.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══════════════════════ STEP: CAPTION ══════════════════════ */}
          {step === "caption" && imageURL && (
            <>
              {/* Left Side: Large interactive preview */}
              <div className="flex-1 bg-black flex items-center justify-center p-6 select-none" style={{ minHeight: 460 }}>
                <div
                  style={{
                    aspectRatio: ratio === "original" ? "auto" : ratio,
                    maxHeight: "420px",
                    maxWidth: "100%",
                    borderRadius: "4px",
                    overflow: "hidden",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                  }}
                >
                  <img
                    src={imageURL}
                    alt="final preview"
                    className="w-full h-full object-cover block select-none"
                    draggable={false}
                    style={filterStyle}
                  />
                </div>
              </div>

              {/* Right Side: Instagram Details & Sharing sidebar */}
              <div className="w-full md:w-[320px] bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col flex-shrink-0 select-none">
                
                {/* User Info Header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-600 p-[1.5px]">
                    <div className="h-full w-full rounded-full bg-gray-100 flex items-center justify-center text-black text-[11px] font-black">
                      U
                    </div>
                  </div>
                  <span className="text-black text-xs font-bold">user</span>
                </div>

                {/* Caption Textarea Container */}
                <div className="px-4 flex flex-col relative">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a caption..."
                    maxLength={2200}
                    rows={6}
                    className="w-full bg-transparent resize-none text-black text-sm placeholder-gray-500 focus:outline-none leading-relaxed"
                  />
                  
                  {/* Emoji Quick Picker Bar */}
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-gray-400 hover:text-black transition duration-150"
                    >
                      <FaceSmileIcon className="w-5.5 h-5.5" />
                    </button>
                    <span className="text-[10px] text-gray-500 font-bold">
                      {caption.length.toLocaleString()}/2,200
                    </span>
                  </div>

                  {/* Quick Emojis Grid */}
                  {showEmojiPicker && (
                    <div className="flex flex-wrap gap-2.5 py-3 border-b border-gray-100 animate-fade-in">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setCaption((prev) => prev + emoji)
                            setShowEmojiPicker(false)
                          }}
                          className="text-lg hover:scale-120 transition active:scale-95 duration-100"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Extra Options Accordion/Drawer List */}
                <div className="flex-1 flex flex-col divide-y divide-gray-100">
                  {/* Add Location Row */}
                  <div className="flex flex-col">
                    <div
                      onClick={() => setShowLocationInput(!showLocationInput)}
                      className="flex items-center justify-between px-4 py-3.5 text-black hover:bg-gray-50 cursor-pointer transition duration-150"
                    >
                      <div className="flex items-center gap-3">
                        <MapPinIcon className="h-4.5 w-4.5 text-gray-500" />
                        <span className="text-xs font-semibold">
                          {location ? `Location: ${location}` : "Add location"}
                        </span>
                      </div>
                      <ChevronRightIcon className={`h-3.5 w-3.5 text-gray-400 transition-transform ${showLocationInput ? "rotate-90" : ""}`} />
                    </div>

                    {showLocationInput && (
                      <div className="px-4 pb-3 animate-fade-in">
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Search or add location..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-xs text-black placeholder-gray-500 focus:outline-none focus:border-[#0095f6]/50 transition"
                        />
                      </div>
                    )}
                  </div>

                  {/* Accessibility Option Row */}
                  <div className="flex items-center justify-between px-4 py-3.5 text-black hover:bg-gray-50 cursor-pointer transition duration-150">
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-4.5 w-4.5 text-gray-500" />
                      <span className="text-xs font-semibold">Accessibility</span>
                    </div>
                    <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
                  </div>

                  {/* Advanced Settings Row */}
                  <div className="flex items-center justify-between px-4 py-3.5 text-black hover:bg-gray-50 cursor-pointer transition duration-150">
                    <div className="flex items-center gap-3">
                      <Cog6ToothIcon className="h-4.5 w-4.5 text-gray-500" />
                      <span className="text-xs font-semibold">Advanced settings</span>
                    </div>
                    <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>

              </div>
            </>
          )}

        </div>
      </div>

      {/* ── Muvaffaqiyat (Success) Modal ── */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-black text-lg font-bold mb-1.5">Post shared!</h3>
            <p className="text-gray-500 text-xs leading-relaxed mb-6">Your post has been successfully shared to the Reels feed.</p>
            <button
              onClick={() => setSuccessModal(false)}
              className="w-full bg-[#0095f6] hover:bg-[#1aa3ff] text-white font-bold py-2.5 rounded-xl transition duration-150"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
