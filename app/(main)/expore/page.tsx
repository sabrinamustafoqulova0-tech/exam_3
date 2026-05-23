"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useLikePostMutation,
  useViewPostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddPostFavoriteMutation,
  useGetUserProfileByIdQuery,
} from "../../services/postApi";
import { GetToken } from "../../utils/token";

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// JWT Helper
const getMyInfo = () => {
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
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
      payload.nameid || payload.sub || payload.id;
    const userName =
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      payload.unique_name || payload.name || payload.userName;
    return { userId, userName };
  } catch {
    return null;
  }
};

const resolveImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `https://instagram-api.softclub.tj/images/${path}`;
};

const isVideo = (path: string | null | undefined): boolean => {
  if (!path) return false;
  return /\.(mp4|webm|ogg|mov|avi|mkv|m4v)$/i.test(path.split("?")[0]);
};

// Pick the first image from the real API `images` array, falling back to legacy fields
const getMediaPath = (post: any): string | null => {
  if (Array.isArray(post?.images) && post.images.length > 0) return post.images[0];
  return post?.image || post?.imagePath || post?.file || post?.postImages || null;
};

// Whether a post has more than one image
const hasMultipleImages = (post: any): boolean =>
  Array.isArray(post?.images) && post.images.length > 1;

// Resolve count fields from real or legacy API shape
const getLikes = (post: any): number =>
  post?.postLikeCount ?? post?.likesCount ?? post?.postLikes ?? 0;

const getViews = (post: any): number =>
  post?.postView ?? post?.postViewCount ?? post?.viewsCount ?? post?.postViews ?? 0;

const getComments = (post: any): number =>
  post?.commentCount ?? post?.comments?.length ?? 0;

const getIsLiked = (post: any): boolean =>
  post?.postLike ?? post?.isLiked ?? false;

const getIsFavorite = (post: any): boolean =>
  post?.postFavorite ?? post?.isFavorite ?? false;

const PAGE_SIZE = 15;
const HeartIcon = ({ filled, className = "" }: { filled?: boolean; className?: string }) =>
  filled ? (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="#ed4956" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ) : (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );

const CommentIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const BookmarkIcon = ({ filled, className = "" }: { filled?: boolean; className?: string }) =>
  filled ? (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z" />
    </svg>
  ) : (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z" />
    </svg>
  );

const SendIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const TrashIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const MultipleIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="white">
    <path d="M2 6h2v14h14v2H4a2 2 0 0 1-2-2V6zm4-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v14h14V6H6z" />
  </svg>
);

// ─── Avatar placeholder ───────────────────────────────────────────────────────
function Avatar({ src, name, size = 32 }: { src?: string | null; name?: string; size?: number }) {
  const [err, setErr] = useState(false);
  const resolved = resolveImageUrl(src);
  const letter = (name || "?")[0].toUpperCase();

  if (!resolved || err) {
    return (
      <div
        style={{ width: size, height: size, minWidth: size, borderRadius: "50%", background: "#efefef", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
          <rect width="24" height="24" fill="#efefef"/>
          <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" fill="#dbdbdb"/>
          <path d="M12 13C8.68629 13 6 15.6863 6 19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19C18 15.6863 15.3137 13 12 13Z" fill="#dbdbdb"/>
        </svg>
      </div>
    );
  }
  return (
    <img
      src={resolved}
      alt={name}
      style={{ width: size, height: size, minWidth: size, borderRadius: "50%", objectFit: "cover", border: "1px solid #dbdbdb" }}
      onError={() => setErr(true)}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CommentItem({ c, ci, myInfo, postDetails, styles, router, handleDeleteComment, setSelectedPostId }: any) {
  const { data: userProfile } = useGetUserProfileByIdQuery(c.userId, { skip: !c.userId });
  const cid = c.postCommentId || c.commentId || c.id;
  const isOwnId = myInfo && c.userId && myInfo.userId && String(c.userId).toLowerCase() === String(myInfo.userId).toLowerCase();
  
  // Prioritize fetched full name, fallback to other properties
  const authorName = userProfile?.fullName || c.userName || (isOwnId ? myInfo.userName : null) || postDetails.userName || "user";
  const avatarPath = userProfile?.avatar || c.userImage;
  // Ownership check: only compare userId (name comparison breaks when fullName is shown)
  const isOwn = !!(myInfo && isOwnId);

  return (
    <div key={`c-${cid || ci}`} style={{ ...styles.commentRow, alignItems: "flex-start" }}>
      <div
        style={{ cursor: "pointer", flexShrink: 0 }}
        onClick={() => { if (c.userId) { setSelectedPostId(null); router.push(`/profile?userId=${c.userId}`); } }}
      >
        <Avatar src={avatarPath} name={authorName} size={32} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <span
              style={styles.commentUsername}
              onClick={() => { if (c.userId) { setSelectedPostId(null); router.push(`/profile?userId=${c.userId}`); } }}
            >
              {authorName}
            </span>{" "}
            <span style={styles.commentText}>{c.comment}</span>
          </div>
          {isOwn && (
            <button
              style={{
                ...styles.deleteCommentBtn,
                color: "#ed4956",
                opacity: 1,
              }}
              onClick={(e) => { e.stopPropagation(); handleDeleteComment(cid); }}
              title="Удалить комментарий"
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number>(-1);
  const [commentText, setCommentText] = useState("");
  const [myInfo, setMyInfo] = useState<{ userId: string; userName: string } | null>(null);

  // Infinite scroll state
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMyInfo(getMyInfo()); }, []);

  // Debounce search 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
      setAllPosts([]);
      setHasMore(true);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: pagePosts = [], isLoading: isPostsLoading, isFetching, error: postsError, refetch } =
    useGetPostsQuery({ Title: debouncedQuery, PageNumber: page, PageSize: PAGE_SIZE }, { refetchOnMountOrArgChange: true });

  // Append pages
  useEffect(() => {
    if (pagePosts.length === 0) { setHasMore(false); return; }
    if (pagePosts.length < PAGE_SIZE) setHasMore(false);
    if (page === 1) {
      setAllPosts(pagePosts);
    } else {
      setAllPosts(prev => {
        const ids = new Set(prev.map((p: any) => p.postId || p.id));
        return [...prev, ...pagePosts.filter((p: any) => !ids.has(p.postId || p.id))];
      });
    }
  }, [pagePosts, page]);

  // IntersectionObserver sentinel
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore && !isFetching) setPage(p => p + 1); },
      { rootMargin: "300px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isFetching]);

  const { data: postDetails, isLoading: detailsLoading } = useGetPostByIdQuery(selectedPostId ?? 0, { skip: selectedPostId === null });
  const [likePost, { isLoading: isLiking }] = useLikePostMutation();
  const [viewPost] = useViewPostMutation();
  const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [addPostFavorite, { isLoading: isFavoriting }] = useAddPostFavoriteMutation();
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [postDetails?.comments]);

  const handlePostClick = async (postId: number, index?: number) => {
    setSelectedPostId(postId);
    if (index !== undefined) setSelectedPostIndex(index);
    try { await viewPost(postId).unwrap(); } catch {}
  };

  const handlePrevPost = () => {
    if (selectedPostIndex > 0) {
      const prev = allPosts[selectedPostIndex - 1];
      const prevId = prev?.postId || prev?.id;
      setSelectedPostIndex(selectedPostIndex - 1);
      setSelectedPostId(prevId);
    }
  };

  const handleNextPost = () => {
    if (selectedPostIndex < allPosts.length - 1) {
      const next = allPosts[selectedPostIndex + 1];
      const nextId = next?.postId || next?.id;
      setSelectedPostIndex(selectedPostIndex + 1);
      setSelectedPostId(nextId);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || selectedPostId === null) return;
    try {
      await addComment({ comment: commentText.trim(), postId: selectedPostId }).unwrap();
      setCommentText("");
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (selectedPostId === null) return;
    try { await deleteComment({ commentId, postId: selectedPostId }).unwrap(); } catch {}
  };

  const handleLike = async () => {
    if (selectedPostId === null) return;
    try { await likePost(selectedPostId).unwrap(); } catch {}
  };

  const handleFavorite = async () => {
    if (selectedPostId === null) return;
    try { await addPostFavorite({ postId: selectedPostId }).unwrap(); } catch {}
  };

  // ─── Instagram-style mixed grid layout ─────────────────────────────────────
  // Every 7th post (index 2 in a 7-post cycle) spans 2 rows (tall feature post)
  const buildGridItems = () =>
    allPosts.map((post: any, idx: number) => {
      const posInCycle = idx % 7;
      const isBig = posInCycle === 2; // every 7th group, the 3rd is big
      return { post, isBig };
    });

  const gridItems = buildGridItems();

  // ─── Skeleton grid (real Instagram proportions) ────────────────────────────
  const Skeleton = () => (
    <div style={styles.grid}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{ ...styles.gridCell, background: "#efefef", animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );

  return (
    <div style={styles.page}>


      {/* ── Grid area ── */}
      {isPostsLoading && page === 1 ? (
        <Skeleton />
      ) : postsError ? (
        <div style={styles.centerMsg}>
          <p style={{ fontWeight: 600, fontSize: 16, color: "#262626" }}>Не удалось загрузить публикации</p>
          <button style={styles.retryBtn} onClick={() => refetch()}>Повторить</button>
        </div>
      ) : allPosts.length === 0 && !isFetching ? (
        <div style={styles.centerMsg}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#dbdbdb" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <p style={{ marginTop: 16, fontWeight: 600, fontSize: 16, color: "#262626" }}>Ничего не найдено</p>
          <p style={{ marginTop: 4, fontSize: 14, color: "#8e8e8e" }}>Попробуйте другой запрос.</p>
        </div>
      ) : (
        <>
          {/* ── Instagram 3-col grid with feature posts ── */}
          <div style={styles.grid}>
            {gridItems.map(({ post, isBig }, idx) => {
              const rawPath = getMediaPath(post);
              const mediaSrc = resolveImageUrl(rawPath);
              const mediaIsVideo = isVideo(rawPath);
              const likes = getLikes(post);
              const comments = getComments(post);
              const isMultiple = hasMultipleImages(post);

              return (
                <div
                  key={`g-${post.postId || post.id}-${idx}`}
                  style={{
                    ...styles.gridCell,
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    background: "#efefef",
                  }}
                  onClick={() => handlePostClick(post.postId || post.id, idx)}
                  className="ig-cell"
                >
                  {mediaSrc ? (
                    mediaIsVideo ? (
                      <>
                        <video
                          src={mediaSrc}
                          style={styles.gridImg}
                          muted
                          autoPlay
                          loop
                          playsInline
                          preload="metadata"
                        />
                        {/* Video indicator badge */}
                        <div style={styles.videoBadge}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <img
                        src={mediaSrc}
                        alt=""
                        style={styles.gridImg}
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#dbdbdb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div style={styles.gridOverlay} className="ig-overlay">
                    <div style={styles.overlayItem}>
                      <HeartIcon filled className="w-5 h-5" />
                      <span style={styles.overlayNum}>{likes}</span>
                    </div>
                    <div style={styles.overlayItem}>
                      <CommentIcon className="w-5 h-5" />
                      <span style={styles.overlayNum}>{comments}</span>
                    </div>
                  </div>
                  {/* Multiple images badge */}
                  {isMultiple && !mediaIsVideo && (
                    <div style={styles.multipleIcon}>
                      <MultipleIcon />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sentinel */}
          <div ref={sentinelRef} style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "32px 0", minHeight: 60 }}>
            {isFetching && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #dbdbdb", borderTopColor: "#262626", animation: "spin 0.75s linear infinite" }} />
              </div>
            )}
            {!hasMore && allPosts.length > 0 && (
              <p style={{ fontSize: 13, color: "#8e8e8e" }}>Вы просмотрели все публикации</p>
            )}
          </div>
        </>
      )}

      {/* ─────────────────── POST MODAL ─────────────────── */}
      {selectedPostId !== null && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedPostId(null)}>

          {/* ← Prev Arrow */}
          {selectedPostIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevPost(); }}
              style={{
                position: "fixed",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 9999,
                background: "rgba(255,255,255,0.9)",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* → Next Arrow */}
          {selectedPostIndex < allPosts.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); handleNextPost(); }}
              style={{
                position: "fixed",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 9999,
                background: "rgba(255,255,255,0.9)",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          <div style={styles.modalContainer} onClick={e => e.stopPropagation()}>

            {/* Close button */}
            <button style={styles.modalCloseBtn} onClick={() => setSelectedPostId(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {detailsLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #dbdbdb", borderTopColor: "#262626", animation: "spin 0.75s linear infinite" }} />
              </div>
            ) : !postDetails ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "#8e8e8e", fontSize: 14 }}>
                Не удалось загрузить публикацию
              </div>
            ) : (
              <>
                {/* LEFT: Image or Video */}
                <div style={styles.modalLeft}>
                  {(() => {
                    const images = postDetails.images || [];
                    const singleRawPath = getMediaPath(postDetails);

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
                            const mediaIsVideo = isVideo(img);
                            return (
                              <SwiperSlide key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                {mediaIsVideo ? (
                                  <video src={mediaSrc || undefined} controls playsInline style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                ) : (
                                  <img src={mediaSrc || undefined} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                )}
                              </SwiperSlide>
                            );
                          })}
                        </Swiper>
                      );
                    }

                    const mediaSrc = resolveImageUrl(singleRawPath);
                    const mediaIsVideo = isVideo(singleRawPath);
                    if (!mediaSrc) {
                      return (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        </div>
                      );
                    }
                    if (mediaIsVideo) {
                      return (
                        <video
                          src={mediaSrc}
                          controls
                          autoPlay
                          loop
                          playsInline
                          style={{ width: "100%", height: "100%", objectFit: "contain", outline: "none" }}
                        />
                      );
                    }
                    return (
                      <img
                        src={mediaSrc}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    );
                  })()}
                </div>

                {/* RIGHT: Detail panel */}
                <div style={styles.modalRight}>
                  {/* Header */}
                  <div style={styles.modalHeader}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1, minWidth: 0 }}
                      onClick={() => { if (postDetails.userId) { setSelectedPostId(null); router.push(`/profile?userId=${postDetails.userId}`); } }}
                    >
                      <Avatar src={postDetails.userImage} name={postDetails.userName} size={36} />
                      <div style={{ minWidth: 0 }}>
                        <p style={styles.modalUsername}>{postDetails.userName || "user"}</p>
                        {postDetails.title && <p style={styles.modalLocation}>{postDetails.title}</p>}
                      </div>
                    </div>
                    <button style={styles.moreBtn}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                      </svg>
                    </button>
                  </div>

                  {/* Comments / Caption scroll area */}
                  <div style={styles.modalComments}>
                    {/* Caption */}
                    {postDetails.content && (
                      <div style={styles.commentRow}>
                        <div
                          style={{ cursor: "pointer", flexShrink: 0 }}
                          onClick={() => { if (postDetails.userId) { setSelectedPostId(null); router.push(`/profile?userId=${postDetails.userId}`); } }}
                        >
                          <Avatar src={postDetails.userImage} name={postDetails.userName} size={32} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={styles.commentUsername}
                            onClick={() => { if (postDetails.userId) { setSelectedPostId(null); router.push(`/profile?userId=${postDetails.userId}`); } }}
                          >
                            {postDetails.userName}
                          </span>{" "}
                          <span style={styles.commentText}>{postDetails.content}</span>
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    <div style={{ height: 1, background: "#efefef", margin: "8px 0" }} />

                    {/* Comments list */}
                    {!postDetails.comments || postDetails.comments.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "32px 16px" }}>
                        <p style={{ fontSize: 22, fontWeight: 800, color: "#262626", marginBottom: 8 }}>Пока нет комментариев</p>
                        <p style={{ fontSize: 14, color: "#8e8e8e" }}>Начните обсуждение.</p>
                      </div>
                    ) : (
                      postDetails.comments.map((c: any, ci: number) => (
                        <CommentItem
                          key={`c-${c.postCommentId || c.commentId || c.id || ci}`}
                          c={c}
                          ci={ci}
                          myInfo={myInfo}
                          postDetails={postDetails}
                          styles={styles}
                          router={router}
                          handleDeleteComment={handleDeleteComment}
                          setSelectedPostId={setSelectedPostId}
                        />
                      ))
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Action bar */}
                  <div style={styles.modalActions}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <button style={styles.actionBtn} onClick={handleLike} disabled={isLiking}>
                        <HeartIcon filled={getIsLiked(postDetails)} className={getIsLiked(postDetails) ? "" : ""} />
                      </button>
                      <button style={styles.actionBtn}>
                        <CommentIcon />
                      </button>
                      <button style={styles.actionBtn}>
                        <SendIcon />
                      </button>
                    </div>
                    <button style={styles.actionBtn} onClick={handleFavorite} disabled={isFavoriting}>
                      <BookmarkIcon filled={getIsFavorite(postDetails)} />
                    </button>
                  </div>

                  {/* Like count */}
                  <div style={styles.likeCount}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#262626" }}>
                      {getLikes(postDetails).toLocaleString()} отметок «Нравится»
                    </span>
                  </div>

                  {/* Add comment */}
                  <form onSubmit={handleAddComment} style={styles.addCommentForm}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.5" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <input
                      style={styles.commentInput}
                      placeholder="Добавьте комментарий..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      disabled={isAddingComment}
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isAddingComment}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: commentText.trim() ? "pointer" : "default",
                        fontWeight: 700,
                        fontSize: 14,
                        color: commentText.trim() ? "#0095f6" : "#b2dffc",
                        transition: "color 0.2s",
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      {isAddingComment ? "..." : "Опубликовать"}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Global styles ── */}
      <style>{`
        .ig-cell .ig-overlay { opacity: 0; }
        .ig-cell:hover .ig-overlay { opacity: 1; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    background: "#fafafa",
    minHeight: "100vh",
    paddingBottom: 40,
  },

  // 3-column grid — 2px gap exactly like Instagram
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 4,
    width: "100%",
    maxWidth: 935,
    margin: "0 auto",
    padding: "24px 20px",
  },
  gridCell: {
    width: "100%",
    aspectRatio: "1 / 1",
    overflow: "hidden",
    position: "relative",
  },
  gridImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.3s ease",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    transition: "opacity 0.2s ease",
    cursor: "pointer",
  },
  overlayItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#fff",
  },
  overlayNum: {
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  multipleIcon: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  videoBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    background: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    padding: "3px 6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  centerMsg: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
  },
  retryBtn: {
    marginTop: 16,
    background: "#0095f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 20px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  // ── Modal ──
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    display: "flex",
    width: "100%",
    maxWidth: 940,
    height: "90vh",
    maxHeight: 740,
    background: "#fff",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  modalCloseBtn: {
    position: "fixed",
    top: 16,
    right: 16,
    background: "none",
    border: "none",
    cursor: "pointer",
    zIndex: 200,
    padding: 8,
    lineHeight: 0,
  },
  modalLeft: {
    flex: "0 0 60%",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalRight: {
    flex: "0 0 40%",
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #efefef",
    background: "#fff",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid #efefef",
    flexShrink: 0,
  },
  modalUsername: {
    fontWeight: 700,
    fontSize: 14,
    color: "#262626",
    margin: 0,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  modalLocation: {
    fontSize: 12,
    color: "#262626",
    margin: 0,
    marginTop: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  moreBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#262626",
    padding: 4,
    lineHeight: 0,
    flexShrink: 0,
  },
  modalComments: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  commentRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  commentUsername: {
    fontWeight: 700,
    fontSize: 14,
    color: "#262626",
    cursor: "pointer",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  commentText: {
    fontSize: 14,
    color: "#262626",
    lineHeight: 1.5,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  deleteCommentBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#8e8e8e",
    padding: "2px 4px",
    lineHeight: 0,
    flexShrink: 0,
    width: 20,
    height: 20,
  },
  modalActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 12px",
    borderTop: "1px solid #efefef",
    flexShrink: 0,
  },
  actionBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 6,
    lineHeight: 0,
    color: "#262626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  likeCount: {
    padding: "0 16px 8px",
    flexShrink: 0,
  },
  addCommentForm: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderTop: "1px solid #efefef",
    flexShrink: 0,
  },
  commentInput: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "#262626",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
};
