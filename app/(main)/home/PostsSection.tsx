"use client";

import React, { useEffect, useState } from "react";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import SendIcon from "@mui/icons-material/Send";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CloseIcon from "@mui/icons-material/Close";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";

import "swiper/css";
import "swiper/css/pagination";

import { Api, GetUserId } from "@/app/utils/token";

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

// ─── POST MENU MODAL ────────────────────────────────────────────────────────

const PostMenuModal = ({
  post,
  isFollowing,
  isFavorite,
  onClose,
  onFollowToggle,
  onFavoriteToggle,
  onAbout,
}: {
  post: any;
  isFollowing: boolean;
  isFavorite: boolean;
  onClose: () => void;
  onFollowToggle: () => void;
  onFavoriteToggle: () => void;
  onAbout: () => void;
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[400px] rounded-xl overflow-hidden mb-4 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Unfollow */}
        <button
          onClick={() => {
            onFollowToggle();
            onClose();
          }}
          className="w-full py-3.5 text-sm font-semibold text-red-500 border-b border-gray-100 hover:bg-gray-50 transition"
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </button>

        {/* Add to Favorites */}
        <button
          onClick={() => {
            onFavoriteToggle();
            onClose();
          }}
          className="w-full py-3.5 text-sm font-semibold text-gray-800 border-b border-gray-100 hover:bg-gray-50 transition"
        >
          {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        </button>

        {/* About account */}
        <button
          onClick={() => {
            onAbout();
            onClose();
          }}
          className="w-full py-3.5 text-sm font-semibold text-gray-800 border-b border-gray-100 hover:bg-gray-50 transition"
        >
          About account
        </button>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full py-3.5 text-sm text-gray-500 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// ─── ABOUT ACCOUNT MODAL ────────────────────────────────────────────────────

const AboutAccountModal = ({
  post,
  onClose,
}: {
  post: any;
  onClose: () => void;
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[360px] rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <span className="font-semibold text-sm">About this account</span>
          <button onClick={onClose}>
            <CloseIcon style={{ fontSize: 20 }} />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-3">
          <img
            src={
              post.userImage
                ? `${Api}/images/${post.userImage}`
                : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            }
            className="w-16 h-16 rounded-full object-cover"
            alt=""
          />
          <span className="font-semibold text-base">{post.userName}</span>
          {post.userEmail && (
            <span className="text-sm text-gray-500">{post.userEmail}</span>
          )}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── COMMENTS MODAL ─────────────────────────────────────────────────────────

const CommentsModal = ({
  post,
  onClose,
  getCurrentIndex,
  setPostIndex,
  toggleMute,
  isMuted,
}: {
  post: any;
  onClose: () => void;
  getCurrentIndex: (postId: number) => number;
  setPostIndex: (postId: number, index: number) => void;
  toggleMute: (postId: number) => void;
  isMuted: (postId: number) => boolean;
}) => {
  const [text, setText] = useState("");
  const [comments, setComments] = useState<any[]>(post.comments ?? []);
  const [likedComments, setLikedComments] = useState<number[]>([]);
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<Record<number, any[]>>({});

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
      [commentId]: [
        ...(prev[commentId] || []),
        { id: Date.now(), userName: "you", text: replyText },
      ],
    }));
    setReplyText("");
    setReplyingTo(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[1200px] h-[90vh] rounded-sm overflow-hidden flex relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MEDIA */}
        <div className="flex-1 bg-black relative">
          {post.images?.length > 1 && (
            <>
              <button
                onClick={() =>
                  setPostIndex(
                    post.postId,
                    getCurrentIndex(post.postId) === 0
                      ? post.images.length - 1
                      : getCurrentIndex(post.postId) - 1,
                  )
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 text-white w-7 h-7 rounded-full"
              >
                ❮
              </button>
              <button
                onClick={() =>
                  setPostIndex(
                    post.postId,
                    getCurrentIndex(post.postId) === post.images.length - 1
                      ? 0
                      : getCurrentIndex(post.postId) + 1,
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 text-white w-7 h-7 rounded-full"
              >
                ❯
              </button>
            </>
          )}

          <div className="w-full h-full">
            {post.images?.[getCurrentIndex(post.postId)]?.match(/\.(mp4|webm|ogg)$/i) ? (
              <video
                src={`${Api}/images/${post.images[getCurrentIndex(post.postId)]}`}
                className="w-full h-full object-cover"
                muted={isMuted(post.postId)}
                autoPlay
                loop
                playsInline
              />
            ) : (
              <img
                src={`${Api}/images/${post.images[getCurrentIndex(post.postId)]}`}
                className="w-full h-full object-cover"
                alt=""
              />
            )}
          </div>

          {post.images?.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {post.images.map((_: any, index: number) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full ${
                    getCurrentIndex(post.postId) === index ? "bg-white" : "bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}

          {post.images?.[getCurrentIndex(post.postId)]?.match(/\.(mp4|webm|ogg)$/i) && (
            <button
              onClick={() => toggleMute(post.postId)}
              className="absolute bottom-3 right-3 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              {isMuted(post.postId) ? (
                <VolumeOffIcon style={{ fontSize: 18 }} />
              ) : (
                <VolumeUpIcon style={{ fontSize: 18 }} />
              )}
            </button>
          )}
        </div>

        {/* COMMENTS PANEL */}
        <div className="w-[420px] flex flex-col bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <img
                src={
                  post.userImage
                    ? `${Api}/images/${post.userImage}`
                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                className="w-8 h-8 rounded-full object-cover"
                alt=""
              />
              <span className="font-semibold text-sm">{post.userName}</span>
            </div>
            <MoreHorizIcon />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {post.description && (
              <div className="text-sm">
                <span className="font-semibold mr-2">{post.userName}</span>
                {post.description}
              </div>
            )}

            {comments.map((c: any, i: number) => {
              const commentId = c.commentId || i;
              const user = users.find((el: any) => el.id === c.userId);
              const isLiked = likedComments.includes(commentId);

              return (
                <div key={commentId} className="flex gap-3 group">
                  <img
                    src={
                      user?.avatar
                        ? `${Api}/images/${user.avatar}`
                        : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    className="w-[32px] h-[32px] rounded-full object-cover"
                    alt=""
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-[14px] leading-[18px] break-words">
                          <span className="font-semibold mr-2">
                            {user?.userName || c.userName || "User"}
                          </span>
                          <span>{c.comment || c.text}</span>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-[12px] text-gray-500">
                          <span>{likesCount[commentId] || 0} likes</span>
                          <button
                            onClick={() =>
                              setReplyingTo(replyingTo === commentId ? null : commentId)
                            }
                            className="font-semibold hover:text-black transition"
                          >
                            Reply
                          </button>
                        </div>

                        {replyingTo === commentId && (
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Reply..."
                              className="flex-1 border-b border-gray-200 outline-none text-[13px] py-1 bg-transparent"
                            />
                            <button
                              onClick={() => submitReply(commentId)}
                              className="text-[#0095f6] font-semibold text-[13px]"
                            >
                              Post
                            </button>
                          </div>
                        )}

                        {replies[commentId]?.map((reply: any) => (
                          <div key={reply.id} className="flex gap-2 mt-4 ml-4">
                            <img
                              src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                              className="w-[24px] h-[24px] rounded-full object-cover"
                              alt=""
                            />
                            <div className="text-[13px] break-words">
                              <span className="font-semibold mr-2">{reply.userName}</span>
                              <span>{reply.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => toggleLikeComment(commentId)}
                        className="mt-1 hover:scale-110 transition"
                      >
                        {isLiked ? (
                          <FavoriteIcon sx={{ fontSize: 15 }} className="text-[#ed4956]" />
                        ) : (
                          <FavoriteBorderIcon sx={{ fontSize: 15 }} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t p-4 flex items-center gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 outline-none text-sm"
            />
            <button
              onClick={handleSubmit}
              className="text-[#0095f6] font-semibold text-sm"
            >
              Post
            </button>
          </div>
        </div>

        <button onClick={onClose} className="absolute top-4 right-4 text-white">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

// ─── POSTS SECTION ──────────────────────────────────────────────────────────

const PostsSection = () => {
  const userID: any = GetUserId();

  const [activePost, setActivePost] = useState<any>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [menuPost, setMenuPost] = useState<any>(null);
  const [aboutPost, setAboutPost] = useState<any>(null);
  const [currentIndexes, setCurrentIndexes] = useState<Record<number, number>>({});
  const [mutedPosts, setMutedPosts] = useState<Record<number, boolean>>({});

  const [likePost] = useLikePostMutation();
  const [favoritePost] = useFavoritePostMutation();
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useDeletellowUserMutation();

  const { data: posts = [], isLoading } = useGetFollowingPostsQuery(userID);
  const { data: subscriptionsData } = useGetSubscriptionsQuery(userID);
  const subscriptions = subscriptionsData?.data ?? [];

  const isFollowing = (userId: string) => {
    return subscriptions.some(
      (sub: any) =>
        sub.userShortInfo?.userId?.toLowerCase() === userId?.toLowerCase(),
    );
  };

  const handleFollowToggle = async (userId: string) => {
    if (isFollowing(userId)) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  useEffect(() => {
    if (posts.length > 0) {
      setFavorites(
        posts.filter((p: any) => p.postFavorite).map((p: any) => p.postId),
      );
    }
  }, [posts]);

  const toggleFavorite = async (postId: number) => {
    await favoritePost(postId);
    setFavorites((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId],
    );
  };

  const getCurrentIndex = (postId: number) => currentIndexes[postId] ?? 0;

  const setPostIndex = (postId: number, index: number) => {
    setCurrentIndexes((prev) => ({ ...prev, [postId]: index }));
  };

  const isMuted = (postId: number) => mutedPosts[postId] ?? true;

  const toggleMute = (postId: number) => {
    setMutedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">Loading...</div>
    );
  }

  return (
    <>
      <div className="w-full flex flex-col items-center pt-4 pb-20 px-4">
        {posts.map((post: any) => (
          <div
            key={post.postId}
            className="w-full max-w-[468px] mb-6 border-b border-gray-200 pb-5"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center gap-3">
                <img
                  src={
                    post.userImage
                      ? `${Api}/images/${post.userImage}`
                      : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  className="w-8 h-8 rounded-full object-cover"
                  alt=""
                />
                <span className="font-semibold text-sm">{post.userName}</span>
              </div>

              {/* THREE DOTS → open menu modal */}
              <button onClick={() => setMenuPost(post)}>
                <MoreHorizIcon />
              </button>
            </div>

            {/* MEDIA */}
            <div
              onClick={() => setActivePost(post)}
              className="relative aspect-square bg-black rounded-sm overflow-hidden cursor-pointer"
            >
              {post.images?.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPostIndex(
                        post.postId,
                        getCurrentIndex(post.postId) === 0
                          ? post.images.length - 1
                          : getCurrentIndex(post.postId) - 1,
                      );
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 text-white w-6 h-6 rounded-full"
                  >
                    ❮
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPostIndex(
                        post.postId,
                        getCurrentIndex(post.postId) === post.images.length - 1
                          ? 0
                          : getCurrentIndex(post.postId) + 1,
                      );
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 text-white w-6 h-6 rounded-full"
                  >
                    ❯
                  </button>
                </>
              )}

              {post.images?.[getCurrentIndex(post.postId)]?.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={`${Api}/images/${post.images[getCurrentIndex(post.postId)]}`}
                  className="w-full h-full object-cover"
                  muted={isMuted(post.postId)}
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={`${Api}/images/${post.images[getCurrentIndex(post.postId)]}`}
                  className="w-full h-full object-cover"
                  alt=""
                />
              )}

              {post.images?.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {post.images.map((_: any, index: number) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full ${
                        getCurrentIndex(post.postId) === index ? "bg-white" : "bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              )}

              {post.images?.[getCurrentIndex(post.postId)]?.match(/\.(mp4|webm|ogg)$/i) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute(post.postId);
                  }}
                  className="absolute bottom-3 right-3 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
                >
                  {isMuted(post.postId) ? (
                    <VolumeOffIcon style={{ fontSize: 18 }} />
                  ) : (
                    <VolumeUpIcon style={{ fontSize: 18 }} />
                  )}
                </button>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex justify-between items-center py-3">
              <div className="flex gap-4">
                <button onClick={() => likePost(post.postId)}>
                  {post.postLike ? (
                    <FavoriteIcon className="text-red-500" />
                  ) : (
                    <FavoriteBorderIcon />
                  )}
                </button>
                <button onClick={() => setActivePost(post)}>
                  <ChatBubbleOutlineIcon />
                </button>
                <button>
                  <SendIcon className="-rotate-12" />
                </button>
              </div>
              <button onClick={() => toggleFavorite(post.postId)}>
                {favorites.includes(post.postId) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </button>
            </div>

            {/* LIKES */}
            <p className="font-semibold text-sm">{post.postLikeCount || 0} likes</p>

            {/* DESCRIPTION */}
            <div className="text-sm mt-1">
              <span className="font-semibold mr-2">{post.userName}</span>
              {post.description}
            </div>
          </div>
        ))}
      </div>

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

      {/* POST MENU MODAL (three dots) */}
      {menuPost && (
        <PostMenuModal
          post={menuPost}
          isFollowing={isFollowing(menuPost.userId)}
          isFavorite={favorites.includes(menuPost.postId)}
          onClose={() => setMenuPost(null)}
          onFollowToggle={() => handleFollowToggle(menuPost.userId)}
          onFavoriteToggle={() => toggleFavorite(menuPost.postId)}
          onAbout={() => {
            setAboutPost(menuPost);
            setMenuPost(null);
          }}
        />
      )}

      {/* ABOUT ACCOUNT MODAL */}
      {aboutPost && (
        <AboutAccountModal
          post={aboutPost}
          onClose={() => setAboutPost(null)}
        />
      )}
    </>
  );
};

export default PostsSection;