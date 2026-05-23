"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useGetUsersQuery,
  useCreateChatMutation,
  type User,
} from "@/app/services/chatApi";

interface ExploreItem {
  id: string;
  imageUrl: string;
  likes: string;
  comments: number;
  isVideo?: boolean;
  aspectRatio?: string;
  title: string;
  author: {
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  description: string;
  mockComments: Array<{
    user: string;
    avatar: string;
    text: string;
    time: string;
  }>;
}

const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: "1",
    imageUrl: "https://picsum.photos/seed/explore1/600/600",
    likes: "4.8K",
    comments: 243,
    title: "Vibrant City Streets",
    author: { name: "nomad_photographer", avatar: "https://picsum.photos/seed/avatar1/150/150", isVerified: true },
    description: "Capturing the electric pulse of the city at twilight. The light trails tell stories of a thousand commutes.",
    mockComments: [
      { user: "street.visionary", avatar: "https://picsum.photos/seed/c1/80/80", text: "The colors in this are absolutely stunning!", time: "2h" },
      { user: "neon_dreamer", avatar: "https://picsum.photos/seed/c2/80/80", text: "What exposure time did you use for this shot?", time: "1h" }
    ]
  },
  {
    id: "2",
    imageUrl: "https://picsum.photos/seed/explore2/600/800",
    likes: "12.3K",
    comments: 892,
    aspectRatio: "2/3",
    title: "Mountain Serenity",
    author: { name: "alpine_explorer", avatar: "https://picsum.photos/seed/avatar2/150/150", isVerified: false },
    description: "Above the clouds, there is only silence. The peaks stand like frozen waves against a sea of blue.",
    mockComments: [
      { user: "nature_lover_99", avatar: "https://picsum.photos/seed/c3/80/80", text: "Incredible perspective. Added to my bucket list!", time: "4h" },
      { user: "peak_chaser", avatar: "https://picsum.photos/seed/c4/80/80", text: "Looks like a challenging hike but totally worth it.", time: "3h" }
    ]
  },
  {
    id: "3",
    imageUrl: "https://picsum.photos/seed/explore3/600/600",
    likes: "3.2K",
    comments: 154,
    title: "Minimalist Geometry",
    author: { name: "arch_design", avatar: "https://picsum.photos/seed/avatar3/150/150", isVerified: true },
    description: "Finding clean lines and repeating patterns in modern concrete jungles. Minimalism isn't the absence of something, it's the perfect presence of it.",
    mockComments: [
      { user: "spatial_designer", avatar: "https://picsum.photos/seed/c5/80/80", text: "A masterpiece of geometric photography.", time: "5h" }
    ]
  },
  {
    id: "4",
    imageUrl: "https://picsum.photos/seed/explore4/600/600",
    likes: "7.1K",
    comments: 420,
    title: "Culinary Art",
    author: { name: "gourmet_chef", avatar: "https://picsum.photos/seed/avatar4/150/150", isVerified: false },
    description: "A perfect assembly of summer ingredients. Food isn't just fuel; it's a language of creativity and sharing.",
    mockComments: [
      { user: "foodie_travels", avatar: "https://picsum.photos/seed/c6/80/80", text: "This looks too delicious to eat! Almost.", time: "30m" },
      { user: "bake_sweet", avatar: "https://picsum.photos/seed/c7/80/80", text: "Please share the recipe in your stories!", time: "15m" }
    ]
  },
  {
    id: "5",
    imageUrl: "https://picsum.photos/seed/explore5/600/800",
    likes: "15.9K",
    comments: 1205,
    aspectRatio: "2/3",
    title: "Desert Sunset",
    author: { name: "dune_chaser", avatar: "https://picsum.photos/seed/avatar5/150/150", isVerified: true },
    description: "The sand retains the warmth of the day long after the golden sun slips past the dunes. Endless horizons.",
    mockComments: [
      { user: "sands_of_time", avatar: "https://picsum.photos/seed/c8/80/80", text: "The gradient in the sky is surreal.", time: "6h" },
      { user: "oasis_dreaming", avatar: "https://picsum.photos/seed/c9/80/80", text: "Stunning shot of the dunes!", time: "5h" }
    ]
  },
  {
    id: "6",
    imageUrl: "https://picsum.photos/seed/explore6/600/600",
    likes: "5.5K",
    comments: 310,
    title: "Deep Sea Mysteries",
    author: { name: "ocean_blue", avatar: "https://picsum.photos/seed/avatar6/150/150", isVerified: false },
    description: "Submerged in the giant blue, realizing how small we are in this beautiful world. Meet the gentle giants of the reef.",
    mockComments: [
      { user: "scuba_diver_dan", avatar: "https://picsum.photos/seed/c10/80/80", text: "Such a magical encounter!", time: "1d" }
    ]
  },
  {
    id: "7",
    imageUrl: "https://picsum.photos/seed/explore7/600/600",
    likes: "9.2K",
    comments: 512,
    title: "Neon Reflections",
    author: { name: "tokyo_cyber", avatar: "https://picsum.photos/seed/avatar7/150/150", isVerified: true },
    description: "Rain-slicked alleyways reflection the vivid neon signs of Shibuya. Welcome to the future.",
    mockComments: [
      { user: "cyberpunk_vibes", avatar: "https://picsum.photos/seed/c11/80/80", text: "Pure Blade Runner aesthetic.", time: "8h" }
    ]
  },
  {
    id: "8",
    imageUrl: "https://picsum.photos/seed/explore8/600/600",
    likes: "6.3K",
    comments: 290,
    title: "Vintage Drive",
    author: { name: "classic_rides", avatar: "https://picsum.photos/seed/avatar8/150/150", isVerified: false },
    description: "Cruising down the coastal highway in a beautifully restored 1968 classic. Wind in the hair, old tunes on the radio.",
    mockComments: [
      { user: "auto_enthusiast", avatar: "https://picsum.photos/seed/c12/80/80", text: "What a gorgeous color on that model!", time: "12h" }
    ]
  },
  {
    id: "9",
    imageUrl: "https://picsum.photos/seed/explore9/600/800",
    likes: "10.8K",
    comments: 618,
    aspectRatio: "2/3",
    title: "Forest Solitude",
    author: { name: "green_wanderer", avatar: "https://picsum.photos/seed/avatar9/150/150", isVerified: false },
    description: "Getting lost in the giant redwoods of the Pacific Northwest. Foggy mornings and earthy scents.",
    mockComments: [
      { user: "misty_morning", avatar: "https://picsum.photos/seed/c13/80/80", text: "This photo feels so peaceful.", time: "14h" }
    ]
  }
];

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<ExploreItem | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // RTK Query users query
  const { data: users = [], isLoading: usersLoading } = useGetUsersQuery(
    searchQuery.trim() ? { UserName: searchQuery.trim() } : undefined,
    { skip: !searchQuery.trim() }
  );

  // RTK Query create chat mutation
  const [createChat, { isLoading: creatingChat }] = useCreateChatMutation();

  const handleCreateChat = async (userId: string) => {
    try {
      const chatId = await createChat(userId).unwrap();
      router.push(`/messages?chatId=${chatId}`);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  const toggleLike = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLikedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  return (
    <div style={styles.container}>
      {/* Search Header and Input */}
      <header style={styles.header}>
        <div style={styles.searchBarWrapper}>
          <div style={styles.searchIconWrapper}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            style={styles.searchInput}
            placeholder="Поиск пользователей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button style={styles.clearBtn} onClick={() => setSearchQuery("")}>
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {searchQuery.trim() ? (
          // Users Search Results List
          <div style={styles.userListContainer}>
            {usersLoading ? (
              <div style={styles.loadingSpinnerWrapper}>
                <div style={styles.spinner} />
                <span style={{ color: "#8e8e8e", marginTop: 12, fontSize: 14 }}>Ищем пользователей...</span>
              </div>
            ) : users.length === 0 ? (
              <div style={styles.noResultsWrapper}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dbdbdb" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <p style={styles.noResultsText}>Пользователи не найдены</p>
                <p style={styles.noResultsSubText}>Попробуйте изменить поисковый запрос</p>
              </div>
            ) : (
              <div style={styles.usersList}>
                {users.map((user: User) => (
                  <div key={user.id} style={styles.userCard} onClick={() => handleCreateChat(user.id)}>
                    <div style={styles.userAvatarWrapper}>
                      {user.avatar ? (
                        <img
                          src={`https://instagram-api.softclub.tj/images/${user.avatar}`}
                          alt={user.userName}
                          style={styles.userAvatar}
                        />
                      ) : (
                        <div style={styles.userAvatarPlaceholder}>
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
                            <rect width="24" height="24" fill="#efefef"/>
                            <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" fill="#dbdbdb"/>
                            <path d="M12 13C8.68629 13 6 15.6863 6 19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19C18 15.6863 15.3137 13 12 13Z" fill="#dbdbdb"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div style={styles.userInfo}>
                      <div style={styles.userNameRow}>
                        <span style={styles.userName}>{user.userName}</span>
                        {user.subscribersCount > 10 && (
                          <span style={styles.verifiedBadge} title="Популярный аккаунт">
                            ✓
                          </span>
                        )}
                      </div>
                      <div style={styles.userFullName}>{user.fullName || "Пользователь Instagram"}</div>
                      <div style={styles.userSubCount}>
                        {user.subscribersCount > 0 
                          ? `${user.subscribersCount} подписчиков` 
                          : "Нет подписчиков"}
                      </div>
                    </div>
                    <button
                      style={styles.messageBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateChat(user.id);
                      }}
                      disabled={creatingChat}
                    >
                      Написать
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Gorgeous Instagram Explore Feed Grid
          <div style={styles.exploreGrid}>
            {EXPLORE_ITEMS.map((item, index) => {
              const hasLiked = likedPosts[item.id] || false;
              
              return (
                <div
                  key={item.id}
                  style={{
                    ...styles.gridItem,
                  }}
                  onClick={() => setSelectedPost(item)}
                >
                  <img src={item.imageUrl} alt={item.title} style={styles.gridImage} />
                  
                  {/* Subtle hover overlay with micro-animations */}
                  <div className="explore-overlay" style={styles.overlay}>
                    <div style={styles.overlayStats}>
                      <div style={styles.overlayStat} onClick={(e) => toggleLike(item.id, e)}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={hasLiked ? "#ed4956" : "currentColor"} stroke={hasLiked ? "none" : "none"}>
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span style={styles.overlayStatVal}>{item.likes}</span>
                      </div>
                      <div style={styles.overlayStat}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
                        </svg>
                        <span style={styles.overlayStatVal}>{item.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Post Modal View */}
      {selectedPost && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPost(null)}>
          <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeModalBtn} onClick={() => setSelectedPost(null)}>
              ✕
            </button>
            <div style={styles.modalMain}>
              {/* Left Column: Post image */}
              <div style={styles.modalImageCol}>
                <img src={selectedPost.imageUrl} alt={selectedPost.title} style={styles.modalImage} />
              </div>

              {/* Right Column: User details, comments and interaction */}
              <div style={styles.modalDetailsCol}>
                {/* Header */}
                <div style={styles.modalDetailsHeader}>
                  <img src={selectedPost.author.avatar} alt={selectedPost.author.name} style={styles.modalAuthorAvatar} />
                  <div style={styles.modalAuthorInfo}>
                    <div style={styles.modalAuthorNameRow}>
                      <span style={styles.modalAuthorName}>{selectedPost.author.name}</span>
                      {selectedPost.author.isVerified && (
                        <span style={styles.modalVerifiedBadge} title="Подтвержденный аккаунт">
                          ✓
                        </span>
                      )}
                    </div>
                    <span style={styles.modalLocation}>Explore Recommendation</span>
                  </div>
                  <button style={styles.moreOptionsBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                    </svg>
                  </button>
                </div>

                {/* Comments & Description Container */}
                <div style={styles.commentsContainer}>
                  {/* Description */}
                  <div style={styles.descriptionRow}>
                    <img src={selectedPost.author.avatar} alt="author" style={styles.commentAvatar} />
                    <div style={styles.commentTextContainer}>
                      <p style={styles.commentContent}>
                        <span style={styles.commentUser}>{selectedPost.author.name}</span>
                        {selectedPost.description}
                      </p>
                      <span style={styles.commentTime}>1d</span>
                    </div>
                  </div>

                  {/* Comments list */}
                  {selectedPost.mockComments.map((c, i) => (
                    <div key={i} style={styles.commentRow}>
                      <img src={c.avatar} alt={c.user} style={styles.commentAvatar} />
                      <div style={styles.commentTextContainer}>
                        <p style={styles.commentContent}>
                          <span style={styles.commentUser}>{c.user}</span>
                          {c.text}
                        </p>
                        <span style={styles.commentTime}>{c.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interaction & Likes bar */}
                <div style={styles.modalInteractionsBar}>
                  <div style={styles.modalActionButtons}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button style={styles.modalActionBtn} onClick={() => toggleLike(selectedPost.id)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill={likedPosts[selectedPost.id] ? "#ed4956" : "none"} stroke={likedPosts[selectedPost.id] ? "none" : "#262626"} strokeWidth="2">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                      <button style={styles.modalActionBtn}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                        </svg>
                      </button>
                      <button style={styles.modalActionBtn} onClick={() => {
                        setSelectedPost(null);
                        handleCreateChat("1"); // Route to standard chat with direct
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                      </button>
                    </div>
                    <button style={styles.modalActionBtn}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                    </button>
                  </div>
                  <div style={styles.likesCountText}>
                    {likedPosts[selectedPost.id] ? "Вам и еще 12,301 людям это нравится" : `Нравится: ${selectedPost.likes}`}
                  </div>
                  <div style={styles.postDateStamp}>ВЧЕРА</div>
                </div>

                {/* Add comment input bar */}
                <div style={styles.modalCommentInputBar}>
                  <input
                    style={styles.modalCommentInput}
                    placeholder="Добавить комментарий..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                  />
                  <button
                    style={{
                      ...styles.modalPostCommentBtn,
                      opacity: newCommentText.trim() ? 1 : 0.4
                    }}
                    disabled={!newCommentText.trim()}
                    onClick={() => {
                      selectedPost.mockComments.push({
                        user: "you_explore",
                        avatar: "https://picsum.photos/seed/you/80/80",
                        text: newCommentText,
                        time: "1s"
                      });
                      setNewCommentText("");
                    }}
                  >
                    Опубликовать
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Global Styles */}
      <style>{`
        /* Smooth scale-up and overlay animations on Explore Grid */
        .explore-overlay {
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        div:hover > .explore-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

// ─── Premium Visual Aesthetics & Styles ─────────────────────────────────────────

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    width: "100%",
    background: "#fafafa",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  header: {
    padding: "12px 24px",
    background: "#fff",
    borderBottom: "1px solid #efefef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    position: "sticky" as const,
    top: 0,
  },

  searchBarWrapper: {
    position: "relative" as const,
    display: "flex",
    alignItems: "center",
    width: "100%",
    maxWidth: 500,
  },
  searchIconWrapper: {
    position: "absolute" as const,
    left: 14,
    display: "flex",
    alignItems: "center",
  },
  searchInput: {
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: "none",
    background: "#efefef",
    padding: "0 40px 0 44px",
    fontSize: 14,
    color: "#262626",
    outline: "none",
    transition: "background 0.2s ease, box-shadow 0.2s ease",
    ":focus": {
      background: "#fff",
      boxShadow: "0 0 0 2px #0095f6",
    }
  },
  clearBtn: {
    position: "absolute" as const,
    right: 14,
    background: "none",
    border: "none",
    color: "#8e8e8e",
    fontSize: 14,
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mainContent: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "24px 20px",
  },

  // Explore grid
  exploreGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 4,
    width: "100%",
    maxWidth: 935,
    margin: "0 auto",
  },
  gridItem: {
    position: "relative" as const,
    aspectRatio: "1 / 1",
    overflow: "hidden",
    cursor: "pointer",
    background: "#efefef",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    display: "block",
  },
  overlay: {
    position: "absolute" as const,
    inset: 0,
    background: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayStats: {
    display: "flex",
    gap: 30,
    color: "#fff",
  },
  overlayStat: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.15s ease",
    ":hover": {
      transform: "scale(1.1)",
    }
  },
  overlayStatVal: {
    fontFamily: '-apple-system, system-ui, sans-serif',
  },

  // Matched Users List
  userListContainer: {
    width: "100%",
    maxWidth: 600,
    margin: "0 auto",
  },
  loadingSpinnerWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #0095f6",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  noResultsWrapper: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 0",
    textAlign: "center" as const,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 600,
    color: "#262626",
    margin: "16px 0 8px",
  },
  noResultsSubText: {
    fontSize: 14,
    color: "#8e8e8e",
    margin: 0,
  },
  usersList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    padding: "14px 18px",
    background: "#fff",
    border: "1px solid #efefef",
    borderRadius: 14,
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
    }
  },
  userAvatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    overflow: "hidden",
    marginRight: 16,
    flexShrink: 0,
    background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    padding: 2,
  },
  userAvatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    borderRadius: "50%",
    border: "2px solid #fff",
  },
  userAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    border: "2px solid #fff",
    background: "#efefef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  userInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
  },
  userNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#262626",
  },
  verifiedBadge: {
    background: "#0095f6",
    color: "#fff",
    borderRadius: "50%",
    width: 14,
    height: 14,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 8,
    fontWeight: 900,
  },
  userFullName: {
    fontSize: 13,
    color: "#8e8e8e",
    marginTop: 2,
  },
  userSubCount: {
    fontSize: 11,
    color: "#0095f6",
    fontWeight: 600,
    marginTop: 4,
  },
  messageBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "none",
    background: "#0095f6",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    ":hover": {
      background: "#1877f2",
    }
  },

  // Explore Post Details Modal
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalContainer: {
    position: "relative" as const,
    background: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 960,
    height: "100%",
    maxHeight: 600,
    overflow: "hidden",
    boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
  },
  closeModalBtn: {
    position: "absolute" as const,
    top: 14,
    right: 14,
    background: "rgba(255, 255, 255, 0.8)",
    border: "none",
    borderRadius: "50%",
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: 14,
    color: "#262626",
    zIndex: 1010,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    transition: "background 0.2s",
    ":hover": {
      background: "#fff",
    }
  },
  modalMain: {
    display: "flex",
    height: "100%",
    width: "100%",
  },
  modalImageCol: {
    flex: 1.2,
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  modalDetailsCol: {
    flex: 0.8,
    display: "flex",
    flexDirection: "column" as const,
    background: "#fff",
    borderLeft: "1px solid #efefef",
  },
  modalDetailsHeader: {
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #efefef",
  },
  modalAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    marginRight: 12,
    objectFit: "cover" as const,
  },
  modalAuthorInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
  },
  modalAuthorNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  modalAuthorName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#262626",
  },
  modalVerifiedBadge: {
    background: "#0095f6",
    color: "#fff",
    borderRadius: "50%",
    width: 12,
    height: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 7,
    fontWeight: 900,
  },
  modalLocation: {
    fontSize: 11,
    color: "#8e8e8e",
    marginTop: 2,
  },
  moreOptionsBtn: {
    background: "none",
    border: "none",
    color: "#262626",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },
  commentsContainer: {
    flex: 1,
    overflowY: "auto" as const,
    padding: 20,
    display: "flex",
    flexDirection: "column" as const,
    gap: 18,
  },
  descriptionRow: {
    display: "flex",
    gap: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    objectFit: "cover" as const,
    flexShrink: 0,
  },
  commentTextContainer: {
    display: "flex",
    flexDirection: "column" as const,
  },
  commentContent: {
    fontSize: 13,
    lineHeight: "1.5",
    color: "#262626",
    margin: 0,
  },
  commentUser: {
    fontWeight: 600,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 11,
    color: "#8e8e8e",
    marginTop: 6,
  },
  commentRow: {
    display: "flex",
    gap: 12,
  },
  modalInteractionsBar: {
    padding: "12px 20px 16px",
    borderTop: "1px solid #efefef",
    background: "#fff",
  },
  modalActionButtons: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalActionBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 2,
    display: "flex",
    alignItems: "center",
    color: "#262626",
  },
  likesCountText: {
    fontSize: 13,
    fontWeight: 600,
    color: "#262626",
  },
  postDateStamp: {
    fontSize: 10,
    color: "#8e8e8e",
    marginTop: 6,
    letterSpacing: "0.2px",
  },
  modalCommentInputBar: {
    borderTop: "1px solid #efefef",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    background: "#fff",
  },
  modalCommentInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 13,
    color: "#262626",
  },
  modalPostCommentBtn: {
    background: "none",
    border: "none",
    color: "#0095f6",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  }
};
