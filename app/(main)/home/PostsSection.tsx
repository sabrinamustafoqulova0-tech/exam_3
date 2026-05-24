"use client";

import React, { useEffect, useState } from "react";
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
import NewMessageModal from "@/app/components/NewMessageModal";

import "swiper/css";
import "swiper/css/pagination";

import { Api, GetUserId, MyAxios } from "@/app/utils/token";

import {
  useAddCommentMutation,
  useGetFollowingPostsQuery,
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
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const myUserId = GetUserId();

  const [addComment] = useAddCommentMutation();
  const { data } = useGetUsersQuery(undefined);
  const users = data?.data || [];

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await addComment({ postId: post.postId, text });
    setComments((prev) => [...prev, { userName: "You", comment: text }]);
    setText("");
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

  const submitReply = (commentId: number) => {
    if (!replyText.trim()) return;
    setReplies((prev) => ({
      ...prev,
      [commentId]: [...(prev[commentId] || []), { id: Date.now(), userName: "you", text: replyText }],
    }));
    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-[1200px] h-[90vh] rounded-sm overflow-hidden flex relative" onClick={(e) => e.stopPropagation()}>
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

        <div className="w-[420px] flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <img src={post.userImage ? `${Api}/images/${post.userImage}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="w-8 h-8 rounded-full object-cover" alt="" />
              <span className="font-semibold text-sm">{post.userName}</span>
            </div>
            <MoreHorizIcon />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {post.description && (
              <div className="text-sm"><span className="font-semibold mr-2">{post.userName}</span>{post.description}</div>
            )}
            {comments.map((c: any, i: number) => {
              const commentId = c.commentId || i;
              const user = users.find((el: any) => el.id === c.userId);
              const isOwnComment = (c.userId && myUserId && String(c.userId) === String(myUserId)) ||
                                   (c.authorId && myUserId && String(c.authorId) === String(myUserId)) ||
                                   c.userName === "You" ||
                                   c.userName === "you";
              return (
                <div key={commentId} className="flex gap-3 group">
                  <img src={user?.avatar ? `${Api}/images/${user.avatar}` : "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="w-[32px] h-[32px] rounded-full object-cover" alt="" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-[14px] leading-[18px] break-words"><span className="font-semibold mr-2">{user?.userName || c.userName || "User"}</span>{c.comment || c.text}</div>
                      </div>
                      {isOwnComment && (
                        <button
                          onClick={() => setDeleteCommentId(commentId)}
                          className="text-gray-400 hover:text-gray-600 transition p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <MoreHorizIcon sx={{ fontSize: 18 }} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delete Comment Confirmation Bottom Sheet / Modal */}
      {deleteCommentId !== null && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setDeleteCommentId(null)}
        >
          <div 
            className="bg-white w-full max-w-[320px] rounded-2xl overflow-hidden shadow-2xl border border-gray-100/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <button
                onClick={async () => {
                  if (deleteCommentId !== null) {
                    try {
                      // Call DELETE API
                      await MyAxios.delete(`/Post/delete-comment?commentId=${deleteCommentId}`);
                      // Remove from local list
                      setComments(prev => prev.filter((item, idx) => {
                        const id = item.commentId || idx;
                        return id !== deleteCommentId;
                      }));
                    } catch (err) {
                      console.error("Failed to delete comment:", err);
                    } finally {
                      setDeleteCommentId(null);
                    }
                  }
                }}
                className="w-full py-4 text-sm font-bold text-red-500 hover:bg-red-50 active:bg-red-100 transition text-center border-b border-gray-100 cursor-pointer"
              >
                Удалить
              </button>
              <button
                onClick={() => setDeleteCommentId(null)}
                className="w-full py-4 text-sm font-normal text-black hover:bg-gray-50 active:bg-gray-100 transition text-center cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
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

  // Лайки
  const [localLikes, setLocalLikes] = useState<Record<number, boolean>>({});
  const [localLikeCounts, setLocalLikeCounts] = useState<Record<number, number>>({});

  const [sharePostId, setSharePostId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

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

              {/* 2. INSTAGRAM MEDIA FEED WITH ABSOLUTE POSITIONING NOTES */}
              <div
                onClick={() => setActivePost(post)}
                className="relative aspect-square bg-gray-50 border border-gray-100 rounded-[4px] overflow-hidden cursor-pointer"
              >
                {/* ИКОНКА ЗАМЕТКИ РЕПОСТА — СТРОГО ВНУТРИ КАРТИНКИ СЛЕВА ВНИЗУ */}
                {userHasReposted && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation(); // Чтобы не открывались комментарии
                      handleRepostClick(post.postId); // Редактирование при клике на баббл
                    }}
                    className="absolute bottom-4 left-4 z-20 flex flex-col items-start cursor-pointer group active:scale-95 transition-transform"
                  >
                    {/* Текстовое облачко */}
                    <div className="bg-white/95 backdrop-blur-xs text-gray-800 text-[12px] font-normal px-3 py-1.5 rounded-2xl shadow-lg max-w-[140px] break-words relative mb-1.5 border border-gray-100/50 text-center flex items-center justify-center min-w-[60px]">
                      {currentRepostText}
                      {/* Хвостик облачка */}
                      <div className="absolute top-full left-4 w-0 h-0 border-[5px] border-transparent border-t-white/95" />
                    </div>

                    {/* Аватарка с фиолетовым значком репоста */}
                    <div className="relative ml-1">
                      <img
                        src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        className="w-[32px] h-[32px] rounded-full border-2 border-white object-cover shadow-md"
                        alt="User profile"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 bg-[#783bf2] text-white rounded-full w-4 h-4 flex items-center justify-center p-0.5 shadow-md">
                        <AutorenewIcon style={{ fontSize: 10 }} />
                      </div>
                    </div>
                  </div>
                )}

                {post.images?.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPostIndex(post.postId, getCurrentIndex(post.postId) === 0 ? post.images.length - 1 : getCurrentIndex(post.postId) - 1); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    >❮</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPostIndex(post.postId, getCurrentIndex(post.postId) === post.images.length - 1 ? 0 : getCurrentIndex(post.postId) + 1); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    >❯</button>
                  </>
                )}

                {post.images?.[getCurrentIndex(post.postId)]?.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    src={`${Api}/images/${post.images[getCurrentIndex(post.postId)]}`}
                    className="w-full h-full object-cover"
                    muted={isMuted(post.postId)}
                    autoPlay loop playsInline
                  />
                ) : (
                  <img
                    src={`${Api}/images/${post.images[getCurrentIndex(post.postId)]}`}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                )}

                {post.images?.[getCurrentIndex(post.postId)]?.match(/\.(mp4|webm|ogg)$/i) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleMute(post.postId); }}
                    className="absolute bottom-3 right-3 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center"
                  >
                    {isMuted(post.postId) ? <VolumeOffIcon style={{ fontSize: 15 }} /> : <VolumeUpIcon style={{ fontSize: 15 }} />}
                  </button>
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

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setSharePostId(post.postId)}
                      className="hover:scale-105 active:scale-90 transition-all text-gray-900"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[26px] h-[26px]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                      </svg>
                    </button>
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

      {/* SHARE MODAL */}
      <NewMessageModal
        isOpen={sharePostId !== null}
        onClose={() => setSharePostId(null)}
        postId={sharePostId || undefined}
        postUrl={sharePostId ? `${window.location.origin}/post/${sharePostId}` : undefined}
        onSent={(msg) => {
          setToast({ show: true, message: msg });
          setTimeout(() => setToast({ show: false, message: "" }), 2000);
        }}
      />

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/85 backdrop-blur-md text-white px-6 py-3 rounded-2xl flex items-center gap-2 border border-white/10 shadow-2xl transition-all duration-300 pointer-events-none">
          <span className="text-emerald-400 font-bold">✓</span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </>
  );
};

export default PostsSection;