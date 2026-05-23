"use client";

import React, { useEffect, useRef, useState } from "react";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CloseIcon from "@mui/icons-material/Close";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import RepeatIcon from "@mui/icons-material/Repeat";
import AutorenewIcon from "@mui/icons-material/Autorenew";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import { Api, GetUserId } from "@/app/utils/token";

import {
  useAddCommentMutation,
  useGetFollowingPostsQuery,
  useGetPostsQuery,
  useLikePostMutation,
  useFavoritePostMutation,
  useGetUsersQuery,
  useFollowUserMutation,
  useDeletellowUserMutation,
  useGetSubscriptionsQuery,
} from "@/app/services/publication.home";

// ─── REPOST MODAL WITH EDIT & DELETE OPTIONS ───────────────────────────────
interface RepostModalProps {
  isOpen: boolean;
  currentText: string;
  onClose: () => void;
  onConfirm: (text: string) => void;
  onDelete?: () => void;
  isEditMode: boolean;
}

const RepostModal = ({ isOpen, currentText, onClose, onConfirm, onDelete, isEditMode }: RepostModalProps) => {
  const [text, setText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setText(currentText);
    }
  }, [isOpen, currentText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-[340px] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <span className="font-semibold text-sm text-gray-800">
            {isEditMode ? "Редактировать мнение" : "Добавить в заметки"}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Добавьте ваше мнение..."
            maxLength={60}
            rows={3}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none resize-none focus:border-purple-400 transition"
          />
          <div className="text-right text-[11px] text-gray-400 mt-1">
            {text.length}/60
          </div>
        </div>
        <div className="flex flex-col border-t border-gray-100">
          <div className="flex w-full">
            <button
              onClick={onClose}
              className="flex-1 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 transition border-r border-gray-100"
            >
              Отмена
            </button>
            <button
              onClick={() => {
                onConfirm(text.trim() || "Добавьте ваше мнение...");
              }}
              className="flex-1 py-3 text-sm font-semibold text-[#783bf2] hover:bg-purple-50/50 transition"
            >
              {isEditMode ? "Сохранить" : "Поделиться"}
            </button>
          </div>
          {isEditMode && onDelete && (
            <button
              onClick={onDelete}
              className="w-full py-3 text-sm font-medium text-red-500 border-t border-gray-100 hover:bg-red-50 transition text-center"
            >
              Удалить репост из публикации
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── POST MENU MODAL ────────────────────────────────────────────────────────
const PostMenuModal = ({ post, isFollowing, isFavorite, onClose, onFollowToggle, onFavoriteToggle, onAbout }: any) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-[400px] rounded-xl overflow-hidden mb-4 sm:mb-0" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { onFollowToggle(); onClose(); }} className="w-full py-3.5 text-sm font-semibold text-red-500 border-b border-gray-100 hover:bg-gray-50 transition">
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
        <button onClick={() => { onFavoriteToggle(); onClose(); }} className="w-full py-3.5 text-sm font-semibold text-gray-800 border-b border-gray-100 hover:bg-gray-50 transition">
          {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        </button>
        <button onClick={() => { onAbout(); onClose(); }} className="w-full py-3.5 text-sm font-semibold text-gray-800 border-b border-gray-100 hover:bg-gray-50 transition">
          About account
        </button>
        <button onClick={onClose} className="w-full py-3.5 text-sm text-gray-500 hover:bg-gray-50 transition">
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── ABOUT ACCOUNT MODAL ────────────────────────────────────────────────────
const AboutAccountModal = ({ post, onClose }: any) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-[360px] rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">About this account</span>
          <button onClick={onClose}><CloseIcon style={{ fontSize: 20 }} /></button>
        </div>
        <div className="p-5 flex flex-col items-center gap-3">
          <img
            src={post.userImage ? `${Api}/images/${post.userImage}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            className="w-16 h-16 rounded-full object-cover"
            alt=""
          />
          <span className="font-semibold text-base">{post.userName}</span>
          {post.userEmail && <span className="text-sm text-gray-500">{post.userEmail}</span>}
        </div>
        <div className="px-5 pb-5">
          <button onClick={onClose} className="w-full py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── COMMENTS MODAL ─────────────────────────────────────────────────────────
const CommentsModal = ({ post, onClose, getCurrentIndex, setPostIndex, toggleMute, isMuted }: any) => {
  const [text, setText] = useState("");
  const [comments, setComments] = useState<any[]>(post.comments ?? []);
  const [likedComments, setLikedComments] = useState<number[]>([]);
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<Record<number, any[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);
  const [modalLiked, setModalLiked] = useState<boolean>(!!post.postLike);
  const [modalLikeCount, setModalLikeCount] = useState<number>(post.postLikeCount ?? 0);
  const [modalSaved, setModalSaved] = useState<boolean>(!!post.postFavorite);

  const [addComment] = useAddCommentMutation();
  const [likePost] = useLikePostMutation();
  const { data } = useGetUsersQuery(undefined);
  const users = data?.data || [];

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await addComment({ postId: post.postId, text });
    setComments((prev) => [...prev, { id: Date.now(), userName: "You", comment: text }]);
    setText("");
  };

  const handleReplySubmit = (commentId: number, atUser: string) => {
    if (!replyText.trim()) return;
    setReplies((prev) => ({
      ...prev,
      [commentId]: [...(prev[commentId] || []), { id: Date.now(), userName: "you", text: replyText }],
    }));
    setReplyText("");
    setReplyingTo(null);
    setExpandedReplies((prev) => prev.includes(commentId) ? prev : [...prev, commentId]);
  };

  const toggleLikeComment = (id: number) => {
    const liked = likedComments.includes(id);
    if (liked) {
      setLikedComments((prev) => prev.filter((x) => x !== id));
      setLikesCount((prev) => ({ ...prev, [id]: Math.max((prev[id] || 1) - 1, 0) }));
    } else {
      setLikedComments((prev) => [...prev, id]);
      setLikesCount((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    }
  };

  const handleModalLike = async () => {
    setModalLiked((prev) => !prev);
    setModalLikeCount((prev) => modalLiked ? Math.max(prev - 1, 0) : prev + 1);
    try { await likePost(post.postId).unwrap(); } catch { setModalLiked((prev) => !prev); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-[1200px] h-[90vh] rounded-sm overflow-hidden flex relative" onClick={(e) => e.stopPropagation()}>
        {/* LEFT: media */}
        <div className="flex-1 bg-black relative">
          {post.images?.length > 1 && (
            <>
              <button onClick={() => setPostIndex(post.postId, getCurrentIndex(post.postId) === 0 ? post.images.length - 1 : getCurrentIndex(post.postId) - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 text-white w-7 h-7 rounded-full">❮</button>
              <button onClick={() => setPostIndex(post.postId, getCurrentIndex(post.postId) === post.images.length - 1 ? 0 : getCurrentIndex(post.postId) + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 text-white w-7 h-7 rounded-full">❯</button>
            </>
          )}
          <div className="w-full h-full">
            {post.images?.[getCurrentIndex(post.postId)]?.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={`${Api}/images/${post.images[getCurrentIndex(post.postId)]}`} className="w-full h-full object-cover" muted={isMuted(post.postId)} autoPlay loop playsInline />
            ) : (
              <img src={`${Api}/images/${post.images[getCurrentIndex(post.postId)]}`} className="w-full h-full object-cover" alt="" />
            )}
          </div>
        </div>

        {/* RIGHT: comments panel */}
        <div className="w-[420px] flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <img src={post.userImage ? `${Api}/images/${post.userImage}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="w-8 h-8 rounded-full object-cover" alt="" />
              <span className="font-semibold text-[13px]">{post.userName}</span>
            </div>
            <MoreHorizIcon sx={{ fontSize: 20 }} />
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {post.description && (
              <div className="flex gap-3">
                <img src={post.userImage ? `${Api}/images/${post.userImage}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                <div className="flex-1">
                  <div className="text-[13px] leading-[18px] break-words">
                    <span className="font-semibold mr-2">{post.userName}</span>
                    <span className="text-gray-800">{post.description}</span>
                  </div>
                </div>
              </div>
            )}

            {comments.map((c: any, i: number) => {
              const commentId = c.commentId ?? c.id ?? i;
              const user = users.find((el: any) => el.id === c.userId);
              const isLikedC = likedComments.includes(commentId);
              const cLikeCount = likesCount[commentId] ?? 0;
              const cReplies = replies[commentId] || [];
              const isExpanded = expandedReplies.includes(commentId);

              return (
                <div key={commentId}>
                  {/* Main comment row */}
                  <div className="flex gap-3 group">
                    <img
                      src={user?.avatar ? `${Api}/images/${user.avatar}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      {/* Comment text */}
                      <div className="text-[13px] leading-[18px] break-words">
                        <span className="font-semibold mr-2">{user?.userName || c.userName || "User"}</span>
                        <span className="text-gray-800">{c.comment || c.text}</span>
                      </div>
                      {/* Meta row: time + Reply */}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-gray-400">2h</span>
                        {cLikeCount > 0 && (
                          <span className="text-[11px] text-gray-400 font-semibold">{cLikeCount} likes</span>
                        )}
                        <button
                          onClick={() => {
                            setReplyingTo(replyingTo === commentId ? null : commentId);
                            setReplyText("");
                          }}
                          className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          Reply
                        </button>
                      </div>

                      {/* Show replies toggle */}
                      {cReplies.length > 0 && (
                        <button
                          onClick={() => setExpandedReplies((prev) => isExpanded ? prev.filter((x) => x !== commentId) : [...prev, commentId])}
                          className="flex items-center gap-2 mt-2 text-[12px] font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                        >
                          <span className="inline-block w-6 h-[1px] bg-gray-400" />
                          {isExpanded ? "Hide replies" : `View ${cReplies.length} ${cReplies.length === 1 ? "reply" : "replies"}`}
                        </button>
                      )}

                      {/* Replies list */}
                      {isExpanded && cReplies.map((r: any) => (
                        <div key={r.id} className="flex gap-2 mt-3 ml-1">
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                            alt=""
                          />
                          <div>
                            <div className="text-[13px] leading-[17px] break-words">
                              <span className="font-semibold mr-2">{r.userName}</span>
                              <span className="text-gray-800">{r.text}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[11px] text-gray-400">just now</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Reply input */}
                      {replyingTo === commentId && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            autoFocus
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleReplySubmit(commentId, user?.userName || c.userName || "User"); }}
                            placeholder={`Reply to ${user?.userName || c.userName || "User"}...`}
                            className="flex-1 text-[13px] outline-none border-b border-gray-300 focus:border-gray-600 py-1 bg-transparent placeholder:text-gray-400 transition-colors"
                          />
                          <button
                            onClick={() => handleReplySubmit(commentId, user?.userName || c.userName || "User")}
                            disabled={!replyText.trim()}
                            className="text-[13px] font-semibold text-blue-500 disabled:opacity-40 transition-opacity"
                          >
                            Post
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Like button for comment */}
                    <button
                      onClick={() => toggleLikeComment(commentId)}
                      className="flex-shrink-0 self-start mt-0.5 transition-transform active:scale-75"
                    >
                      {isLikedC
                        ? <FavoriteIcon sx={{ fontSize: 12 }} className="text-red-500" />
                        : <FavoriteBorderIcon sx={{ fontSize: 12 }} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Post actions bar (Instagram style) */}
          <div className="border-t border-gray-100 px-4 pt-3 pb-1">
            <div className="flex justify-between items-center mb-1">
              <div className="flex gap-4 items-center">
                <button onClick={handleModalLike} className="hover:scale-105 active:scale-90 transition-transform">
                  {modalLiked
                    ? <FavoriteIcon sx={{ fontSize: 26 }} className="text-red-500" />
                    : <FavoriteBorderIcon sx={{ fontSize: 26 }} className="text-gray-900" />}
                </button>
                <button className="hover:scale-105 active:scale-90 transition-transform text-gray-900">
                  <ChatBubbleOutlineIcon sx={{ fontSize: 24 }} />
                </button>
              </div>
              <button onClick={() => setModalSaved((s) => !s)} className="text-gray-900">
                {modalSaved
                  ? <BookmarkIcon sx={{ fontSize: 24 }} />
                  : <BookmarkBorderIcon sx={{ fontSize: 24 }} />}
              </button>
            </div>
            {modalLikeCount > 0 && (
              <div className="text-[13px] font-semibold text-gray-900 mb-1">{modalLikeCount.toLocaleString()} likes</div>
            )}
          </div>

          {/* Comment input */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100">
            <img
              src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
              alt=""
            />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Add a comment..."
              className="flex-1 text-[13px] outline-none bg-transparent placeholder:text-gray-400"
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="text-[13px] font-semibold text-blue-500 disabled:opacity-40 transition-opacity"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN POSTS SECTION ─────────────────────────────────────────────────────
const PostsSection = () => {
  const userID: any = GetUserId();

  const [activePost, setActivePost] = useState<any>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [menuPost, setMenuPost] = useState<any>(null);
  const [aboutPost, setAboutPost] = useState<any>(null);
  const [currentIndexes, setCurrentIndexes] = useState<Record<number, number>>({});
  const [mutedPosts, setMutedPosts] = useState<Record<number, boolean>>({});
  const swiperRefs = useRef<Record<number, any>>({});

  // Лайки
  const [localLikes, setLocalLikes] = useState<Record<number, boolean>>({});
  const [localLikeCounts, setLocalLikeCounts] = useState<Record<number, number>>({});

  // Репосты / Заметки
  const [isReposted, setIsReposted] = useState<Record<number, boolean>>({});
  const [fakeReposts, setFakeReposts] = useState<Record<number, number>>({});
  const [repostTexts, setRepostTexts] = useState<Record<number, string>>({});

  // Таргет для модалки заметок
  const [repostModalTargetId, setRepostModalTargetId] = useState<number | null>(null);

  const [likePost] = useLikePostMutation();
  const [favoritePost] = useFavoritePostMutation();
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useDeletellowUserMutation();

  const { data: posts = [], isLoading } = useGetFollowingPostsQuery(userID);
  const { data: subscriptionsData } = useGetSubscriptionsQuery(userID);
  const subscriptions = subscriptionsData?.data ?? [];

  useEffect(() => {
    if (posts.length > 0) {
      setFavorites(posts.filter((p: any) => p.postFavorite).map((p: any) => p.postId));

      const likesMap: Record<number, boolean> = {};
      const likeCountsMap: Record<number, number> = {};
      const repostsMap: Record<number, number> = {};
      const repostStatusMap: Record<number, boolean> = {};

      posts.forEach((p: any) => {
        likesMap[p.postId] = !!p.postLike;
        likeCountsMap[p.postId] = p.postLikeCount ?? 0;
        repostsMap[p.postId] = 30; 
        repostStatusMap[p.postId] = false; 
      });

      setLocalLikes(likesMap);
      setLocalLikeCounts(likeCountsMap);
      setFakeReposts(repostsMap);
      setIsReposted(repostStatusMap);
    }
  }, [posts]);

  const isFollowing = (userId: string) =>
    subscriptions.some((sub: any) => sub.userShortInfo?.userId?.toLowerCase() === userId?.toLowerCase());

  const handleFollowToggle = async (userId: string) => {
    if (isFollowing(userId)) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  const toggleFavorite = async (postId: number) => {
    await favoritePost(postId);
    setFavorites((prev) => prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]);
  };

  const handleLike = async (postId: number) => {
    const wasLiked = localLikes[postId];
    setLocalLikes((prev) => ({ ...prev, [postId]: !wasLiked }));
    setLocalLikeCounts((prev) => ({
      ...prev,
      [postId]: wasLiked ? Math.max((prev[postId] ?? 0) - 1, 0) : (prev[postId] ?? 0) + 1,
    }));
    try {
      await likePost(postId).unwrap();
    } catch {
      setLocalLikes((prev) => ({ ...prev, [postId]: wasLiked }));
      setLocalLikeCounts((prev) => ({
        ...prev,
        [postId]: wasLiked ? (prev[postId] ?? 0) + 1 : Math.max((prev[postId] ?? 0) - 1, 0),
      }));
    }
  };

  // Клик по кнопке репоста открывает окно для создания ИЛИ редактирования
  const handleRepostClick = (postId: number) => {
    setRepostModalTargetId(postId);
  };

  // Подтверждение создания/изменения текста
  const handleConfirmRepost = (text: string) => {
    if (repostModalTargetId !== null) {
      const id = repostModalTargetId;
      // Если это новый репост, увеличиваем счетчик
      if (!isReposted[id]) {
        setFakeReposts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
      }
      setIsReposted((prev) => ({ ...prev, [id]: true }));
      setRepostTexts((prev) => ({ ...prev, [id]: text || "Добавьте ваше мнение..." }));
      setRepostModalTargetId(null);
    }
  };

  // Полное удаление репоста
  const handleDeleteRepost = () => {
    if (repostModalTargetId !== null) {
      const id = repostModalTargetId;
      setIsReposted((prev) => ({ ...prev, [id]: false }));
      setRepostTexts((prev) => ({ ...prev, [id]: "" }));
      setFakeReposts((prev) => ({ ...prev, [id]: Math.max((prev[id] ?? 1) - 1, 0) }));
      setRepostModalTargetId(null);
    }
  };

  const getCurrentIndex = (postId: number) => currentIndexes[postId] ?? 0;
  const setPostIndex = (postId: number, index: number) => setCurrentIndexes((prev) => ({ ...prev, [postId]: index }));
  const isMuted = (postId: number) => mutedPosts[postId] ?? true;
  const toggleMute = (postId: number) => setMutedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <div className="w-full flex flex-col items-center pt-4 pb-20 px-4 bg-white min-h-screen">
        {posts.map((post: any) => {
          const isLiked = localLikes[post.postId] ?? !!post.postLike;
          const likeCount = localLikeCounts[post.postId] ?? post.postLikeCount ?? 0;
          const commentCount = post.comments?.length ?? post.commentCount ?? 0;
          const repostCount = fakeReposts[post.postId] ?? 30;
          const userHasReposted = isReposted[post.postId] ?? false;
          const currentRepostText = repostTexts[post.postId] || "Добавьте ваше мнение...";

          return (
            <div key={post.postId} className="w-full max-w-[468px] mb-8 bg-white">
              
              {/* 1. INSTAGRAM HEADER */}
              <div className="flex justify-between items-center py-2.5">
                <div className="flex items-center gap-3">
                  <img
                    src={post.userImage ? `${Api}/images/${post.userImage}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    className="w-8 h-8 rounded-full object-cover border border-gray-100"
                    alt=""
                  />
                  <span className="font-semibold text-[13px] text-gray-900">{post.userName}</span>
                </div>
                <button onClick={() => setMenuPost(post)} className="text-gray-700">
                  <MoreHorizIcon sx={{ fontSize: 22 }} />
                </button>
              </div>

              {/* 2. INSTAGRAM MEDIA FEED — SWIPER */}
              <div
                className="relative aspect-square bg-gray-50 border border-gray-100 rounded-[4px] overflow-hidden cursor-pointer"
                onClick={() => setActivePost(post)}
              >
                {/* Repost bubble */}
                {userHasReposted && (
                  <div
                    onClick={(e) => { e.stopPropagation(); handleRepostClick(post.postId); }}
                    className="absolute bottom-4 left-4 z-20 flex flex-col items-start cursor-pointer group active:scale-95 transition-transform"
                  >
                    <div className="bg-white/95 backdrop-blur-xs text-gray-800 text-[12px] font-normal px-3 py-1.5 rounded-2xl shadow-lg max-w-[140px] break-words relative mb-1.5 border border-gray-100/50 text-center flex items-center justify-center min-w-[60px]">
                      {currentRepostText}
                      <div className="absolute top-full left-4 w-0 h-0 border-[5px] border-transparent border-t-white/95" />
                    </div>
                    <div className="relative ml-1">
                      <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" className="w-[32px] h-[32px] rounded-full border-2 border-white object-cover shadow-md" alt="" />
                      <div className="absolute -bottom-0.5 -right-0.5 bg-[#783bf2] text-white rounded-full w-4 h-4 flex items-center justify-center p-0.5 shadow-md">
                        <AutorenewIcon style={{ fontSize: 10 }} />
                      </div>
                    </div>
                  </div>
                )}

                <Swiper
                  modules={[Pagination]}
                  pagination={{ clickable: true }}
                  spaceBetween={0}
                  slidesPerView={1}
                  onSwiper={(swiper) => { swiperRefs.current[post.postId] = swiper; }}
                  onSlideChange={(swiper) => setPostIndex(post.postId, swiper.activeIndex)}
                  className="w-full h-full"
                  style={{
                    // @ts-ignore
                    "--swiper-pagination-color": "#fff",
                    "--swiper-pagination-bullet-inactive-color": "rgba(255,255,255,0.5)",
                    "--swiper-pagination-bullet-inactive-opacity": "1",
                    "--swiper-pagination-bullet-size": "5px",
                    "--swiper-pagination-bullet-horizontal-gap": "2px",
                  }}
                >
                  {(post.images ?? []).map((img: string, idx: number) => (
                    <SwiperSlide key={idx} className="w-full h-full">
                      <div className="relative w-full h-full">
                        {img.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video
                            src={`${Api}/images/${img}`}
                            className="w-full h-full object-cover"
                            muted={isMuted(post.postId)}
                            autoPlay loop playsInline
                          />
                        ) : (
                          <img src={`${Api}/images/${img}`} className="w-full h-full object-cover" alt="" />
                        )}
                        {img.match(/\.(mp4|webm|ogg)$/i) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleMute(post.postId); }}
                            className="absolute bottom-3 right-3 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center z-10"
                          >
                            {isMuted(post.postId) ? <VolumeOffIcon style={{ fontSize: 15 }} /> : <VolumeUpIcon style={{ fontSize: 15 }} />}
                          </button>
                        )}
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Prev/Next buttons — only for multi-image posts */}
                {(post.images?.length ?? 0) > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); swiperRefs.current[post.postId]?.slidePrev(); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors"
                    >
                      ❮
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); swiperRefs.current[post.postId]?.slideNext(); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors"
                    >
                      ❯
                    </button>
                  </>
                )}
              </div>

              {/* 3. INSTAGRAM ACTION BUTTONS */}
              <div className="flex justify-between items-center pt-3 pb-2">
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-1">
                    <button
                    onClick={() => handleLike(post.postId)}
                    className="hover:scale-105 active:scale-90 transition-transform text-gray-900"
                  >
                    {isLiked ? <FavoriteIcon className="text-red-500" sx={{ fontSize: 26 }} /> : <FavoriteBorderIcon sx={{ fontSize: 26 }} />}
                  
                  </button>
                  <span>{likeCount.toLocaleString()}</span>
                  </div>
                  
                    <div className="flex items-center gap-1">
                      <button
                    onClick={() => setActivePost(post)}
                    className="hover:scale-105 active:scale-90 transition-transform text-gray-900"
                  >
                    <ChatBubbleOutlineIcon sx={{ fontSize: 24 }} />
                  </button>
                  <span >{commentCount}</span>
                    </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                    onClick={() => handleRepostClick(post.postId)}
                    className={`hover:scale-105 active:scale-90 transition-all ${userHasReposted ? 'text-[#783bf2]' : 'text-gray-900'}`}
                  >
                    <RepeatIcon sx={{ fontSize: 26 }} />
                  </button>
                  <span className={userHasReposted ? "text-[#783bf2] font-medium" : ""}>
                     {repostCount}
                  </span>
                  </div>
                  
                </div>

                <button onClick={() => toggleFavorite(post.postId)} className="text-gray-900">
                  {favorites.includes(post.postId) ? <BookmarkIcon sx={{ fontSize: 24 }} /> : <BookmarkBorderIcon sx={{ fontSize: 24 }} />}
                </button>
              </div>


              {/* 5. INSTAGRAM DESCRIPTION */}
              <div className="text-[13px] leading-4 text-gray-900 break-words">
                <span className="font-semibold mr-1.5">{post.userName}</span>
                <span className="text-gray-800 font-normal">{post.description}</span>
              </div>

            </div>
          );
        })}
      </div>

      {/* CONTROLLED REPOST / NOTE MODAL */}
      <RepostModal
        isOpen={repostModalTargetId !== null}
        currentText={repostModalTargetId !== null ? (repostTexts[repostModalTargetId] || "") : ""}
        isEditMode={repostModalTargetId !== null ? !!isReposted[repostModalTargetId] : false}
        onClose={() => setRepostModalTargetId(null)}
        onConfirm={handleConfirmRepost}
        onDelete={handleDeleteRepost}
      />

      {/* COMMENTS MODAL */}
      {activePost && (
        <CommentsModal
          post={activePost}
          onClose={() => setActivePost(null)}
          getCurrentIndex={getCurrentIndex}
          setPostIndex={setPostIndex}
          toggleMute={toggleMute}
          isMuted={isMuted}
        />
      )}

      {/* POST MENU MODAL */}
      {menuPost && (
        <PostMenuModal
          post={menuPost}
          isFollowing={isFollowing(menuPost.userId)}
          isFavorite={favorites.includes(menuPost.postId)}
          onClose={() => setMenuPost(null)}
          onFollowToggle={() => handleFollowToggle(menuPost.userId)}
          onFavoriteToggle={() => toggleFavorite(menuPost.postId)}
          onAbout={() => { setAboutPost(menuPost); setMenuPost(null); }}
        />
      )}

      {/* ABOUT ACCOUNT MODAL */}
      {aboutPost && (
        <AboutAccountModal post={aboutPost} onClose={() => setAboutPost(null)} />
      )}
    </>
  );
};

export default PostsSection;