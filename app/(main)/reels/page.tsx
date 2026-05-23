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
import { useGetMyProfileQuery } from "@/app/services/publication.home"


const API_IMAGE = "https://instagram-api.softclub.tj/images/"

const ReelHeartIcon = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={active ? "#ff3040" : "none"}
    stroke={active ? "#ff3040" : "currentColor"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-7 w-7 transition-all duration-200 ${active ? "animate-scale-up text-[#ff3040]" : "text-black"}`}
  >
    <path d="M20.84 4.61c-1.54-1.33-3.84-1.14-5.26.32L12 8.6 8.42 4.93C7 3.47 4.7 3.28 3.16 4.61 1.39 6.14 1.3 8.85 2.95 10.55l8.2 8.45a1.18 1.18 0 0 0 1.7 0l8.2-8.45c1.65-1.7 1.56-4.41-.21-5.94Z" />
  </svg>
)

const ReelCommentIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-7 w-7 text-black"
  >
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.8 8.8 0 0 1-3.8-.86L3 21l1.86-5.7A8.8 8.8 0 0 1 4 11.5a8.5 8.5 0 0 1 17 0Z" />
  </svg>
)

const ReelRepostIcon = ({ active }: { active?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-7 w-7 transition-all duration-200 ${active ? "animate-scale-up text-violet-600" : "text-black"}`}
  >
    <path d="M17 2l4 4-4 4" />
    <path d="M3 11V9a3 3 0 0 1 3-3h15" />
    <path d="M7 22l-4-4 4-4" />
    <path d="M21 13v2a3 3 0 0 1-3 3H3" />
    {active && (
      <path
        d="M9 12.5l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-scale-up"
      />
    )}
  </svg>
)


const ReelSendIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-7 w-7 text-black"
  >
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22 11 13 2 9 22 2Z" />
  </svg>
)

const ReelSaveIcon = ({ active }: { active: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill={active ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`h-7 w-7 transition-all duration-200 ${active ? "animate-scale-up text-black fill-black" : "text-black"}`}
  >
    <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
  </svg>
)


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
  const { data: myProfile } = useGetMyProfileQuery()
  const myUserName = myProfile?.data?.userName || myProfile?.userName || "you"
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [playing, setPlaying] = useState(false)
  const [isLiked, setIsLiked] = useState(reel.postLike || false)
  const [likeCount, setLikeCount] = useState(reel.postLikeCount || 0)
  const [isBookmarked, setIsBookmarked] = useState(reel.postFavorite || false)
  const [showHeartPop, setShowHeartPop] = useState(false)
  const [showMuteIndicator, setShowMuteIndicator] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isFollowed, setIsFollowed] = useState(reel.isSubscriber || false) 
  const [isExpanded, setIsExpanded] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [shareCount, setShareCount] = useState(() => Math.floor(Math.random() * 480) + 20)
  const [activeCategory, setActiveCategory] = useState<string>("🔥 Popular")
  const [isReposted, setIsReposted] = useState(false)
  const [repostCount, setRepostCount] = useState(() => Math.floor((reel.postLikeCount || 0) * 0.4) + 12)
  const [showRepostModal, setShowRepostModal] = useState(false)
  const [repostMessage, setRepostMessage] = useState("")
  const [tempMessage, setTempMessage] = useState("")



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

  // Local comments state to map c.content and c.datePublished
  const [comments, setComments] = useState<CommentItem[]>(
    (reel.comments || []).map((c: any, index: number) => ({
      id: c.postCommentId || index,
      userName: c.userName || "anonymous",
      userImage: c.userImage,
      comment: c.content || c.comment || "",
      date: c.datePublished || c.dateCommented || new Date().toISOString(),
      likes: Math.floor(Math.random() * 120) + 5,
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

  // Double tap vs Single tap click system
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

  // Real-time Bookmark integration
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

  // Real-time Follow integration
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
      userName: myUserName,
      userImage: myProfile?.data?.userImage || myProfile?.userImage || null,
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
    <section className="flex h-screen w-full snap-start items-center justify-center bg-white py-2 relative select-none text-black">

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
                          {new Date(comment.date).toLocaleDateString("ru-RU", { month: "short", day: "numeric" })}
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
            {/* Repost Comment Bubble and Avatar Overlay (Separate block above the metadata) */}
            {isReposted && (
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  setTempMessage(repostMessage === "Добавьте ваше мнение..." ? "" : repostMessage)
                  setShowRepostModal(true)
                }}
                className="flex flex-col items-start mb-2 relative group self-start cursor-pointer hover:scale-[1.03] transition duration-150 active:scale-95"
              >
                {/* Speech Bubble */}
                <div className="relative bg-white text-black text-[12px] font-semibold px-3.5 py-1.5 rounded-2xl shadow-lg mb-2 animate-bounce-slow max-w-[160px] break-words">
                  {repostMessage || "Добавьте ваше мнение..."}
                  {/* Arrow pointing down */}
                  <div className="absolute -bottom-1 left-4 w-2 h-2 bg-white rotate-45"></div>
                </div>
                
                {/* Avatar with purple badge */}
                <div className="relative ml-2">
                  <div className="h-8 w-8 rounded-full border border-white/20 bg-gray-300 flex items-center justify-center text-gray-500 shadow-md">
                    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-violet-600 border border-white/20 shadow-lg animate-scale-up">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-2.5 w-2.5"
                    >
                      <path d="M17 2l4 4-4 4" />
                      <path d="M3 11V9a3 3 0 0 1 3-3h15" />
                      <path d="M7 22l-4-4 4-4" />
                      <path d="M21 13v2a3 3 0 0 1-3 3H3" />
                    </svg>
                  </div>
                </div>
              </div>
            )}


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
        <div className="flex flex-col items-center gap-5 pb-4 pointer-events-auto select-none">
          {/* Like */}
          <div className="group flex flex-col items-center gap-1">
            <button
              onClick={handleLike}
              className="relative flex h-9 w-9 items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
            >
              {isLiked ? (
                <HeartIconSolid className="h-7 w-7 text-[#ff3040] animate-scale-up" />
              ) : (
                <HeartIconOutline className="h-7 w-7 text-black stroke-[2] transition-all duration-200 group-hover:text-black/60" />
              )}
            </button>

            <span className="text-[12px] font-medium text-black select-none leading-none mt-0.5">
              {likeCount}
            </span>
          </div>

          {/* Comments */}
          <div className="flex flex-col items-center gap-1 group">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowComments(true)
              }}
              className="flex h-9 w-9 items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer text-black"
            >
              <ReelCommentIcon />
            </button>
            <span className="text-[12px] font-medium text-black select-none leading-none mt-0.5">
              {comments.length}
            </span>
          </div>

          {/* Repost */}
          <div className="flex flex-col items-center gap-1 group">
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (!isReposted) {
                  setIsReposted(true)
                  setRepostCount((c) => c + 1)
                  setRepostMessage("Добавьте ваше мнение...")
                  triggerToast("Reposted successfully!")
                } else {
                  setTempMessage(repostMessage === "Добавьте ваше мнение..." ? "" : repostMessage)
                  setShowRepostModal(true)
                }
              }}
              className="flex h-9 w-9 items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer text-black"
            >
              <ReelRepostIcon active={isReposted} />
            </button>



            <span className="text-[12px] font-medium text-black select-none leading-none mt-0.5">
              {repostCount}
            </span>
          </div>


          {/* Share */}
          <div className="flex flex-col items-center group">
            <button
              onClick={handleShare}
              className="flex h-9 w-9 items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer text-black"
            >
              <ReelSendIcon />
            </button>
          </div>

          {/* Bookmark */}
          <div className="flex flex-col items-center group">
            <button
              onClick={handleBookmark}
              className="flex h-9 w-9 items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer text-black"
            >
              <ReelSaveIcon active={isBookmarked} />
            </button>
          </div>

          {/* More Menu */}
          <div className="relative group">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMoreMenu(!showMoreMenu)
              }}
              className="flex h-9 w-9 items-center justify-center text-black transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
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

          {/* User Small Avatar */}
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

      {/* Repost Dialog (Modal) */}
      {showRepostModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs pointer-events-auto">
          {/* Modal Card */}
          <div className="relative w-[90%] max-w-[320px] bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-black animate-scale-up">
            {/* Close button */}
            <button
              onClick={() => setShowRepostModal(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-black transition p-1 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Speech bubble and Avatar group */}
            <div className="flex flex-col items-center mt-8 mb-6 relative">
              {/* Speech Bubble Input */}
              <div className="relative bg-white border border-gray-200 text-black px-4 py-2.5 rounded-2xl shadow-lg mb-4 w-44 max-w-xs flex items-center justify-center">
                <input
                  type="text"
                  placeholder="Добавьте ваше мнение..."
                  value={tempMessage}
                  onChange={(e) => setTempMessage(e.target.value)}
                  className="w-full bg-transparent text-center text-xs font-semibold focus:outline-none placeholder-gray-300 text-black"
                  autoFocus
                />
                {/* Speech bubble arrow */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r border-b border-gray-200 rotate-45"></div>
              </div>

              {/* Avatar with purple badge */}
              <div className="relative">
                <div className="h-20 w-20 rounded-full border border-gray-100 object-cover bg-gray-200 flex items-center justify-center text-gray-400">
                  <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 border-2 border-white shadow-lg animate-scale-up">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <path d="M17 2l4 4-4 4" />
                    <path d="M3 11V9a3 3 0 0 1 3-3h15" />
                    <path d="M7 22l-4-4 4-4" />
                    <path d="M21 13v2a3 3 0 0 1-3 3H3" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Repost status line */}
            {isReposted && (
              <p className="text-xs font-semibold text-gray-400 mb-6 text-center">
                Вы сделали репост этого контента.{" "}
                <button
                  onClick={() => {
                    setIsReposted(false)
                    setRepostCount((c) => c - 1)
                    setRepostMessage("")
                    setShowRepostModal(false)
                    triggerToast("Repost removed.")
                  }}
                  className="text-blue-500 font-bold hover:underline cursor-pointer ml-1"
                >
                  Удалить
                </button>
              </p>
            )}

            {/* Submit button */}
            <button
              onClick={() => {
                if (!isReposted) {
                  setIsReposted(true)
                  setRepostCount((c) => c + 1)
                }
                setRepostMessage(tempMessage.trim() || "Добавьте ваше мнение...")
                setShowRepostModal(false)
                triggerToast("Reposted successfully!")
              }}

              className="w-full bg-[#b3c7f7] hover:bg-[#9cb6f5] text-white font-bold py-3 px-6 rounded-2xl transition duration-200 cursor-pointer text-center text-xs shadow-xs"
            >
              Добавить
            </button>
          </div>
        </div>
      )}
    </section>

  )
}