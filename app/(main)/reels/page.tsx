"use client"

import { useRef, useState, useEffect } from "react"
import {
  HeartIcon as HeartIconOutline,
  ChatBubbleOvalLeftIcon,
  PaperAirplaneIcon,
  BookmarkIcon as BookmarkIconOutline,
  EllipsisHorizontalIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  PlayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import {
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from "@heroicons/react/24/solid"

import {
  useGetReelsQuery,
  useLikePostMutation,
  useAddCommentMutation,
  useAddFavoriteMutation,
  useAddFollowingMutation,
  useDeleteFollowingMutation,
} from "@/app/services/Reels"

const API_IMAGE = "https://instagram-api.softclub.tj/images/"

const EMOJI_CATEGORIES: Record<string, string[]> = {
  "🔥 Popular": ["😂", "😍", "😭", "👍", "❤️", "🔥", "👏", "🎉", "💔", "🤔", "🙌", "😎", "😮", "😡", "🙄", "🤫", "✨", "💯"],
  "😊 Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓"],
  "👍 Gestures": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪"],
  "🌳 Nature": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🐝", "🦋", "🐌", "🐞", "🐢", "🐍", "🐙", "🐠", "🐬", "🐳", "🐋", "🦈", "🌴", "🌱", "🌿", "🍀", "🍁", "🍂", "🍃", "🌹", "🌸", "🌺", "🌻", "☀️", "🌙", "⭐", "⚡", "🔥", "🌈", "❄️"],
}

export default function ReelsPage() {
  const { data, isLoading, isError, error } = useGetReelsQuery({
    PageNumber: 1,
    PageSize: 10,
  })

  const [isMuted, setIsMuted] = useState(true)

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white text-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-pink-600"></div>
          <span className="text-sm font-medium text-gray-500">Loading Reels...</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-white text-red-500 px-6">
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center max-w-md">
          <h1 className="text-xl font-extrabold mb-2 text-red-600">Error Loading Reels</h1>
          <p className="text-sm text-gray-500 mb-4">
            Could not fetch the latest Reels feed. Please check your token or try again.
          </p>
          <pre className="rounded-xl bg-gray-50 p-3 text-xs text-left overflow-x-auto border border-gray-200 text-gray-700">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-white text-gray-600">
        <div className="text-center p-6">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-black">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-black mb-1">No Reels Available</h3>
          <p className="text-sm text-gray-500">There are no Reels to display right now.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-y-scroll bg-white text-black snap-y snap-mandatory scrollbar-none flex flex-col items-center">
      {data.map((reel) => (
        <ReelCard
          key={reel.postId}
          reel={reel}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
        />
      ))}
    </div>
  )
}

interface CommentItem {
  id: number
  userName: string
  userImage: string | null
  comment: string
  date: string
  likes: number
  isLiked: boolean
}

function ReelCard({
  reel,
  isMuted,
  setIsMuted,
}: {
  reel: any
  isMuted: boolean
  setIsMuted: (val: boolean) => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [isLiked, setIsLiked] = useState(reel.postLike || false)
  const [likeCount, setLikeCount] = useState(reel.postLikeCount || 0)
  const [isBookmarked, setIsBookmarked] = useState(reel.postFavorite || false)
  const [showHeartPop, setShowHeartPop] = useState(false)
  const [showMuteIndicator, setShowMuteIndicator] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isFollowed, setIsFollowed] = useState(reel.isSubscriber || false) // Bind to Swagger subscriber field
  const [isExpanded, setIsExpanded] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [shareCount, setShareCount] = useState(() => Math.floor(Math.random() * 480) + 20)
  const [activeCategory, setActiveCategory] = useState<string>("🔥 Popular")

  // Determine media type (Video or Image) from filename
  const isVideo = reel.images
    ? /\.(mp4|webm|mov|m4v|ogg)$/i.test(reel.images)
    : false

  // API mutations
  const [likePost] = useLikePostMutation()
  const [addComment] = useAddCommentMutation()
  const [addFavorite] = useAddFavoriteMutation()
  const [addFollowing] = useAddFollowingMutation()
  const [deleteFollowing] = useDeleteFollowingMutation()

  // Local comments state to make it interactive and display instantly
  const [comments, setComments] = useState<CommentItem[]>(
    (reel.comments || []).map((c: any, index: number) => ({
      id: c.postCommentId || index,
      userName: c.userName || "anonymous",
      userImage: c.userImage,
      comment: c.comment,
      date: c.dateCommented || new Date().toISOString(),
      likes: Math.floor(Math.random() * 800),
      isLiked: false,
    }))
  )

  const toggleCommentLike = (id: number) => {
    setComments(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    )
  }
  const [newCommentText, setNewCommentText] = useState("")

  // Autoplay/pause using IntersectionObserver (only if it is a video)
  useEffect(() => {
    if (!isVideo || !videoRef.current) return

    const video = videoRef.current
    let isIntersecting = false

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isIntersecting = true
            video.play()
              .then(() => {
                if (isIntersecting) {
                  setPlaying(true)
                }
              })
              .catch((err) => {
                console.warn("Autoplay blocked or interrupted:", err)
                setPlaying(false)
              })
          } else {
            isIntersecting = false
            video.pause()
            setPlaying(false)
          }
        })
      },
      { threshold: 0.6 }
    )

    observer.observe(video)

    return () => {
      observer.unobserve(video)
      observer.disconnect()
      video.pause()
    }
  }, [isVideo])

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  const togglePlay = () => {
    if (!isVideo) return
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
        .then(() => setPlaying(true))
        .catch((err) => {
          console.error("Play failed:", err)
          setPlaying(false)
        })
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isVideo) return
    setIsMuted(!isMuted)
    setShowMuteIndicator(true)
    setTimeout(() => setShowMuteIndicator(false), 800)
  }

  
  const handleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const nextLiked = !isLiked
    setIsLiked(nextLiked)
    setLikeCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)))

    try {
      await likePost(reel.postId).unwrap()
    } catch (err) {
      // rollback if failed
      setIsLiked(!nextLiked)
      setLikeCount((prev) => (!nextLiked ? prev + 1 : Math.max(0, prev - 1)))
      triggerToast("Error updating like")
    }
  }

  // Double tap vs Single tap click system using useRef
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMediaClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (clickTimeoutRef.current) {
      // Double click detected!
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
      
      if (!isLiked) {
        handleLike()
      }
      setShowHeartPop(true)
      setTimeout(() => setShowHeartPop(false), 900)
    } else {
      // Set timeout for single click
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null
        if (isVideo) {
          togglePlay()
        }
      }, 250)
    }
  }

  // Real-time optimistic Bookmark integration
  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextBookmarked = !isBookmarked
    setIsBookmarked(nextBookmarked)
    triggerToast(nextBookmarked ? "Saved to Bookmarks" : "Removed from Bookmarks")

    try {
      await addFavorite(reel.postId).unwrap()
    } catch (err) {
      // rollback
      setIsBookmarked(!nextBookmarked)
      triggerToast("Error saving bookmark")
    }
  }

  // Real-time optimistic Follow integration
  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextFollowed = !isFollowed
    setIsFollowed(nextFollowed)

    try {
      if (nextFollowed) {
        await addFollowing(reel.userId).unwrap()
        triggerToast(`Followed ${reel.userName || "user"}`)
      } else {
        await deleteFollowing(reel.userId).unwrap()
        triggerToast(`Unfollowed ${reel.userName || "user"}`)
      }
    } catch (err) {
      // rollback
      setIsFollowed(!nextFollowed)
      triggerToast("Error updating relationship")
    }
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const dummyUrl = `${window.location.origin}/reels/${reel.postId}`
    navigator.clipboard.writeText(dummyUrl).then(() => {
      triggerToast("Link copied to clipboard!")
      setShareCount(prev => prev + 1)
    })
  }



  // Real-time optimistic Comment integration
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommentText.trim()) return

    const commentText = newCommentText.trim()
    const tempId = Date.now()

    // Add locally for optimistic UI responsiveness
    const newComment: CommentItem = {
      id: tempId,
      userName: "you",
      userImage: null,
      comment: commentText,
      date: new Date().toISOString(),
    }

    setComments((prev) => [{ ...newComment, likes: 0, isLiked: false }, ...prev])
    setNewCommentText("")

    try {
      await addComment({ comment: commentText, postId: reel.postId }).unwrap()
      triggerToast("Comment posted!")
    } catch (err) {
      // rollback locally if api fails
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setNewCommentText(commentText)
      triggerToast("Failed to post comment")
    }
  }

  return (
    <section className="flex h-screen w-full snap-start items-center justify-center bg-white py-2 relative select-none">

      {/* ── Instagram-style RIGHT SIDE comments drawer ── */}
      {showComments && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowComments(false)} />
          <div className="fixed right-0 top-0 h-full w-[400px] z-50 bg-white border-l border-gray-200 flex flex-col shadow-2xl" style={{animation:"slideInRight .25s ease"}}>
            <style>{`@keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-black">Comments</h3>
              <button onClick={() => setShowComments(false)} className="text-gray-500 hover:text-black transition p-1 rounded-full hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <ChatBubbleOvalLeftIcon className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-black font-bold text-lg">No comments yet.</p>
                  <p className="text-gray-500 text-sm mt-1">Start the conversation.</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 items-start">
                    <img
                      src={comment.userImage ? `${API_IMAGE}${comment.userImage}` : `https://ui-avatars.com/api/?name=${comment.userName}&background=333&color=fff&size=80`}
                      alt={comment.userName}
                      className="h-9 w-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="font-semibold text-black text-sm">{comment.userName} </span>
                          <span className="text-gray-800 text-sm break-words">{comment.comment}</span>
                        </div>
                        {/* Comment Like button */}
                        <button
                          onClick={() => toggleCommentLike(comment.id)}
                          className="flex-shrink-0 flex flex-col items-center gap-0.5 ml-1"
                        >
                          {comment.isLiked ? (
                            <HeartIconSolid className="h-4 w-4 text-red-500" />
                          ) : (
                            <HeartIconOutline className="h-4 w-4 text-gray-400 hover:text-black transition" />
                          )}
                          {comment.likes > 0 && (
                            <span className="text-[10px] text-gray-500">{comment.likes}</span>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-gray-500">
                          {new Date(comment.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        {comment.likes > 0 && (
                          <span className="text-[11px] text-gray-500">{comment.likes} likes</span>
                        )}
                        <button className="text-[11px] text-gray-500 font-semibold hover:text-black transition">Reply</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <form onSubmit={handleAddComment} className="border-t border-gray-200 px-4 py-3 bg-white flex items-center gap-3 relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newCommentText}
                  onChange={e => setNewCommentText(e.target.value)}
                  className="w-full bg-transparent text-black text-sm placeholder-gray-500 focus:outline-none pr-8"
                />
                <button type="button" onClick={e => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker) }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                  </svg>
                </button>
              </div>
              <button type="submit" disabled={!newCommentText.trim()}
                className="text-[#0095f6] font-bold text-sm disabled:opacity-30 hover:text-blue-600 transition">
                Post
              </button>

              {showEmojiPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                  <div className="absolute bottom-14 left-0 w-72 z-50 rounded-2xl bg-white border border-gray-200 p-3 shadow-2xl flex flex-col h-64">
                    <div className="flex gap-2 border-b border-gray-100 pb-2 mb-2 overflow-x-auto text-[10px] font-bold text-gray-500">
                      {Object.keys(EMOJI_CATEGORIES).map(cat => (
                        <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                          className={`px-2 py-1 rounded-md whitespace-nowrap transition ${activeCategory===cat?"bg-gray-100 text-black":"hover:text-black"}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 overflow-y-auto grid grid-cols-6 gap-1">
                      {EMOJI_CATEGORIES[activeCategory].map(emoji => (
                        <button key={emoji} type="button" onClick={() => setNewCommentText(p=>p+emoji)}
                          className="text-xl p-1 hover:bg-gray-100 rounded-lg transition">{emoji}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </form>
          </div>
        </>
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-8 z-50 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl border border-white/10 shadow-2xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Main Reels Card Layout */}
      <div className="relative flex h-[95vh] items-end justify-center gap-6 max-h-[850px] w-full max-w-[550px] px-4">
        
        {/* Media Player / Cover Frame */}
        <div className="relative h-full w-[410px] flex-shrink-0 overflow-hidden rounded-[8px] bg-neutral-950 border border-white/10 shadow-2xl transition-all duration-300">
          
          {isVideo ? (
            <video
              ref={videoRef}
              src={`${API_IMAGE}${reel.images}`}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onClick={handleMediaClick}
              onError={() => {
                setVideoError("Video file format is unsupported or the server returned an error.")
              }}
              className="h-full w-full cursor-pointer object-cover"
            />
          ) : (
            <img
              src={`${API_IMAGE}${reel.images}`}
              alt={reel.title || "Reel Content"}
              onClick={handleMediaClick}
              className="h-full w-full cursor-pointer object-cover select-none"
              draggable={false}
            />
          )}

          {/* Video Error Message Display */}
          {videoError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 p-6 text-center z-25 border border-red-500/20">
              <span className="text-red-500 font-extrabold mb-2 text-sm">Media Loading Error</span>
              <p className="text-xs text-gray-500 max-w-[280px]">{videoError}</p>
            </div>
          )}

          {/* Big Like Heart Animation */}
          {showHeartPop && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none z-20">
              <HeartIconSolid className="h-28 w-28 text-red-500 animate-ping absolute opacity-75" />
              <HeartIconSolid className="h-24 w-24 text-red-500 drop-shadow-2xl animate-bounce-short" />
            </div>
          )}

          {/* Play/Pause Overlay (only for videos) */}
          {isVideo && !playing && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/25 z-10"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 border border-white/10 backdrop-blur-md transition-transform hover:scale-105">
                <PlayIcon className="h-8 w-8 text-white ml-0.5" />
              </div>
            </div>
          )}

          {/* Mute Indicator Flash (only for videos) */}
          {isVideo && showMuteIndicator && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-fade-out-slow">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 backdrop-blur-md">
                {isMuted ? (
                  <SpeakerXMarkIcon className="h-6 w-6 text-white" />
                ) : (
                  <SpeakerWaveIcon className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
          )}

          {/* Dark Gradient Overlay for bottom text legibility */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>

          {/* Bottom Mute Button (only for videos) */}
          {isVideo && (
            <button
              onClick={toggleMute}
              className="absolute right-4 bottom-6 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 border border-white/10 hover:bg-black/80 hover:scale-105 z-20 cursor-pointer transition duration-150"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-4.5 w-4.5 text-white" />
              ) : (
                <SpeakerWaveIcon className="h-4.5 w-4.5 text-white" />
              )}
            </button>
          )}

          {/* Bottom Reel Details overlay */}
          <div className="absolute bottom-6 left-4 right-16 z-20 text-white pointer-events-auto flex flex-col gap-1.5 select-none">
            {/* User Meta Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <img
                src={
                  reel.userImage
                    ? `${API_IMAGE}${reel.userImage}`
                    : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
                }
                alt="user"
                className="h-8 w-8 rounded-full border border-white/10 object-cover bg-neutral-900"
              />
              <span className="text-[13px] font-bold tracking-wide truncate max-w-[140px]">
                {reel.userName || "anonymous"}
              </span>
              <span className="text-white/60 text-[10px] font-bold select-none">•</span>
              <button
                onClick={handleFollowToggle}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold tracking-tight transition duration-200 cursor-pointer ${
                  isFollowed
                    ? "bg-transparent border-white/30 text-white hover:bg-white/5"
                    : "bg-transparent border-white/60 text-white hover:border-white hover:bg-white/10"
                }`}
              >
                {isFollowed ? "Following" : "Follow"}
              </button>
            </div>

            {/* Location / Sound track row */}
            <div className="flex items-center gap-1.5 text-[11px] text-white/80 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white/90 flex-shrink-0">
                <path fillRule="evenodd" d="M9.69 18.933a.75.75 0 0 1-1.075 0C3.622 14.205 2 10.16 2 7.5a8 8 0 1 1 16 0c0 2.66-1.622 6.705-6.615 11.433a.75.75 0 0 1-1.075 0ZM10 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clipRule="evenodd" />
              </svg>
              <span className="truncate max-w-[185px]">Kaliningrad, Russia • Original Audio</span>
            </div>

            {/* Caption */}
            <div className="text-[13px] leading-snug text-white/95">
              <span
                onClick={() => setIsExpanded(!isExpanded)}
                className={`cursor-pointer font-normal break-words ${
                  isExpanded ? "block" : "line-clamp-2"
                }`}
              >
                {reel.content || reel.title || "Enjoying the vibe 🎬✨"}
              </span>
              {(reel.content?.length > 75 || reel.title?.length > 75) && !isExpanded && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="mt-0.5 text-xs font-bold text-white/60 hover:text-white"
                >
                  ...more
                </button>
              )}
            </div>

            {/* Publish Date */}
            <p className="text-[9px] font-semibold text-white/40 tracking-wider">
              {new Date(reel.datePublished || Date.now()).toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* no inline comments panel here */}
        </div>

        {/* Action Panel (Right Side Icons) */}
        <div className="flex flex-col items-center gap-6 pb-6 pointer-events-auto select-none">
          {/* Like */}
          <div className="flex flex-col items-center gap-1 group">
            <button
              onClick={handleLike}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition duration-200 cursor-pointer active:scale-90 ${
                isLiked ? "text-red-500" : "text-black hover:text-black/80"
              }`}
            >
              {isLiked ? (
                <HeartIconSolid className="h-7 w-7 text-red-500 animate-scale-up" />
              ) : (
                <HeartIconOutline className="h-7 w-7 transition-transform group-hover:scale-105" />
              )}
            </button>
            <span className="text-[12px] font-medium text-black select-none">{likeCount}</span>
          </div>

          {/* Comments */}
          <div className="flex flex-col items-center gap-1 group">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowComments(true)
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full transition duration-200 text-black hover:text-black/80 cursor-pointer active:scale-90"
            >
              <ChatBubbleOvalLeftIcon className="h-7 w-7 transition-transform group-hover:scale-105" />
            </button>
            <span className="text-[12px] font-medium text-black select-none">{comments.length}</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1 group">
            <button
              onClick={handleShare}
              className="flex h-11 w-11 items-center justify-center rounded-full transition duration-200 text-black hover:text-black/80 cursor-pointer active:scale-90"
            >
              {/* Sleek paper airplane icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 transition-transform group-hover:scale-105">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
              </svg>
            </button>
            <span className="text-[12px] font-medium text-black select-none">{shareCount}</span>
          </div>

          {/* Bookmark */}
          <div className="flex flex-col items-center gap-1 group">
            <button
              onClick={handleBookmark}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition duration-200 cursor-pointer active:scale-90 ${
                isBookmarked ? "text-yellow-500" : "text-black hover:text-black/80"
              }`}
            >
              {isBookmarked ? (
                <BookmarkIconSolid className="h-7 w-7 text-yellow-500 animate-scale-up" />
              ) : (
                <BookmarkIconOutline className="h-7 w-7 transition-transform group-hover:scale-105" />
              )}
            </button>
            <span className="text-[10px] font-semibold text-black/50 select-none uppercase tracking-wider mt-0.5">Save</span>
          </div>

          {/* More Menu */}
          <div className="relative group">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMoreMenu(!showMoreMenu)
              }}
              className="flex h-11 w-11 items-center justify-center text-black hover:text-black/80 transition cursor-pointer active:scale-90"
            >
              <EllipsisHorizontalIcon className="h-7 w-7" />
            </button>

            {/* Dropdown Options Menu */}
            {showMoreMenu && (
              <>
                <div
                  className="fixed inset-0 z-45"
                  onClick={() => setShowMoreMenu(false)}
                ></div>
                <div className="absolute bottom-12 right-0 w-44 z-50 rounded-2xl bg-white border border-gray-200 p-2 text-sm text-black shadow-xl animate-scale-up">
                  <button
                    onClick={() => {
                      setShowMoreMenu(false)
                      triggerToast("Reel reported successfully.")
                    }}
                    className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg font-semibold transition cursor-pointer"
                  >
                    Report
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => {
                      setShowMoreMenu(false)
                      triggerToast("Not interested feed updated.")
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    Not Interested
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button
                    onClick={() => setShowMoreMenu(false)}
                    className="w-full text-left px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>

          {/* User Small Avatar (Styled as square outline from audio track disk in first screenshot) */}
          <div className="mt-2 relative group p-0.5 bg-white border border-gray-300 rounded-md overflow-hidden h-7 w-7 cursor-pointer hover:scale-105 transition duration-150">
            <img
              src={
                reel.userImage
                  ? `${API_IMAGE}${reel.userImage}`
                  : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
              }
              alt="user avatar"
              className="h-full w-full object-cover rounded-xs"
            />
          </div>
        </div>
      </div>
    </section>
  )
}