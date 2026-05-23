"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useGetMyProfileQuery,
  useGetUserProfileByIdQuery,
  useGetMyPostsQuery,
  useGetPostsQuery,
  useGetPostFavoritesQuery,
  useUpdateUserImageProfileMutation,
  useUpdateUserProfileMutation,
  useDeletePostMutation,
  useGetPostByIdQuery,
  useLikePostMutation,
  useViewPostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddPostFavoriteMutation,
} from "../../services/postApi";
import { useCreateChatMutation } from "../../services/chatApi";
import { GetToken } from "../../utils/token";

// Material UI Icons
import GridOnIcon from "@mui/icons-material/GridOn";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import SettingsIcon from "@mui/icons-material/Settings";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";

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

// JWT Helper to decode logged-in user info
const getMyJwtInfo = () => {
  if (typeof window === "undefined") return null;
  const token = GetToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    const userId =
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ||
      payload.nameid ||
      payload.sub ||
      payload.id;
    const userName =
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      payload.unique_name ||
      payload.name ||
      payload.userName;
    return { userId, userName };
  } catch (e) {
    console.error("Failed to decode token", e);
    return null;
  }
};

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");

  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [myInfo, setMyInfo] = useState<{ userId: string; userName: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Set current user details on client side
  useEffect(() => {
    setMyInfo(getMyJwtInfo());
  }, []);

  const isOwnProfile = !userIdParam || (myInfo && String(userIdParam) === String(myInfo.userId));

  // Fetch queries
  const { data: myProfile, isLoading: isMyProfileLoading, refetch: refetchMyProfile } = useGetMyProfileQuery(undefined, {
    skip: !isOwnProfile,
    refetchOnMountOrArgChange: true,
  });

  const { data: otherProfile, isLoading: isOtherProfileLoading, refetch: refetchOtherProfile } = useGetUserProfileByIdQuery(userIdParam ?? "", {
    skip: isOwnProfile || !userIdParam,
    refetchOnMountOrArgChange: true,
  });

  const profile = isOwnProfile ? myProfile : otherProfile;
  const isProfileLoading = isOwnProfile ? isMyProfileLoading : isOtherProfileLoading;
  const refetchProfile = isOwnProfile ? refetchMyProfile : refetchOtherProfile;

  const { data: myPosts = [], isLoading: isMyPostsLoading, refetch: refetchMyPosts } = useGetMyPostsQuery(undefined, {
    skip: !isOwnProfile,
    refetchOnMountOrArgChange: true,
  });

  const { data: otherPosts = [], isLoading: isOtherPostsLoading, refetch: refetchOtherPosts } = useGetPostsQuery(
    userIdParam ? { UserId: userIdParam } : undefined,
    {
      skip: isOwnProfile || !userIdParam,
      refetchOnMountOrArgChange: true,
    }
  );

  const posts = isOwnProfile ? myPosts : otherPosts;
  const isPostsLoading = isOwnProfile ? isMyPostsLoading : isOtherPostsLoading;
  const refetchPosts = isOwnProfile ? refetchMyPosts : refetchOtherPosts;

  const { data: savedPosts = [], isLoading: isSavedLoading, refetch: refetchSavedPosts } = useGetPostFavoritesQuery(undefined, {
    skip: !isOwnProfile,
    refetchOnMountOrArgChange: true,
  });

  // Modal detailed post query
  const { data: postDetails, isLoading: isDetailsLoading, error: detailsError } = useGetPostByIdQuery(selectedPostId ?? 0, {
    skip: selectedPostId === null,
  });

  // Mutations
  const [updateUserImage, { isLoading: isUploadingAvatar }] = useUpdateUserImageProfileMutation();
  const [updateUserProfile, { isLoading: isUpdatingProfile }] = useUpdateUserProfileMutation();
  const [deletePost] = useDeletePostMutation();

  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [viewPost] = useViewPostMutation();
  const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [addPostFavorite, { isLoading: isFavoriting }] = useAddPostFavoriteMutation();
  const [createChat, { isLoading: isCreatingChat }] = useCreateChatMutation();

  const handleMessageUser = async () => {
    if (!profile?.id) return;
    try {
      const newChatId = await createChat(profile.id).unwrap();
      router.push(`/messages?chatId=${newChatId}`);
    } catch (err) {
      console.error("Failed to create direct message chat:", err);
      alert("Failed to initiate message thread.");
    }
  };

  // Scroll to comments end
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [postDetails?.comments]);

  // Sync bio input state when profile loads
  useEffect(() => {
    if (profile?.about) {
      setBioInput(profile.about);
    }
  }, [profile]);

  // Handle post card click
  const handlePostClick = async (postId: number) => {
    setSelectedPostId(postId);
    try {
      await viewPost(postId).unwrap();
    } catch (e) {
      console.warn("Failed to register view:", e);
    }
  };

  // Profile picture upload
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        await updateUserImage(file).unwrap();
        alert("Avatar updated successfully!");
        refetchProfile();
        refetchPosts();
      } catch (err) {
        console.error("Failed to update avatar:", err);
        alert("Failed to update avatar. Please try again.");
      }
    }
  };

  // Submit Bio changes
  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUserProfile({
        about: bioInput.trim() || null,
        gender: profile?.gender ?? 0,
      }).unwrap();
      setIsEditingBio(false);
      refetchProfile();
    } catch (err) {
      console.error("Failed to update profile bio:", err);
      alert("Failed to update bio.");
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: number) => {
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      try {
        await deletePost(postId).unwrap();
        setSelectedPostId(null);
        refetchPosts();
        refetchProfile();
      } catch (err) {
        console.error("Failed to delete post:", err);
        alert("Failed to delete post.");
      }
    }
  };

  // Inline Modal Actions
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || selectedPostId === null) return;
    try {
      await addComment({
        comment: commentText.trim(),
        postId: selectedPostId,
      }).unwrap();
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (selectedPostId === null) return;
    if (confirm("Delete this comment?")) {
      try {
        await deleteComment({ commentId, postId: selectedPostId }).unwrap();
      } catch (err) {
        console.error("Failed to delete comment:", err);
      }
    }
  };

  const handleLikeToggle = async () => {
    if (selectedPostId === null) return;
    try {
      await likePost(selectedPostId).unwrap();
      refetchPosts();
      refetchSavedPosts();
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  const handleFavoriteToggle = async () => {
    if (selectedPostId === null) return;
    try {
      await addPostFavorite({ postId: selectedPostId }).unwrap();
      refetchPosts();
      refetchSavedPosts();
    } catch (err) {
      console.error("Failed to favorite post:", err);
    }
  };

  const displayedPosts = activeTab === "posts" ? myPosts : savedPosts;
  const isGridLoading = activeTab === "posts" ? isPostsLoading : isSavedLoading;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 px-4 py-8 md:px-12">
      <div className="max-w-4xl mx-auto">
        {isProfileLoading ? (
          // Header Skeleton
          <div className="flex flex-col sm:flex-row items-center gap-8 mb-12 animate-pulse">
            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-4 w-full text-center sm:text-left">
              <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto sm:mx-0"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto sm:mx-0"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto sm:mx-0"></div>
            </div>
          </div>
        ) : (
          // Header Info Panel
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 md:gap-16 mb-12 pb-8 border-b border-gray-100">
            {/* Left: Avatar with Update Triggers */}
            <div className={`relative group/avatar flex-shrink-0 ${isOwnProfile ? "cursor-pointer" : ""}`} onClick={isOwnProfile ? handleAvatarClick : undefined}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md group-hover/avatar:opacity-85 transition-opacity duration-200">
                <img
                  src={resolveImageUrl(profile?.avatar)}
                  alt={profile?.userName || "User"}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Camera Icon Overlay on Hover */}
              {isOwnProfile && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 rounded-full flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
                  <CameraAltIcon className="text-xl" />
                  <span>Change Photo</span>
                </div>
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Right: User Bio Details & Edit Actions */}
            <div className="flex-1 text-center sm:text-left space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <h2 className="text-2xl font-black text-gray-800">
                  @{profile?.userName || "user"}
                </h2>

                <div className="flex justify-center sm:justify-start gap-2">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={() => setIsEditingBio(!isEditingBio)}
                        className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-bold bg-white hover:bg-gray-50 active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-gray-700"
                      >
                        <EditIcon className="text-xs" />
                        <span>Edit Profile Bio</span>
                      </button>
                      <button className="p-1.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-600">
                        <SettingsIcon className="text-sm" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleMessageUser}
                      disabled={isCreatingChat}
                      className="px-6 py-1.5 bg-[#0095f6] hover:bg-[#1877f2] active:scale-95 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all duration-200 shadow-sm"
                    >
                      {isCreatingChat ? "Создание чата..." : "Сообщение"}
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Counters */}
              <div className="flex items-center justify-center sm:justify-start gap-8 text-sm">
                <div>
                  <span className="font-extrabold text-gray-800 mr-1">{myPosts.length}</span>
                  <span className="text-gray-500">posts</span>
                </div>
                <div>
                  <span className="font-extrabold text-gray-800 mr-1">{profile?.subscribersCount || 0}</span>
                  <span className="text-gray-500">followers</span>
                </div>
                <div>
                  <span className="font-extrabold text-gray-800 mr-1">{profile?.subscriptionsCount || 0}</span>
                  <span className="text-gray-500">following</span>
                </div>
              </div>

              {/* Real Full Name & Custom Bio */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-gray-800 text-sm">
                  {profile?.fullName || "Instagram User"}
                </h3>
                {isEditingBio ? (
                  <form onSubmit={handleSaveBio} className="space-y-2 mt-2">
                    <textarea
                      placeholder="Write a custom description about yourself..."
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value)}
                      rows={3}
                      maxLength={160}
                      className="w-full max-w-md px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-pink-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[11px] font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        {isUpdatingProfile ? "Saving..." : "Save Bio"}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingBio(false);
                          setBioInput(profile?.about || "");
                        }}
                        type="button"
                        className="px-3 py-1.5 border border-gray-200 bg-white text-gray-700 text-[11px] font-bold rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-xs text-gray-500 max-w-md leading-relaxed whitespace-pre-wrap">
                    {profile?.about || "This user hasn't added a bio yet."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab switchers bar */}
        {isOwnProfile && (
          <div className="flex items-center justify-center border-t border-gray-100 mb-8">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex items-center gap-1.5 px-6 py-4 text-xs font-bold tracking-widest uppercase border-t-2 -mt-[1px] transition-all duration-200 ${
                activeTab === "posts"
                  ? "border-black text-black font-extrabold"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <GridOnIcon className="text-sm" />
              <span>Posts</span>
            </button>
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex items-center gap-1.5 px-6 py-4 text-xs font-bold tracking-widest uppercase border-t-2 -mt-[1px] transition-all duration-200 ${
                activeTab === "saved"
                  ? "border-black text-black font-extrabold"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <BookmarkBorderIcon className="text-sm" />
              <span>Saved</span>
            </button>
          </div>
        )}

        {/* Dynamic Grid Contents */}
        {isGridLoading ? (
          // Grid Skeleton
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg md:rounded-2xl"></div>
            ))}
          </div>
        ) : displayedPosts.length === 0 ? (
          // Empty state layout
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-50 p-8 shadow-sm">
            <BookmarkBorderIcon className="text-gray-300 text-5xl mb-3" />
            <h4 className="font-bold text-gray-800 text-lg mb-1">
              No {activeTab === "posts" ? "posts uploaded" : "saved posts"} yet
            </h4>
            <p className="text-xs text-gray-400">
              {activeTab === "posts"
                ? "Upload your first gorgeous post from the Create page!"
                : "Bookmark posts on the Explore feed to see them here later."}
            </p>
          </div>
        ) : (
          // Standard Instagram Grid
          <div className="grid grid-cols-3 gap-[2px]">
            {displayedPosts.map((post: any, idx: number) => {
              const likes = post.likesCount ?? post.postLikeCount ?? post.postLikes ?? 0;
              const views = post.viewsCount ?? post.postViewCount ?? post.postViews ?? 0;
              const uniqueKey = `profile-post-${post.postId || post.id || ""}-${idx}`;
              return (
                <div
                  key={uniqueKey}
                  onClick={() => handlePostClick(post.postId || post.id)}
                  className="group relative aspect-square bg-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
                >
                  <img
                    src={resolveImageUrl(post.image || post.imagePath || post.file || post.postImages)}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Hover Info Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 md:gap-8 text-white font-bold text-xs sm:text-sm">
                    <div className="flex items-center gap-1">
                      <FavoriteIcon className="text-white text-sm sm:text-lg" />
                      <span>{likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <VisibilityIcon className="text-white text-sm sm:text-lg" />
                      <span>{views}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reusable Details Modal Overlays */}
      {selectedPostId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          {/* Modal Box */}
          <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-[75vh] max-h-[750px] animate-scaleUp">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPostId(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/75 text-white rounded-full transition-colors duration-200 md:bg-gray-100 md:hover:bg-gray-200 md:text-gray-700"
            >
              <CloseIcon />
            </button>

            {/* Left Side: Post Image */}
            <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative h-1/2 md:h-full">
              {selectedPostId !== null && (() => {
                const images = postDetails?.images || [];
                const singleRawPath = postDetails?.image || postDetails?.imagePath || postDetails?.file || postDetails?.postImages;
                
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
                    alt={postDetails?.title}
                    className="w-full h-full object-cover md:object-contain"
                  />
                );
              })()}
            </div>

            {/* Right Side: Details, Actions, and Comments Panel */}
            <div className="w-full md:w-2/5 flex flex-col h-1/2 md:h-full bg-white">
              {isDetailsLoading ? (
                // Modal Loading State
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
                  <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-gray-500">Loading details...</span>
                </div>
              ) : detailsError || !postDetails ? (
                // Modal Error State
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <CloseIcon className="text-red-500 text-4xl mb-2" />
                  <h4 className="font-bold text-gray-800">Failed to load details</h4>
                  <p className="text-xs text-gray-400 mt-1">Please try again later.</p>
                </div>
              ) : (
                <>
                  {/* 1. Header (User Info & Delete Post option) */}
                  <div 
                    className="flex items-center gap-3 p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => {
                      if (postDetails.userId) {
                        setSelectedPostId(null);
                        router.push(`/profile?userId=${postDetails.userId}`);
                      }
                    }}
                  >
                    <img
                      src={resolveImageUrl(postDetails.userImage)}
                      alt="User avatar"
                      className="w-10 h-10 rounded-full border object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 truncate">
                        {postDetails.title || "Untitled Post"}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        by @{postDetails.userName || "user"}
                      </p>
                    </div>

                    {/* Delete Option (only visible if the post belongs to the logged-in user) */}
                    {myInfo &&
                      (postDetails.userId === myInfo.userId ||
                        postDetails.userName === myInfo.userName) && (
                        <button
                          onClick={() => handleDeletePost(postDetails.postId || postDetails.id || 0)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Delete post permanently"
                        >
                          <DeleteOutlinedIcon className="text-base" />
                        </button>
                      )}
                  </div>

                  {/* 2. Content & Comments Scrollable Box */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {/* Post Content/Caption */}
                    {postDetails.content && (
                      <div className="flex gap-3 pb-3 border-b border-gray-100">
                        <img
                          src={resolveImageUrl(postDetails.userImage)}
                          alt="User avatar"
                          className="w-8 h-8 rounded-full border object-cover flex-shrink-0 cursor-pointer hover:opacity-90"
                          onClick={() => {
                            if (postDetails.userId) {
                              setSelectedPostId(null);
                              router.push(`/profile?userId=${postDetails.userId}`);
                            }
                          }}
                        />
                        <div className="text-sm">
                          <span 
                            className="font-bold mr-1.5 text-gray-800 cursor-pointer hover:underline"
                            onClick={() => {
                              if (postDetails.userId) {
                                setSelectedPostId(null);
                                router.push(`/profile?userId=${postDetails.userId}`);
                              }
                            }}
                          >
                            @{postDetails.userName || "user"}
                          </span>
                          <span className="text-gray-700 whitespace-pre-wrap">{postDetails.content}</span>
                        </div>
                      </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-4">
                      {(!postDetails.comments || postDetails.comments.length === 0) ? (
                        <div className="text-center py-8">
                          <ChatBubbleOutlinedIcon className="text-gray-300 text-3xl mb-1" />
                          <p className="text-xs text-gray-400 font-medium">No comments yet</p>
                          <p className="text-[10px] text-gray-300">Be the first to share your thoughts!</p>
                        </div>
                      ) : (
                        postDetails.comments.map((c: any, idx: number) => {
                          const cid = c.postCommentId || c.commentId || c.id;
                          const isOwnId = myInfo && c.userId && myInfo.userId && String(c.userId).toLowerCase() === String(myInfo.userId).toLowerCase();
                          const authorName = c.userName || (isOwnId ? myInfo.userName : null) || postDetails.userName || "user";
                          const isOwnComment = myInfo && (isOwnId || authorName === myInfo.userName);
                          const uniqueCommentKey = `profile-comment-${cid || ""}-${idx}`;
                          return (
                            <div key={uniqueCommentKey} className="flex gap-3 group/comment items-start">
                              <img
                                src={resolveImageUrl(c.userImage)}
                                alt={authorName}
                                className="w-8 h-8 rounded-full border object-cover flex-shrink-0 cursor-pointer hover:opacity-90"
                                onClick={() => {
                                  if (c.userId) {
                                    setSelectedPostId(null);
                                    router.push(`/profile?userId=${c.userId}`);
                                  }
                                }}
                              />
                              <div className="flex-1 min-w-0 bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 relative">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span 
                                    className="font-bold text-xs text-gray-800 truncate cursor-pointer hover:underline"
                                    onClick={() => {
                                      if (c.userId) {
                                        setSelectedPostId(null);
                                        router.push(`/profile?userId=${c.userId}`);
                                      }
                                    }}
                                  >
                                    @{authorName}
                                  </span>
                                  {/* Delete Comment Button */}
                                  {isOwnComment && (
                                    <button
                                      onClick={() => handleDeleteComment(cid)}
                                      className="text-gray-400 hover:text-red-500 transition-colors duration-150 rounded"
                                      title="Delete comment"
                                    >
                                      <DeleteOutlinedIcon className="text-sm" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-700 break-words">{c.comment}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={commentsEndRef} />
                    </div>
                  </div>

                  {/* 3. Action Bar (Like & Favorite Buttons) */}
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                      {/* Like Action */}
                      <button
                        onClick={handleLikeToggle}
                        disabled={isLiking}
                        className="flex items-center gap-1.5 group/like text-gray-600 hover:text-red-500 transition-colors duration-200"
                      >
                        {postDetails.isLiked ? (
                          <FavoriteIcon className="text-red-500 scale-110 animate-heartBeat" />
                        ) : (
                          <FavoriteBorderIcon className="group-hover/like:scale-110 transition-transform duration-200" />
                        )}
                        <span className="text-xs font-semibold text-gray-500">
                          {postDetails.likesCount ?? postDetails.postLikeCount ?? postDetails.postLikes ?? 0}
                        </span>
                      </button>

                      {/* Favorite/Bookmark Action */}
                      <button
                        onClick={handleFavoriteToggle}
                        disabled={isFavoriting}
                        className="flex items-center gap-1.5 group/fav text-gray-600 hover:text-yellow-500 transition-colors duration-200"
                      >
                        {postDetails.isFavorite ? (
                          <StarIcon className="text-yellow-500 scale-110 animate-heartBeat" />
                        ) : (
                          <StarBorderIcon className="group-hover/fav:scale-110 transition-transform duration-200" />
                        )}
                        <span className="text-xs font-semibold text-gray-500">Favorite</span>
                      </button>
                    </div>

                    {/* Views Count Display */}
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                      <VisibilityIcon className="text-sm text-gray-400" />
                      <span>
                        {postDetails.viewsCount ?? postDetails.postViewCount ?? postDetails.postViews ?? 0} views
                      </span>
                    </div>
                  </div>

                  {/* 4. Add Comment Form */}
                  <form
                    onSubmit={handleAddComment}
                    className="p-4 border-t border-gray-100 flex gap-2 items-center bg-white"
                  >
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      disabled={isAddingComment}
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-xs outline-none focus:border-pink-500 focus:bg-white transition-all duration-200"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isAddingComment}
                      className="p-2.5 bg-pink-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-colors duration-200 shadow-md"
                    >
                      {isAddingComment ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <SendIcon className="text-sm transform rotate-[-30deg]" />
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for transitions */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes heartBeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.15); }
          50% { transform: scale(1); }
          75% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scaleUp {
          animation: scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .animate-heartBeat {
          animation: heartBeat 0.4s ease-in-out;
        }
      `}} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500">Loading profile...</div>}>
      <ProfilePageContent />
    </Suspense>
  );
}

