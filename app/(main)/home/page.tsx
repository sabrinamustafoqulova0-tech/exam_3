"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  useGetStoriesQuery,
  useAddStoryMutation,
  useGetPostsQuery,
  useGetFollowingPostQuery,
  useLikePostMutation,
  useViewPostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddPostFavoriteMutation,
  useGetMyProfileQuery,
  useGetUserProfileByIdQuery,
} from "../../services/postApi";
import { useGetUsersQuery, useCreateChatMutation } from "../../services/chatApi";
import { useRouter } from "next/navigation";

// Material UI Icons
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import SendIcon from "@mui/icons-material/Send";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CloseIcon from "@mui/icons-material/Close";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const resolveImageUrl = (path: string | null | undefined) => {
  if (!path) {
    return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"; // Premium abstract placeholder
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `https://instagram-api.softclub.tj/images/${path}`;
};

function InlineCommentItem({ c, cIdx, profile, post, handleDeleteCommentSubmit }: any) {
  const { data: userProfile } = useGetUserProfileByIdQuery(c.userId, { skip: !c.userId });
  const cid = c.postCommentId || c.commentId || c.id;
  // Compare userId only - never compare names (breaks when fullName is shown)
  const isOwnId = profile && c.userId && profile.id &&
    String(c.userId).toLowerCase() === String(profile.id).toLowerCase();
  
  const authorName = userProfile?.fullName || c.userName || (isOwnId ? profile.userName : null) || post.userName || "user";
  const isOwnComment = !!(profile && isOwnId);

  return (
    <div className="text-xs text-gray-700 flex justify-between items-start group/comment">
      <div>
        <span className="font-bold text-gray-800 mr-1.5">@{authorName}</span>
        <span>{c.comment}</span>
      </div>
      {isOwnComment && (
        <button
          onClick={() => handleDeleteCommentSubmit(cid, post.postId || post.id)}
          className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
          title="Удалить"
        >
          <DeleteOutlinedIcon style={{ fontSize: 14 }} />
        </button>
      )}
    </div>
  );
}

export default function HomeFeedPage() {
  const router = useRouter();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: number]: string }>({});
  const [doubleClickedPostId, setDoubleClickedPostId] = useState<number | null>(null);
  const storyFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch queries
  const { data: profile } = useGetMyProfileQuery();
  const { data: stories = [], refetch: refetchStories } = useGetStoriesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  
  // Try fetching posts from users we follow first
  const {
    data: followingPosts = [],
    isLoading: isFollowingPostsLoading,
    refetch: refetchFollowing,
  } = useGetFollowingPostQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Fetch all posts as a rich fallback feed
  const {
    data: allPosts = [],
    isLoading: isAllPostsLoading,
    refetch: refetchAll,
  } = useGetPostsQuery({ PageSize: 15 }, {
    refetchOnMountOrArgChange: true,
  });

  // Recommended Users Sidebar
  const { data: users = [] } = useGetUsersQuery({ PageSize: 5 });

  // Mutations
  const [addStory, { isLoading: isUploadingStory }] = useAddStoryMutation();
  const [likePost] = useLikePostMutation();
  const [viewPost] = useViewPostMutation();
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [addPostFavorite] = useAddPostFavoriteMutation();
  const [createChat] = useCreateChatMutation();

  // Combine feeds: prefer followed user posts, otherwise fallback to all posts
  const posts = followingPosts.length > 0 ? followingPosts : allPosts;
  const isFeedLoading = followingPosts.length > 0 ? isFollowingPostsLoading : isAllPostsLoading;

  // Handle post card clicked (view details)
  const handlePostClick = async (postId: number) => {
    try {
      await viewPost(postId).unwrap();
    } catch (e) {
      console.warn("View registration error:", e);
    }
  };

  // Add Story trigger
  const handleAddStoryClick = () => {
    storyFileInputRef.current?.click();
  };

  const handleStoryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        await addStory({ imageFile: file }).unwrap();
        alert("Story uploaded successfully!");
        refetchStories();
      } catch (err) {
        console.error("Failed to add story:", err);
        alert("Failed to upload story.");
      }
    }
  };

  // Double Click Like animation triggers
  const handlePostImageDoubleClick = async (postId: number, isLiked: boolean) => {
    setDoubleClickedPostId(postId);
    setTimeout(() => setDoubleClickedPostId(null), 800);

    if (!isLiked) {
      try {
        await likePost(postId).unwrap();
        refetchFollowing();
        refetchAll();
      } catch (e) {
        console.error("Failed to double-tap like:", e);
      }
    }
  };

  // Like Trigger
  const handleLike = async (postId: number) => {
    try {
      await likePost(postId).unwrap();
      refetchFollowing();
      refetchAll();
    } catch (e) {
      console.error("Like toggle failed:", e);
    }
  };

  // Favorite Trigger
  const handleFavorite = async (postId: number) => {
    try {
      await addPostFavorite({ postId }).unwrap();
      refetchFollowing();
      refetchAll();
    } catch (e) {
      console.error("Favorite failed:", e);
    }
  };

  // Inline comment submission
  const handleAddCommentSubmit = async (e: React.FormEvent, postId: number) => {
    e.preventDefault();
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    try {
      await addComment({ comment: text, postId }).unwrap();
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      refetchFollowing();
      refetchAll();
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  const handleDeleteCommentSubmit = async (commentId: number, postId: number) => {
    if (confirm("Delete this comment?")) {
      try {
        await deleteComment({ commentId, postId }).unwrap();
        refetchFollowing();
        refetchAll();
      } catch (err) {
        console.error("Failed to delete comment:", err);
      }
    }
  };

  // Chat initiation with recommendation user
  const handleMessageUser = async (receiverId: string) => {
    try {
      await createChat(receiverId).unwrap();
      router.push("/messages");
    } catch (err) {
      console.error("Failed to initiate chat:", err);
      alert("Could not start conversation.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-6 px-4 md:px-8">
      {/* Container holding main timeline feed and suggestions sidebar */}
      <div className="w-full max-w-[900px] flex justify-center gap-8 lg:gap-16">
        
        {/* Left Side: Timeline feed (Width: 60% approx) */}
        <div className="w-full max-w-[470px] space-y-6">
          
          {/* 1. Stories Carousel Bar */}
          <div className="bg-white border border-gray-100 rounded-3xl p-4 flex gap-4 overflow-x-auto shadow-sm select-none scrollbar-none">
            {/* Add Story Button */}
            <div className="flex flex-col items-center flex-shrink-0 cursor-pointer" onClick={handleAddStoryClick}>
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center bg-gray-50">
                <img
                  src={resolveImageUrl(profile?.avatar)}
                  alt="My Profile"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <AddCircleIcon className="text-white text-xl" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 mt-1.5 truncate max-w-[70px]">
                Your Story
              </span>
              <input
                type="file"
                ref={storyFileInputRef}
                onChange={handleStoryFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Render stories list */}
            {stories.map((story: any, idx: number) => (
              <div 
                key={`story-${story.id || idx}`}
                onClick={() => setActiveStoryIndex(idx)}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer"
              >
                {/* Premium Instagram-style gradient circular border */}
                <div className="w-[68px] h-[68px] rounded-full p-[3px] bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-600 hover:scale-105 active:scale-95 transition-transform duration-200">
                  <div className="w-full h-full bg-white rounded-full p-[2px]">
                    <img
                      src={resolveImageUrl(story.fileName || story.userAvatar)}
                      alt={story.userName || "Story"}
                      className="w-full h-full rounded-full object-cover border"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-700 mt-1 truncate max-w-[70px]">
                  @{story.userName || "user"}
                </span>
              </div>
            ))}
          </div>

          {/* 2. Timeline Feed */}
          {isFeedLoading ? (
            // Skeleton Timeline
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm animate-pulse">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-full aspect-video bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="font-bold text-gray-800 text-lg mb-2">Welcome to your Feed!</h3>
              <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
                Your timeline is empty. Try posting an image yourself or search for users to follow.
              </p>
              <button 
                onClick={() => router.push("/expore")}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full shadow-md"
              >
                Go to Explore
              </button>
            </div>
          ) : (
            // Timeline Feed cards
            <div className="space-y-6">
              {posts.map((post: any, idx: number) => {
                const isLiked = post.isLiked ?? false;
                const likes = post.likesCount ?? post.postLikeCount ?? post.postLikes ?? 0;
                const views = post.viewsCount ?? post.postViewCount ?? post.postViews ?? 0;
                const postUrl = resolveImageUrl(post.image || post.imagePath || post.file || post.postImages);
                const uniqueKey = `feed-post-${post.postId || post.id || ""}-${idx}`;

                return (
                  <div 
                    key={uniqueKey}
                    onClick={() => handlePostClick(post.postId || post.id)}
                    className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                  >
                    {/* Card Header: Avatar & Username */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (post.userId) {
                          router.push(`/profile?userId=${post.userId}`);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveImageUrl(post.userImage || post.avatar)}
                          alt={post.userName}
                          className="w-10 h-10 rounded-full object-cover border"
                        />
                        <div>
                          <h4 className="font-extrabold text-gray-800 text-sm">
                            @{post.userName || "user"}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-medium">Original upload</p>
                        </div>
                      </div>
                      <button 
                        className="text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <MoreHorizIcon />
                      </button>
                    </div>

                    {/* Card Media Area with Double Click Trigger */}
                    <div 
                      className="relative w-full aspect-square md:aspect-video bg-black flex items-center justify-center overflow-hidden cursor-pointer"
                      onDoubleClick={() => handlePostImageDoubleClick(post.postId || post.id, isLiked)}
                    >
                      {(() => {
                        const images = post.images || [];
                        const singleRawPath = post.image || post.imagePath || post.file || post.postImages;
                        
                        if (images.length > 1) {
                          return (
                            <Swiper
                              modules={[Navigation, Pagination]}
                              navigation
                              pagination={{ clickable: true }}
                              style={{ width: "100%", height: "100%" }}
                            >
                              {images.map((img: string, idx: number) => {
                                const mediaSrc = resolveImageUrl(img);
                                const isVid = /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i.test(img.split("?")[0]);
                                return (
                                  <SwiperSlide key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    {isVid ? (
                                      <video src={mediaSrc || undefined} controls playsInline className="w-full h-full object-contain" />
                                    ) : (
                                      <img src={mediaSrc || undefined} alt="" className="w-full h-full object-contain" />
                                    )}
                                  </SwiperSlide>
                                );
                              })}
                            </Swiper>
                          );
                        }
                        
                        const mediaSrc = resolveImageUrl(singleRawPath);
                        const isVid = singleRawPath && /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i.test(singleRawPath.split("?")[0]);
                        
                        if (isVid) {
                          return (
                            <video src={mediaSrc || undefined} controls playsInline className="w-full h-full object-contain" />
                          );
                        }
                        
                        return (
                          <img
                            src={mediaSrc}
                            alt={post.title}
                            className="w-full h-full object-cover md:object-contain"
                          />
                        );
                      })()}
                      
                      {/* Heartbeat pulse overlay on Double Click */}
                      {doubleClickedPostId === (post.postId || post.id) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-all duration-300 pointer-events-none z-50">
                          <FavoriteIcon className="text-white text-8xl drop-shadow-xl animate-doubleClickHeart" />
                        </div>
                      )}
                    </div>

                    {/* Card Actions bar */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Like Toggle */}
                          <button 
                            onClick={() => handleLike(post.postId || post.id)}
                            className="text-gray-700 hover:text-red-500 transition-colors duration-200"
                          >
                            {isLiked ? (
                              <FavoriteIcon className="text-red-500 scale-110" />
                            ) : (
                              <FavoriteBorderIcon />
                            )}
                          </button>

                          {/* Comment Button (focus input trigger) */}
                          <button className="text-gray-700 hover:text-pink-500">
                            <ChatBubbleOutlinedIcon />
                          </button>
                        </div>

                        {/* Favorite Bookmark */}
                        <button 
                          onClick={() => handleFavorite(post.postId || post.id)}
                          className="text-gray-700 hover:text-yellow-500 transition-colors duration-200"
                        >
                          {post.isFavorite ? (
                            <StarIcon className="text-yellow-500 scale-110" />
                          ) : (
                            <StarBorderIcon />
                          )}
                        </button>
                      </div>

                      {/* Stat counters */}
                      <div className="flex items-center gap-4 text-xs font-bold text-gray-700">
                        <span>{likes} likes</span>
                        <span className="text-gray-400">•</span>
                        <span>{views} views</span>
                      </div>

                      {/* Title & Description Caption */}
                      <div className="text-sm">
                        <span className="font-extrabold text-gray-800 mr-2">
                          @{post.userName || "user"}
                        </span>
                        <span className="font-bold text-gray-800 block mt-0.5">{post.title}</span>
                        <p className="text-gray-600 mt-1 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                      </div>

                      {/* Inline Comments previews */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="pt-2 space-y-1.5 border-t border-gray-50">
                          {post.comments.slice(-2).map((c: any, cIdx: number) => (
                            <InlineCommentItem
                              key={`inline-comment-${c.postCommentId || c.commentId || c.id || cIdx}`}
                              c={c}
                              cIdx={cIdx}
                              profile={profile}
                              post={post}
                              handleDeleteCommentSubmit={handleDeleteCommentSubmit}
                            />
                          ))}
                          {post.comments.length > 2 && (
                            <span 
                              onClick={() => handlePostClick(post.postId || post.id)}
                              className="text-[11px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 cursor-pointer block mt-1"
                            >
                              View all {post.comments.length} comments
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Direct comment input */}
                    <form 
                      onSubmit={(e) => handleAddCommentSubmit(e, post.postId || post.id)}
                      className="border-t border-gray-100 px-4 py-3 flex gap-2 items-center bg-gray-50/20"
                    >
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentInputs[post.postId || post.id] || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCommentInputs((prev) => ({ ...prev, [post.postId || post.id]: val }));
                        }}
                        className="flex-1 px-4 py-2 bg-transparent text-xs outline-none"
                      />
                      <button 
                        type="submit"
                        disabled={!(commentInputs[post.postId || post.id]?.trim())}
                        className="p-1.5 bg-pink-500 disabled:opacity-40 text-white rounded-full text-xs shadow-md active:scale-95 transition-all"
                      >
                        <SendIcon className="text-[10px] transform rotate-[-30deg]" />
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Desktop suggestions sidebar (Width: 40% approx) */}
        <div className="hidden md:block w-2/5 max-w-[300px] flex-shrink-0 space-y-6">
          {/* Current User Card */}
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <img
                src={resolveImageUrl(profile?.avatar)}
                alt="Me"
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
              />
              <div className="min-w-0">
                <h4 className="font-extrabold text-gray-800 text-sm truncate">
                  @{profile?.userName || "user"}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {profile?.fullName || "Instagram User"}
                </p>
              </div>
            </div>
            <button 
              onClick={() => router.push("/profile")}
              className="text-[11px] font-bold text-pink-600 hover:text-pink-700"
            >
              Switch
            </button>
          </div>

          {/* Suggestions header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-gray-400">Suggestions for you</span>
              <span className="text-xs font-bold text-gray-700 cursor-pointer">See All</span>
            </div>

            {/* Suggested users list */}
            <div className="space-y-3">
              {users.slice(0, 5).map((user: any, uIdx: number) => {
                if (profile && user.id === profile.id) return null; // Skip self

                return (
                  <div key={`sug-user-${user.id || uIdx}`} className="flex items-center justify-between p-2 bg-white rounded-2xl border border-gray-50 shadow-sm hover:shadow transition-shadow">
                    <div 
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                      onClick={() => router.push(`/profile?userId=${user.id}`)}
                    >
                      <img
                        src={resolveImageUrl(user.avatar)}
                        alt={user.userName}
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                      <div className="min-w-0">
                        <h5 className="font-extrabold text-gray-800 text-xs truncate">
                          @{user.userName || "user"}
                        </h5>
                        <p className="text-[10px] text-gray-400 truncate">Suggested follow</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleMessageUser(user.id)}
                      className="text-[10px] font-bold text-blue-500 hover:text-blue-600"
                    >
                      Message
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Full screen Story Viewer modal */}
      {activeStoryIndex !== null && stories[activeStoryIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-fadeIn">
          {/* Close button */}
          <button 
            onClick={() => setActiveStoryIndex(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
          >
            <CloseIcon />
          </button>

          {/* Active Story Box */}
          <div className="relative w-full max-w-md aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-4">
            
            {/* Story Header (User Info) */}
            <div 
              className="flex items-center gap-3 z-10 cursor-pointer hover:opacity-90"
              onClick={() => {
                const storyUser = stories[activeStoryIndex];
                if (storyUser && storyUser.userId) {
                  setActiveStoryIndex(null);
                  router.push(`/profile?userId=${storyUser.userId}`);
                }
              }}
            >
              <img
                src={resolveImageUrl(stories[activeStoryIndex].userAvatar)}
                alt="avatar"
                className="w-9 h-9 rounded-full border-2 border-white object-cover"
              />
              <div>
                <h5 className="text-white font-bold text-xs">@{stories[activeStoryIndex].userName}</h5>
                <span className="text-[9px] text-gray-300">{new Date(stories[activeStoryIndex].createAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Story Image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={resolveImageUrl(stories[activeStoryIndex].fileName)}
                alt="Story media"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Story Controls footer */}
            <div className="flex items-center justify-between z-10 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-xl">
              <button 
                onClick={() => {
                  if (activeStoryIndex > 0) {
                    setActiveStoryIndex(activeStoryIndex - 1);
                  }
                }}
                disabled={activeStoryIndex === 0}
                className="text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg disabled:opacity-40"
              >
                Prev
              </button>
              <button 
                onClick={() => {
                  if (activeStoryIndex < stories.length - 1) {
                    setActiveStoryIndex(activeStoryIndex + 1);
                  } else {
                    setActiveStoryIndex(null); // End story
                  }
                }}
                className="text-white text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double click heart pulse styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes doubleClickHeart {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); opacity: 0.9; }
          75% { transform: scale(0.9); opacity: 0.9; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        .animate-doubleClickHeart {
          animation: doubleClickHeart 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />
    </div>
  );
}
