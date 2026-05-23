"use client";

import React, { useState } from "react";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import SendIcon from "@mui/icons-material/Send";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import CloseIcon from "@mui/icons-material/Close";
import { Api, GetUserId } from "@/app/utils/token";
import {
  useAddCommentMutation,
  useGetFollowingPostsQuery,
  useGetPostsQuery,
  useLikePostMutation,
  useFavoritePostMutation,
  useGetUsersQuery,
} from "@/app/services/publication.home";

// ───────────────────── POST CAROUSEL ─────────────────────
const PostCarousel = ({ imagesStr, isModal = false }: { imagesStr: string | null | undefined; isModal?: boolean }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const images = React.useMemo(() => {
    if (!imagesStr) return [];
    if (Array.isArray(imagesStr)) {
      return imagesStr.filter(Boolean);
    }
    if (typeof imagesStr === "string") {
      return imagesStr.split(/[,;\s]+/).filter(Boolean);
    }
    return [String(imagesStr)];
  }, [imagesStr]);

  if (images.length === 0) {
    return (
      <img
        src="https://picsum.photos/500/500"
        className={`w-full h-full object-cover pointer-events-none ${isModal ? "object-contain" : ""}`}
        alt=""
      />
    );
  }

  return (
    <div className="relative w-full h-full group/carousel overflow-hidden bg-black flex items-center justify-center">
      <img
        src={`${Api}/images/${images[activeIndex]}`}
        className={`w-full h-full pointer-events-none transition-all duration-300 ${
          isModal ? "object-contain max-h-full" : "object-cover"
        }`}
        alt=""
      />

      {/* Carousel Left/Right navigation buttons */}
      {activeIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveIndex(activeIndex - 1);
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black shadow-md rounded-full p-1.5 transition duration-150 z-10 opacity-0 group-hover/carousel:opacity-100 cursor-pointer outline-none"
        >
          <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}
      {activeIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveIndex(activeIndex + 1);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black shadow-md rounded-full p-1.5 transition duration-150 z-10 opacity-0 group-hover/carousel:opacity-100 cursor-pointer outline-none"
        >
          <svg className="w-4 h-4 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/10 px-2 py-1 rounded-full backdrop-blur-[1px]">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                activeIndex === idx ? "bg-[#0095f6] scale-110" : "bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

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

  const [comments, setComments] = useState<any[]>(post.comments ?? []);

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

  const { data } = useGetUsersQuery();
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
        {/* IMAGE CAROUSEL */}
        <div className="hidden md:flex w-[55%] bg-black items-center justify-center border-r border-gray-100 relative">
          <PostCarousel imagesStr={post.images} isModal={true} />
        </div>

        {/* COMMENTS */}
        <div className="w-full md:w-[45%] flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
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
            {/* Post Description as first comment */}
            {post.description && (
              <div className="flex gap-2.5 items-start text-[14px] leading-[18px]">
                <span className="font-semibold text-gray-900 cursor-pointer hover:text-gray-500 flex-shrink-0">
                  {post.userName}:
                </span>
                <span className="text-gray-900 break-words">
                  {post.description}
                </span>
              </div>
            )}

            {/* User comments list */}
            {comments.length === 0 && !post.description ? (
              <div className="flex flex-col items-center justify-center flex-1 py-10">
                <p className="text-gray-900 text-[18px] font-bold mb-1">
                  No comments yet.
                </p>
                <p className="text-gray-500 text-[14px]">
                  Start the conversation.
                </p>
              </div>
            ) : (
              comments.map((c: any, i: number) => (
                <div
                  key={i}
                  className="flex gap-2.5 items-start text-[14px] leading-[18px]"
                >
                  <span className="font-semibold text-gray-900 cursor-pointer hover:text-gray-500 flex-shrink-0">
                    {users.find((el: any) => el.id === c.userId)?.userName ||
                      "User"}
                    :
                  </span>

                  <span className="text-gray-900 break-words">
                    {c.comment || c.text}
                  </span>
                </div>
              ))
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
  const userID = GetUserId();
  const [likePost] = useLikePostMutation();
  const [favoritePost] = useFavoritePostMutation();

  const [activePost, setActivePost] = useState<any>(null);

  // ✅ FAVORITES STATE (FIXED)
  const [favorites, setFavorites] = useState<number[]>([]);

  const { data: posts = [], isLoading } = useGetPostsQuery(undefined);

  // ✅ FAVORITE TOGGLE (FIXED)
  const toggleFavorite = async (postId: number) => {
    await favoritePost(postId);

    setFavorites((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
  };

   if (isLoading) {
     return (
       <div className="flex justify-center items-center h-[50vh] text-gray-400 text-sm tracking-wide">
         <div className="animate-pulse">Loading posts...</div>
       </div>
     );
   }

  return (
    <>
      <div className="w-full flex flex-col items-center pt-4 pb-20 px-4 select-none  min-h-screen">
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
                    src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>
                <span className="text-[14px] font-semibold text-gray-900 hover:text-gray-500 cursor-pointer transition-colors">
                  {post.userName}
                </span>
              </div>
              <button className="text-gray-900 hover:opacity-50 transition-opacity">
                <MoreHorizIcon className="text-[22px]" />
              </button>
            </div>

            {/* IMAGE CAROUSEL */}
            <div className="w-full rounded-sm overflow-hidden border border-gray-100 bg-black flex items-center justify-center aspect-square relative">
              <PostCarousel imagesStr={post.images} />
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

              {/* FAVORITE (FIXED) */}
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

      {/* MODAL */}
      {activePost && (
        <CommentsModal post={activePost} onClose={() => setActivePost(null)} />
      )}
    </>
  );
};

export default PostsSection;
