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
import { Api, GetUserId } from "@/app/utils/token";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationPinIcon from '@mui/icons-material/LocationPin';
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

// ───────────────────── COMMENTS MODAL ─────────────────────
const CommentsModal = ({
  post,
  onClose,
}: {
  post: any;
  onClose: () => void;
}) => {
  const [text, setText] = useState("");
  const [addComment] = useAddCommentMutation();
  const [likedComments, setLikedComments] = useState<number[]>([]);
  const [likesCount, setLikesCount] = useState<Record<number, number>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState<Record<number, any[]>>({});
  const [comments, setComments] = useState<any[]>(post.comments ?? []);

  const toggleLikeComment = (id: number) => {
    const isLiked = likedComments.includes(id);
    if (isLiked) {
      setLikedComments((prev) => prev.filter((x) => x !== id));
      setLikesCount((prev) => ({
        ...prev,
        [id]: Math.max((prev[id] || 1) - 1, 0),
      }));
    } else {
      setLikedComments((prev) => [...prev, id]);
      setLikesCount((prev) => ({
        ...prev,
        [id]: (prev[id] || 0) + 1,
      }));
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

  const handleSubmit = async () => {
      if (!text.trim()) return;
        await addComment({ postId: post.postId, text });
    setComments((prev) => [
      ...prev,
      {
        userName: "You",
        comment: text,
        dateCommented: new Date().toISOString(),
      },
      ]);
    setText("");
  };

  const { data } = useGetUsersQuery(undefined);
  const users = data?.data || [];

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 md:p-10 select-none backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[85vw] xl:max-w-[1200px] h-[90vh] rounded-sm flex overflow-hidden relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* IMAGE */}
        <div className="hidden md:flex w-[55%] bg-black items-center justify-center border-r border-gray-100">
          <img
            src={`${Api}/images/${post.images}`}
            className="w-full h-full object-contain max-h-full"
            alt=""
          />
        </div>

        {/* COMMENTS */}
        <div className="w-full md:w-[45%] flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={
                    post.userImage
                      ? `${Api}/images/${post.userImage}`
                      : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              <span className="font-semibold text-[14px] text-gray-900 cursor-pointer hover:text-gray-500 transition-colors">
                {post.userName}
              </span>
            </div>
            <button className="text-gray-900 hover:opacity-50 transition-opacity">
              <MoreHorizIcon className="text-[20px]" />
            </button>
          </div>

          {/* Comments List */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3.5 select-text
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-thumb]:bg-gray-200
            [&::-webkit-scrollbar-thumb]:rounded-full"
            >
            {post.description && (
              <div className="flex gap-2.5 items-start text-[14px] leading-[18px]">
                <span className="font-semibold text-gray-900 cursor-pointer hover:text-gray-500 flex-shrink-0">
                  {post.userName}:
                </span>
                <span className="text-gray-900 break-words">{post.description}</span>
              </div>
            )}

            {comments.length === 0 && !post.description ? (
              <div className="flex flex-col items-center justify-center flex-1 py-10">
                <p className="text-gray-900 text-[18px] font-bold mb-1">No comments yet.</p>
                <p className="text-gray-500 text-[14px]">Start the conversation.</p>
              </div>
            ) : (
              comments.map((c: any, i: number) => {
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
                          <div className="text-[14px] leading-[18px]">
                            <span className="font-semibold mr-2">{user?.userName || "User"}</span>
                            <span>{c.comment || c.text}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-[12px] text-gray-500">
                            <span>{likesCount[commentId] || 0} likes</span>
                            <button
                              onClick={() =>
                                setReplyingTo(replyingTo === commentId ? null : commentId)
                              }
                              className="font-semibold hover:text-black"
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
                                className="flex-1 border-b border-gray-200 outline-none text-[13px] py-1"
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
                            <div key={reply.id} className="flex gap-2 mt-4 ml-3">
                              <img
                                src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                className="w-[24px] h-[24px] rounded-full"
                                alt=""
                              />
                              <div className="text-[13px]">
                                <span className="font-semibold mr-2">{reply.userName}</span>
                                <span>{reply.text}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => toggleLikeComment(commentId)} className="mt-1">
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
              })
            )}
          </div>

          {/* Comment Input Footer */}
          <div className="border-t border-gray-100 px-4 py-3.5 flex items-center gap-3 bg-white">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 outline-none text-[14px] text-gray-900 placeholder:text-gray-400 bg-transparent"
              placeholder="Add a comment..."
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="text-[#0095f6] hover:text-[#00376b] font-semibold text-[14px] disabled:opacity-30 transition-colors duration-150"
            >
              Post
            </button>
          </div>
        </div>

        {/* External Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:fixed md:top-5 md:right-5 text-white/80 hover:text-white transition-colors duration-200 z-50"
        >
          <CloseIcon className="text-[28px] md:text-[32px]" />
        </button>
      </div>
    </div>
  );
};

// ───────────────────── POSTS SECTION ─────────────────────
const PostsSection = () => {
  const userID:any = GetUserId();
  const [likePost] = useLikePostMutation();
  const [favoritePost] = useFavoritePostMutation();
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useDeletellowUserMutation();

  const [activePost, setActivePost] = useState<any>(null);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [aboutPost, setAboutPost] = useState<any>(null);
  const [favorites, setFavorites] = useState<number[]>([]);

  const { data: posts = [], isLoading } = useGetFollowingPostsQuery(userID);
  const { data: subscriptionsData } = useGetSubscriptionsQuery(userID);

  const subscriptions = subscriptionsData?.data ?? [];

 const isFollowing = (userId: string) => {
  if (!Array.isArray(subscriptions)) return false;
  const targetId = String(userId).toLowerCase().trim();
  return subscriptions.some((sub: any) => {
    const subUserId = String(sub.userShortInfo?.userId ?? "").toLowerCase().trim();
    return subUserId === targetId;
  });
};

  const handleFollowToggle = async (userId: string) => {
    try {
      if (isFollowing(userId)) {
        await unfollowUser(userId).unwrap();
      } else {
        await followUser(userId).unwrap();
      }
    } catch (error) {
      console.error("Follow toggle error:", error);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-gray-400 text-sm tracking-wide">
        <div className="animate-pulse">Loading posts...</div>
      </div>
    );
  }
console.log(subscriptionsData,"oooo", userID,"pppp")
  return (
    <>
      <div className="w-full flex flex-col items-center pt-4 pb-20 px-4 select-none min-h-screen">
        {posts.map((post: any) => (
          <div
            key={post.postId}
            className="w-full max-w-[468px] border-b border-gray-200 mb-4 pb-5 bg-white"
          >
            {/* HEADER */}
            <div className="flex justify-between items-center py-2.5 px-0.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer">
                  <img
                    src={
                      post.userImage
                        ? `${Api}/images/${post.userImage}`
                        : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
                <span className="text-[14px] font-semibold text-gray-900 hover:text-gray-500 cursor-pointer transition-colors">
                  {post.userName}
                </span>
              </div>
              <button
                onClick={() => setMenuPostId(post.postId)}
                className="text-gray-900 hover:opacity-50 transition-opacity"
              >
                <MoreHorizIcon className="text-[22px]" />
              </button>
            </div>

            {/* IMAGE */}
            <div className="w-full rounded-sm overflow-hidden border border-gray-100 bg-black flex items-center justify-center aspect-square">
              <img
                src={
                  post.images
                    ? `${Api}/images/${post.images}`
                    : "https://picsum.photos/500/500"
                }
                className="w-full h-full object-cover pointer-events-none"
                alt=""
              />
            </div>

            {/* ACTIONS */}
            <div className="flex justify-between items-center py-3 px-0.5">
              <div className="flex gap-4 items-center">
                {/* LIKE */}
                <button
                  onClick={() => likePost(post.postId)}
                  className="hover:opacity-60 active:scale-90 transition-all text-gray-900 outline-none"
                >
                  {post.postLike ? (
                    <FavoriteIcon className="text-[#ff3040] text-[26px]" />
                  ) : (
                    <FavoriteBorderIcon className="text-[26px]" />
                  )}
                </button>

                {/* COMMENT */}
                <button
                  onClick={() => setActivePost(post)}
                  className="hover:opacity-60 active:scale-90 transition-all text-gray-900 outline-none"
                >
                  <ChatBubbleOutlineIcon className="text-[24px]" />
                </button>

                {/* SHARE */}
                <button className="hover:opacity-60 active:scale-90 transition-all text-gray-900 outline-none">
                  <SendIcon className="text-[23px] -rotate-12 -translate-y-[2px]" />
                </button>
              </div>

              {/* FAVORITE */}
              <button
                onClick={() => toggleFavorite(post.postId)}
                className="hover:opacity-60 active:scale-90 transition-all text-gray-900 outline-none"
              >
                {favorites.includes(post.postId) ? (
                  <BookmarkIcon className="text-[26px] text-gray-900" />
                ) : (
                  <BookmarkBorderIcon className="text-[26px]" />
                )}
              </button>
            </div>

            {/* LIKES COUNT */}
            <div className="px-0.5">
              <p className="text-[14px] font-semibold text-gray-900 tracking-wide">
                {post.postLikeCount || 0} likes
              </p>
            </div>

            {/* DESCRIPTION */}
            <div className="px-0.5 mt-1.5 text-[14px] leading-[18px] text-gray-900 select-text">
              <span className="font-semibold mr-2 hover:text-gray-500 cursor-pointer">
                {post.userName}
              </span>
              <span className="break-words">{post.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* COMMENTS MODAL */}
      {activePost && (
        <CommentsModal post={activePost} onClose={() => setActivePost(null)} />
      )}

      {/* MENU MODAL */}
      {menuPostId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setMenuPostId(null)}
        >
          <div
            className="w-full max-w-[468px] bg-white rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Unfollow */}
            {/* Unfollow / Follow — только если не свой пост */}
{posts.find((p: any) => p.postId === menuPostId)?.userId !== userID &&
  isFollowing(posts.find((p: any) => p.postId === menuPostId)?.userId) && (
  <button
    onClick={async () => {
      const post = posts.find((p: any) => p.postId === menuPostId);
      if (post?.userId) await handleFollowToggle(post.userId);
      setMenuPostId(null);
    }}
    className="w-full py-4 text-[#ed4956] font-semibold text-[14px] border-b border-gray-100"
  >
    Unfollow
  </button>
)}

            {/* Add to favorites */}
            <button
              onClick={() => {
                const post = posts.find((p: any) => p.postId === menuPostId);
                if (post) toggleFavorite(post.postId);
                setMenuPostId(null);
              }}
              className="w-full py-4 text-[14px] border-b border-gray-100 text-gray-900"
            >
              {favorites.includes(menuPostId) ? "Remove from favorites" : "Add to favorites"}
            </button>

            {/* About this account */}
            <button
              onClick={() => {
                const post = posts.find((p: any) => p.postId === menuPostId);
                setAboutPost(post);
                setMenuPostId(null);
              }}
              className="w-full py-4 text-[14px] border-b border-gray-100 text-gray-900"
            >
              About this account
            </button>

            {/* Cancel */}
            <button
              onClick={() => setMenuPostId(null)}
              className="w-full py-4 text-[14px] text-gray-900 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ABOUT THIS ACCOUNT MODAL */}
      {aboutPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setAboutPost(null)}
        >
          <div
            className="bg-white w-full max-w-[380px] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-[16px] font-bold text-gray-900">About this account</h2>
              <button
                onClick={() => setAboutPost(null)}
                className="text-gray-400 hover:text-gray-900 transition-colors"
              >
                <CloseIcon className="text-[22px]" />
              </button>
            </div>

            {/* Avatar + name */}
            <div className="flex flex-col items-center pt-8 pb-6 px-6 gap-3">
              <div className="w-[90px] h-[90px] rounded-full overflow-hidden border-2 border-gray-200 shadow-md">
                <img
                  src={
                    aboutPost.userImage
                      ? `${Api}/images/${aboutPost.userImage}`
                      : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              <p className="text-[18px] font-bold text-gray-900">{aboutPost.userName}</p>
            </div>

            {/* Info rows */}
            <div className="px-6 pb-6 flex flex-col gap-4 border-t border-gray-100 pt-5">
              {/* Date joined */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-[18px]">
                  <CalendarMonthIcon/>
                </div>
                <div>
                  <p className="text-[13px] text-gray-400">Date joined</p>
                  <p className="text-[14px] font-semibold text-gray-900">
                    {aboutPost.datePublished
                      ? new Date(aboutPost.datePublished).toLocaleDateString([], {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "Unknown"}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-[18px]">
                  <LocationPinIcon/>
                </div>
                <div>
                  <p className="text-[13px] text-gray-400">Location</p>
                  <p className="text-[14px] font-semibold text-gray-900">
                    {aboutPost.location || "Tajikistan"}
                  </p>
                </div>
              </div>
            </div>

            {/* Close button */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setAboutPost(null)}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-900 font-semibold text-[14px] hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostsSection;