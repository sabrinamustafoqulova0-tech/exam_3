"use client";

import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import {
  useGetChatsQuery,
  useGetChatByIdQuery,
  useGetUsersQuery,
  useCreateChatMutation,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useDeleteChatMutation,
  type Chat,
  type User,
} from "@/app/services/chatApi";

export default function MessagesPage() {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState("gif"); // 'stickers', 'gif', 'music'
  const [activeStickerCategory, setActiveStickerCategory] = useState("giphy");
  const [stickerSearch, setStickerSearch] = useState("");
  const [gifSearch, setGifSearch] = useState("");
  const [musicSearch, setMusicSearch] = useState("");
  const [activeMusicTab, setActiveMusicTab] = useState("popular");
  const [savedMusicIds, setSavedMusicIds] = useState<string[]>(["m1"]);
  const [selectedNewChatUserId, setSelectedNewChatUserId] = useState<string | null>(null);
  const [isSidebarSearchFocused, setIsSidebarSearchFocused] = useState(false);
  const [sidebarSearchText, setSidebarSearchText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── RTK Query hooks ────────────────────────────────────────────────────────
  const { data: chats = [], isLoading: chatsLoading } = useGetChatsQuery();
  const {
    data: activeChat,
    isLoading: chatLoading,
  } = useGetChatByIdQuery(selectedChatId!, { skip: !selectedChatId });

  const [createChat, { isLoading: creating }] = useCreateChatMutation();

  // User search for new chat modal
  const { data: foundUsers = [], isFetching: searchingUsers } = useGetUsersQuery(
    searchQuery.trim() ? { UserName: searchQuery.trim() } : undefined,
    { skip: !showNewChat }
  );

  // User search for sidebar search
  const { data: sidebarFoundUsers = [], isFetching: searchingSidebarUsers } = useGetUsersQuery(
    sidebarSearchText.trim() ? { UserName: sidebarSearchText.trim() } : undefined,
    { skip: !isSidebarSearchFocused || !sidebarSearchText.trim() }
  );

  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [deleteMessage] = useDeleteMessageMutation();
  const [deleteChat] = useDeleteChatMutation();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateChat = async (userId: string) => {
    try {
      const newChatId = await createChat(userId).unwrap();
      setSelectedChatId(newChatId);
      setSearchQuery("");
      setShowNewChat(false);
      setSelectedNewChatUserId(null);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !selectedFile) || !selectedChatId) return;

    try {
      await sendMessage({
        ChatId: selectedChatId,
        MessageText: messageText.trim() || "",
        File: selectedFile,
      }).unwrap();

      setMessageText("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Error: " + (err?.data?.errors?.join(", ") || err?.message || JSON.stringify(err)));
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    if (!selectedChatId) return;
    try {
      await sendMessage({
        ChatId: selectedChatId,
        MessageText: gifUrl,
        File: null,
      }).unwrap();
      setShowStickerPicker(false);
    } catch (err: any) {
      console.error("Failed to send GIF:", err);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!selectedChatId) return;
    try {
      await deleteMessage({ messageId, chatId: selectedChatId }).unwrap();
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleDeleteChat = async (chatId: number) => {
    try {
      await deleteChat(chatId).unwrap();
      if (selectedChatId === chatId) setSelectedChatId(null);
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const selectedChatInfo = chats.find((c: Chat) => c.chatId === selectedChatId);

  // Helper to determine if a file is a video
  const isVideo = (filename: string) => {
    return /\.(mp4|webm|ogg|mov)$/i.test(filename);
  };

  const isGifUrl = (text: string) => text?.startsWith("https://media.giphy.com/");

  const MOCK_GIFS = [
    { id: "1", url: "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif", title: "hello hi wave" },
    { id: "2", url: "https://media.giphy.com/media/l41YkxvU8c7J7Bba0/giphy.gif", title: "laugh haha lol" },
    { id: "3", url: "https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif", title: "yes agree nod" },
    { id: "4", url: "https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif", title: "no nope shake" },
    { id: "5", url: "https://media.giphy.com/media/26AHONQ79FdWZhAIw/giphy.gif", title: "love heart kiss" },
    { id: "6", url: "https://media.giphy.com/media/l0HlOBZcl7sbV6VgO/giphy.gif", title: "cry sad tears" },
    { id: "7", url: "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif", title: "excited happy yay" },
    { id: "8", url: "https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif", title: "angry mad rage" },
    { id: "9", url: "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif", title: "cat typing work" },
    { id: "10", url: "https://media.giphy.com/media/11ISwbgCxEzMyY/giphy.gif", title: "dog smile cute" },
    { id: "11", url: "https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif", title: "popcorn waiting" },
    { id: "12", url: "https://media.giphy.com/media/vFKqnCdLPNOKc/giphy.gif", title: "batman thumbs up" }
  ];

  const RECENT_GIFS = [MOCK_GIFS[0], MOCK_GIFS[8], MOCK_GIFS[4], MOCK_GIFS[11]];
  const STICKERS_GIFS = [MOCK_GIFS[1], MOCK_GIFS[2], MOCK_GIFS[3], MOCK_GIFS[5], MOCK_GIFS[6], MOCK_GIFS[7]];
  const BUGCAT_GIFS = [MOCK_GIFS[8], MOCK_GIFS[9]];
  const LOVE_GIFS = [MOCK_GIFS[4], MOCK_GIFS[6], MOCK_GIFS[1]];
  const CLOUD_GIFS = [MOCK_GIFS[5], MOCK_GIFS[7], MOCK_GIFS[10]];
  const LIPS_GIFS = [MOCK_GIFS[2], MOCK_GIFS[3], MOCK_GIFS[0]];

  const MOCK_MUSIC = [
    { id: "m1", title: "Like That", artist: "Mzade", cover: "https://picsum.photos/seed/m1/100/100", reelsCount: "102", duration: "2:16" },
    { id: "m2", title: "Обнял, поцеловал X Tuesday", artist: "ForceTx", cover: "https://picsum.photos/seed/m2/100/100", reelsCount: "11 тыс.", duration: "2:45" },
    { id: "m3", title: "Ailem Için", artist: "MIDWAVES", cover: "https://picsum.photos/seed/m3/100/100", reelsCount: "3,1 тыс.", duration: "1:58" },
    { id: "m4", title: "Ride It (Slowed)", artist: "Aziza Qobilova", cover: "https://picsum.photos/seed/m4/100/100", reelsCount: "130", duration: "3:10" },
    { id: "m5", title: "Болалигим сенхам", artist: "ZEYMBA MUSIC", cover: "https://picsum.photos/seed/m5/100/100", reelsCount: "2,4 тыс.", duration: "2:22" },
    { id: "m6", title: "Wanna Be Yours", artist: "Arctic Monkeys", cover: "https://picsum.photos/seed/m6/100/100", reelsCount: "500 тыс.", duration: "3:04" },
    { id: "m7", title: "Starboy", artist: "The Weeknd", cover: "https://picsum.photos/seed/m7/100/100", reelsCount: "1,2 млн", duration: "3:50" },
    { id: "m8", title: "Blinding Lights", artist: "The Weeknd", cover: "https://picsum.photos/seed/m8/100/100", reelsCount: "2,5 млн", duration: "3:22" },
    { id: "m9", title: "Sweater Weather", artist: "The Neighbourhood", cover: "https://picsum.photos/seed/m9/100/100", reelsCount: "800 тыс.", duration: "4:00" },
    { id: "m10", title: "Summertime Sadness", artist: "Lana Del Rey", cover: "https://picsum.photos/seed/m10/100/100", reelsCount: "300 тыс.", duration: "4:25" },
    { id: "m11", title: "As It Was", artist: "Harry Styles", cover: "https://picsum.photos/seed/m11/100/100", reelsCount: "4,1 млн", duration: "2:47" },
    { id: "m12", title: "Bones", artist: "Imagine Dragons", cover: "https://picsum.photos/seed/m12/100/100", reelsCount: "900 тыс.", duration: "2:45" },
  ];

  const STICKER_CATEGORIES = [
    { id: "recent", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>, title: "Недавнее" },
    { id: "stickers", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>, title: "Стикеры" },
    { id: "giphy", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>, title: "GIPHY" },
    { id: "bugcat", icon: <img src={BUGCAT_GIFS[0].url} alt="bugcat" style={{ width: 32, height: 32, objectFit: "contain" }} />, title: "BugCat Capoo" },
    { id: "love", icon: <img src={LOVE_GIFS[0].url} alt="love" style={{ width: 32, height: 32, objectFit: "contain" }} />, title: "Hearts" },
    { id: "cloud", icon: <span style={{ fontSize: 28, lineHeight: 1 }}>☁️</span>, title: "Weather" },
    { id: "lips", icon: <span style={{ fontSize: 28, lineHeight: 1 }}>👄</span>, title: "Reactions" },
  ];

  const filteredGifs = MOCK_GIFS.filter(g => g.title.includes(stickerSearch.toLowerCase()));

  const renderStickerContent = () => {
    if (activeStickerCategory === "recent") {
      return (
        <>
          <h4 style={styles.stickerTitle}>Недавнее</h4>
          <div style={styles.stickerGrid}>
            {RECENT_GIFS.map((gif) => (
              <img key={gif.id} src={gif.url} alt="gif" style={styles.stickerImg} onClick={() => handleSendGif(gif.url)} />
            ))}
          </div>
        </>
      );
    }
    if (activeStickerCategory === "stickers") {
      return (
        <>
          <h4 style={styles.stickerTitle}>Стикеры</h4>
          <div style={styles.stickerGrid}>
            {STICKERS_GIFS.map((gif) => (
              <img key={gif.id} src={gif.url} alt="gif" style={styles.stickerImg} onClick={() => handleSendGif(gif.url)} />
            ))}
          </div>
        </>
      );
    }
    if (activeStickerCategory === "giphy") {
      return (
        <>
          <h4 style={styles.stickerTitle}>GIPHY</h4>
          <div style={styles.stickerGrid}>
            {filteredGifs.map((gif) => (
              <img 
                key={gif.id} 
                src={gif.url} 
                alt="gif" 
                style={styles.stickerImg} 
                onClick={() => handleSendGif(gif.url)}
              />
            ))}
            {filteredGifs.length === 0 && <span style={{ color: "#8e8e8e", fontSize: 13 }}>Ничего не найдено</span>}
          </div>
        </>
      );
    }
    if (activeStickerCategory === "bugcat") {
      return (
        <>
          <h4 style={styles.stickerTitle}>BugCat Capoo</h4>
          <div style={styles.stickerGrid}>
            {BUGCAT_GIFS.map((gif) => (
              <img 
                key={gif.id} 
                src={gif.url} 
                alt="bugcat" 
                style={styles.stickerImg} 
                onClick={() => handleSendGif(gif.url)}
              />
            ))}
          </div>
        </>
      );
    }
    if (activeStickerCategory === "love") {
       return (
        <>
          <h4 style={styles.stickerTitle}>Love & Hearts</h4>
          <div style={styles.stickerGrid}>
            {LOVE_GIFS.map((gif) => (
              <img 
                key={gif.id} 
                src={gif.url} 
                alt="love" 
                style={styles.stickerImg} 
                onClick={() => handleSendGif(gif.url)}
              />
            ))}
          </div>
        </>
      );
    }
    if (activeStickerCategory === "cloud") {
      return (
        <>
          <h4 style={styles.stickerTitle}>Weather</h4>
          <div style={styles.stickerGrid}>
            {CLOUD_GIFS.map((gif) => (
              <img key={gif.id} src={gif.url} alt="cloud" style={styles.stickerImg} onClick={() => handleSendGif(gif.url)} />
            ))}
          </div>
        </>
      );
    }
    if (activeStickerCategory === "lips") {
      return (
        <>
          <h4 style={styles.stickerTitle}>Reactions</h4>
          <div style={styles.stickerGrid}>
            {LIPS_GIFS.map((gif) => (
              <img key={gif.id} src={gif.url} alt="lips" style={styles.stickerImg} onClick={() => handleSendGif(gif.url)} />
            ))}
          </div>
        </>
      );
    }
    
    // Default fallback
    const title = STICKER_CATEGORIES.find(c => c.id === activeStickerCategory)?.title || "Стикеры";
    return (
      <>
        <h4 style={styles.stickerTitle}>{title}</h4>
        <div style={styles.stickerGrid}>
          <span style={{ color: "#8e8e8e", fontSize: 13 }}>Пока пусто</span>
        </div>
      </>
    );
  };

  const renderGifContent = () => {
    const gifs = gifSearch.trim() ? MOCK_GIFS.filter(g => g.title.includes(gifSearch.toLowerCase())) : MOCK_GIFS;
    return (
      <div style={styles.gifGrid}>
        {gifs.map((gif) => (
          <img 
            key={gif.id} 
            src={gif.url} 
            alt="gif" 
            style={styles.gifImg} 
            onClick={() => handleSendGif(gif.url)}
          />
        ))}
        {gifs.length === 0 && <span style={{ color: "#8e8e8e", fontSize: 13, gridColumn: "1 / -1", textAlign: "center" }}>Ничего не найдено</span>}
      </div>
    );
  };

  const renderMusicContent = () => {
    const musicData = activeMusicTab === "saved" ? MOCK_MUSIC.filter(m => savedMusicIds.includes(m.id)) : MOCK_MUSIC;
    const filteredMusic = musicSearch.trim() ? musicData.filter(m => m.title.toLowerCase().includes(musicSearch.toLowerCase())) : musicData;
    
    return (
      <div style={styles.musicList}>
        {filteredMusic.map((track) => {
          const isSaved = savedMusicIds.includes(track.id);
          return (
            <div key={track.id} style={styles.musicItem} onClick={() => {
              if(selectedChatId) {
                sendMessage({ ChatId: selectedChatId, MessageText: `🎵 ${track.artist} - ${track.title}`, File: null });
                setShowStickerPicker(false);
              }
            }}>
              <div style={styles.musicCover}>
                 <img src={track.cover} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={styles.musicInfo}>
                <div style={styles.musicTitle}>{track.title}</div>
                <div style={styles.musicMeta}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                  {track.artist} · {track.reelsCount} видео Reels · {track.duration}
                </div>
              </div>
              <button 
                style={styles.musicSaveBtn} 
                onClick={(e) => { 
                  e.stopPropagation();
                  setSavedMusicIds(prev => isSaved ? prev.filter(id => id !== track.id) : [...prev, track.id]);
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isSaved ? "#000" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>
          );
        })}
        {filteredMusic.length === 0 && <span style={{ color: "#8e8e8e", fontSize: 13, textAlign: "center", display: "block" }}>Ничего не найдено</span>}
      </div>
    );
  };

  // ─── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* ── Left Panel: Chat List ──────────────────────────────────────────── */}
      <aside style={styles.sidebar}>
        {!isSidebarSearchFocused && (
          <div style={styles.sidebarHeader}>
            <div style={styles.sidebarTitleWrapper}>
              <h2 style={styles.sidebarTitle}>Azim_Developer</h2>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 4 }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            <button
              style={styles.newChatBtn}
              onClick={() => setShowNewChat(!showNewChat)}
              title="New chat"
            >
              <svg aria-label="Новое сообщение" color="#000" fill="#000" height="24" role="img" viewBox="0 0 24 24" width="24">
                <path d="M12.202 3.203H5.25a3 3 0 0 0-3 3V18.75a3 3 0 0 0 3 3h12.547a3 3 0 0 0 3-3v-6.952" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <path d="M10.002 17.226H6.774v-3.228L18.607 2.165a1.417 1.417 0 0 1 2.004 0l1.224 1.225a1.417 1.417 0 0 1 0 2.004Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.848" x2="20.076" y1="3.924" y2="7.153"></line>
              </svg>
            </button>
          </div>
        )}

        <div style={{ ...styles.sidebarSearchWrapper, paddingTop: isSidebarSearchFocused ? 36 : 0 }}>
          <div style={styles.sidebarSearchRow}>
            {isSidebarSearchFocused && (
              <button style={styles.sidebarSearchBackBtn} onClick={() => { setIsSidebarSearchFocused(false); setSidebarSearchText(""); }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            <div style={{...styles.sidebarSearchInner, flex: 1}}>
              {!isSidebarSearchFocused && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              )}
              <input 
                style={styles.sidebarSearchInput} 
                placeholder="Поиск" 
                value={sidebarSearchText}
                onChange={(e) => setSidebarSearchText(e.target.value)}
                onFocus={() => setIsSidebarSearchFocused(true)}
              />
              {isSidebarSearchFocused && sidebarSearchText && (
                <button style={styles.sidebarSearchClearBtn} onClick={() => setSidebarSearchText("")}>
                  <div style={styles.sidebarSearchClearInner}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* New chat modal */}
        {showNewChat && (
          <div style={styles.modalOverlay} onClick={() => { setShowNewChat(false); setSearchQuery(""); setSelectedNewChatUserId(null); }}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div style={{ width: 24 }} /> {/* Placeholder to balance close button */}
                <h3 style={styles.modalTitle}>Новое сообщение</h3>
                <button
                  style={styles.modalClose}
                  onClick={() => { setShowNewChat(false); setSearchQuery(""); setSelectedNewChatUserId(null); }}
                >
                  ✕
                </button>
              </div>
              <div style={styles.modalSearchBox}>
                <span style={styles.modalSearchLabel}>Кому:</span>
                <input
                  style={styles.modalSearchInput}
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={styles.modalUserList}>
                {searchingUsers ? (
                  <div style={styles.modalHint}>Loading...</div>
                ) : foundUsers.length === 0 ? (
                  <div style={styles.modalHint}>No users found</div>
                ) : (
                  foundUsers.map((user: User) => (
                    <button
                      key={user.id}
                      style={styles.modalUserItem}
                      onClick={() => setSelectedNewChatUserId(user.id)}
                      disabled={creating}
                    >
                      <div style={styles.modalUserAvatar}>
                        {user.avatar ? (
                          <img
                            src={`https://instagram-api.softclub.tj/images/${user.avatar}`}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          user.userName[0].toUpperCase()
                        )}
                      </div>
                      <div style={styles.modalUserInfo}>
                        <div style={styles.modalUserName}>{user.userName}</div>
                        <div style={styles.modalUserEmail}>{user.fullName || ""}</div>
                      </div>
                      <div style={styles.modalRadioBtn}>
                        {selectedNewChatUserId === user.id && <div style={styles.modalRadioInner} />}
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div style={styles.modalFooter}>
                <button
                  style={{
                    ...styles.modalChatBtn,
                    opacity: selectedNewChatUserId ? 1 : 0.4,
                  }}
                  disabled={!selectedNewChatUserId || creating}
                  onClick={() => {
                     if (selectedNewChatUserId) handleCreateChat(selectedNewChatUserId);
                  }}
                >
                  Чат
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat list or Search Results */}
        {isSidebarSearchFocused ? (
          <div style={styles.sidebarSearchResults}>
            {(() => {
              const searchText = sidebarSearchText.trim().toLowerCase();
              const filteredChats = chats.filter((c: Chat) => c.receiveUserName?.toLowerCase().includes(searchText));
              
              // Filter out global users that are already in the local chats
              const filteredGlobalUsers = sidebarFoundUsers.filter((u: User) => 
                 !filteredChats.some((c: Chat) => c.receiveUserId === u.id || c.receiveUserName === u.userName)
              );
              
              if (searchText && filteredChats.length === 0 && filteredGlobalUsers.length === 0 && !searchingSidebarUsers) {
                return <div style={styles.emptyText}>Совпадений не найдено</div>;
              }

              return (
                <>
                  {filteredChats.length > 0 && <div style={styles.searchResultsTitle}>Сообщения</div>}
                  {filteredChats.map((chat: Chat) => (
                    <div
                      key={chat.chatId}
                      style={{
                        ...styles.chatItem,
                        ...(selectedChatId === chat.chatId ? styles.chatItemActive : {}),
                      }}
                      onClick={() => {
                        setSelectedChatId(chat.chatId);
                        setIsSidebarSearchFocused(false);
                        setSidebarSearchText("");
                      }}
                    >
                      <div style={styles.chatAvatar}>
                        {chat.receiveUserImage ? (
                          <img
                            src={`https://instagram-api.softclub.tj/images/${chat.receiveUserImage}`}
                            alt=""
                            style={styles.avatarImg}
                          />
                        ) : (
                          <div style={styles.avatarPlaceholder}>
                            {(chat.receiveUserName || "?")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div style={styles.chatInfo}>
                        <div style={styles.chatName}>{chat.receiveUserName}</div>
                        <div style={styles.chatLastMsg}>No messages yet</div>
                      </div>
                    </div>
                  ))}
                  
                  {searchingSidebarUsers && searchText && <div style={styles.loadingText}>Поиск...</div>}
                  
                  {!searchingSidebarUsers && searchText && filteredGlobalUsers.length > 0 && (
                    <>
                      <div style={styles.searchResultsTitle}>Ещё аккаунты</div>
                      {filteredGlobalUsers.map((user: User) => (
                        <div
                          key={user.id}
                          style={styles.chatItem}
                          onClick={() => {
                            handleCreateChat(user.id);
                            setIsSidebarSearchFocused(false);
                            setSidebarSearchText("");
                          }}
                        >
                          <div style={styles.chatAvatar}>
                            {user.avatar ? (
                              <img src={`https://instagram-api.softclub.tj/images/${user.avatar}`} alt="" style={styles.avatarImg} />
                            ) : (
                              <div style={styles.avatarPlaceholder}>{user.userName[0].toUpperCase()}</div>
                            )}
                          </div>
                          <div style={styles.chatInfo}>
                            <div style={styles.chatName}>{user.userName}</div>
                            <div style={styles.chatLastMsg}>{user.fullName}</div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <div style={styles.chatList}>
          {chatsLoading ? (
            <div style={styles.loadingText}>Loading chats...</div>
          ) : chats.length === 0 ? (
            <div style={styles.emptyText}>No chats yet</div>
          ) : (
            chats.map((chat: Chat) => (
              <div
                key={chat.chatId}
                style={{
                  ...styles.chatItem,
                  ...(selectedChatId === chat.chatId ? styles.chatItemActive : {}),
                }}
                onClick={() => setSelectedChatId(chat.chatId)}
              >
                <div style={styles.chatAvatar}>
                  {chat.receiveUserImage ? (
                    <img
                      src={`https://instagram-api.softclub.tj/images/${chat.receiveUserImage}`}
                      alt=""
                      style={styles.avatarImg}
                    />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {(chat.receiveUserName || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={styles.chatInfo}>
                  <div style={styles.chatName}>
                    {chat.receiveUserName}
                  </div>
                  <div style={styles.chatLastMsg}>
                    No messages yet
                  </div>
                </div>
                <div style={styles.chatMeta}>
                  <span style={styles.chatTime}>
                  </span>
                  <button
                    style={styles.deleteChatBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.chatId);
                    }}
                    title="Delete chat"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </aside>

      {/* ── Right Panel: Chat View ─────────────────────────────────────────── */}
      <main style={styles.main}>
        {!selectedChatId ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconWrapper}>
              <svg aria-label="Direct" color="#000" fill="#000" height="96" role="img" viewBox="0 0 96 96" width="96">
                <circle cx="48" cy="48" fill="none" r="47" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></circle>
                <path d="M69.286 20.362 21.928 35.787c-2.41 1.096-2.52 4.453-.16 5.688l15.536 8.57 26.155-21.728a1.218 1.218 0 0 1 1.583 1.834L40.941 53.64l8.344 19.388c1.171 2.42 4.673 2.502 5.962.162l18.423-50.627a3.003 3.003 0 0 0-4.384-2.201Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <h3 style={styles.emptyTitle}>Ваши сообщения</h3>
            <p style={styles.emptyDesc}>Отправляйте личные фото и сообщения другу или группе</p>
            <button style={styles.sendMsgPrimaryBtn} onClick={() => setShowNewChat(true)}>Отправить сообщение</button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderLeft}>
                <div style={styles.chatAvatarSm}>
                  {selectedChatInfo?.receiveUserImage ? (
                    <img
                      src={`https://instagram-api.softclub.tj/images/${selectedChatInfo.receiveUserImage}`}
                      alt=""
                      style={styles.avatarImg}
                    />
                  ) : (
                    <div style={styles.avatarPlaceholderSm}>
                      {(selectedChatInfo?.receiveUserName || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <span style={styles.chatHeaderName}>
                  {selectedChatInfo?.receiveUserName || "Chat"}
                </span>
              </div>
            </div>

            {/* Messages area */}
            <div style={styles.messagesArea}>
              {chatLoading ? (
                <div style={styles.loadingText}>Loading messages...</div>
              ) : !activeChat?.length ? (
                <div style={styles.emptyText}>No messages in this chat</div>
              ) : (
                [...activeChat].reverse().map((msg) => {
                  // We assume the message is 'other' if the userId matches the selected chat's receiveUserId,
                  // Otherwise, it's 'own'. (Fallback: if not receiveUserId, it must be the current logged-in user)
                  const isOwn = msg.userId !== selectedChatInfo?.receiveUserId;
                  return (
                    <div
                      key={msg.messageId}
                      style={{
                        ...styles.messageRow,
                        justifyContent: isOwn ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          ...styles.messageBubble,
                          ...(isOwn ? styles.ownBubble : styles.otherBubble),
                        }}
                      >
                        {msg.file && (
                          isVideo(msg.file) ? (
                            <video
                              src={`https://instagram-api.softclub.tj/images/${msg.file}`}
                              controls
                              style={styles.messageImage}
                            />
                          ) : (
                            <img
                              src={`https://instagram-api.softclub.tj/images/${msg.file}`}
                              alt="attachment"
                              style={styles.messageImage}
                            />
                          )
                        )}
                        {msg.messageText && isGifUrl(msg.messageText) ? (
                          <img src={msg.messageText} alt="gif" style={{ width: 180, borderRadius: 12, display: 'block' }} />
                        ) : msg.messageText ? (
                          <p style={styles.messageText}>{msg.messageText}</p>
                        ) : null}
                        <div style={styles.messageFooter}>
                          <span style={styles.messageTime}>
                            {formatTime(msg.sendMassageDate)}
                          </span>
                          {isOwn && (
                            <button
                              style={styles.deleteMsgBtn}
                              onClick={() => handleDeleteMessage(msg.messageId)}
                              title="Delete message"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send message form */}
            <div style={styles.inputBar}>
              {selectedFile && (
                <div style={styles.filePreview}>
                  <span style={styles.fileName}>{selectedFile.name}</span>
                  <button
                    style={styles.removeFile}
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
              
              <div style={styles.inputRow}>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <button
                    style={styles.attachBtn}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Emoji"
                  >
                    <svg aria-label="Смайлики" color="#000" fill="#000" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09-.04 1 1 0 0 0-1.55-1.222ZM12 2.052A9.948 9.948 0 1 0 21.948 12 9.96 9.96 0 0 0 12 2.052Zm0 17.91A7.962 7.962 0 1 1 19.962 12 7.971 7.971 0 0 1 12 19.962Z"></path></svg>
                  </button>

                  {/* Emoji Picker Popup */}
                  {showEmojiPicker && (
                    <div style={styles.emojiPicker}>
                      <EmojiPicker 
                        onEmojiClick={(emojiData) => {
                          setMessageText((prev) => prev + emojiData.emoji);
                        }}
                        width="100%"
                        height="100%"
                      />
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <input
                  style={styles.textInput}
                  placeholder="Напишите сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onClick={() => { setShowEmojiPicker(false); setShowStickerPicker(false); }}
                />
                
                <div style={{ position: "relative" }}>
                  {messageText.trim() || selectedFile ? (
                    <button
                      style={styles.sendTextBtn}
                      onClick={handleSendMessage}
                      disabled={sending}
                    >
                      {sending ? "..." : "Отправить"}
                    </button>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button style={styles.attachBtn} title="Voice message">
                        <svg aria-label="Голосовое сообщение" color="#000" fill="#000" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M12 15a4 4 0 0 0 4-4V5a4 4 0 0 0-8 0v6a4 4 0 0 0 4 4Zm5-4a1 1 0 0 0-2 0 3 3 0 0 1-6 0 1 1 0 0 0-2 0 5.002 5.002 0 0 0 4 4.898V19h-2a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-3.102A5.002 5.002 0 0 0 17 11Z"></path></svg>
                      </button>
                      <button style={styles.attachBtn} onClick={() => fileInputRef.current?.click()} title="Attach file">
                        <svg aria-label="Добавить фото или видео" color="#000" fill="#000" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557Z" fillRule="evenodd"></path><path d="M2 18.605l3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path><path d="M18.44 2.004A3.56 3.56 0 0 1 22 5.564h0v12.873a3.56 3.56 0 0 1-3.56 3.56H5.568a3.56 3.56 0 0 1-3.56-3.56V5.563a3.56 3.56 0 0 1 3.56-3.56Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                      </button>
                      <button style={styles.attachBtn} onClick={() => setShowStickerPicker(!showStickerPicker)} title="Sticker">
                        <svg aria-label="Выбрать стикер" color="#000" fill="#000" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M21.56 12.384l-10-10a2.235 2.235 0 0 0-3.141 0l-6.036 6.035a2.235 2.235 0 0 0 0 3.14l10 10a2.235 2.235 0 0 0 3.14 0l6.036-6.035a2.235 2.235 0 0 0 .001-3.14Zm-4.475 2.378l-5.32 5.32c-.443.443-1.035.127-1.035-.5v-4.186a1.002 1.002 0 0 1 1-1h4.186c.627 0 .943.592.5 1.035l.669-.669Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                      </button>
                    </div>
                  )}

                  {/* Sticker / GIF Picker Popup */}
                  {showStickerPicker && (
                    <div style={styles.stickerPicker}>
                      {/* Tabs */}
                      <div style={styles.stickerTabs}>
                        <button 
                          style={activeMainTab === "stickers" ? styles.stickerTabActive : styles.stickerTab}
                          onClick={() => setActiveMainTab("stickers")}
                        >
                          <svg aria-label="Стикеры" color={activeMainTab === "stickers" ? "#000" : "#8e8e8e"} fill={activeMainTab === "stickers" ? "#000" : "#8e8e8e"} height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M21.56 12.384l-10-10a2.235 2.235 0 0 0-3.141 0l-6.036 6.035a2.235 2.235 0 0 0 0 3.14l10 10a2.235 2.235 0 0 0 3.14 0l6.036-6.035a2.235 2.235 0 0 0 .001-3.14Zm-4.475 2.378l-5.32 5.32c-.443.443-1.035.127-1.035-.5v-4.186a1.002 1.002 0 0 1 1-1h4.186c.627 0 .943.592.5 1.035l.669-.669Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </button>
                        <button 
                          style={activeMainTab === "gif" ? styles.stickerTabActive : styles.stickerTab}
                          onClick={() => setActiveMainTab("gif")}
                        >
                          <svg aria-label="GIF" color={activeMainTab === "gif" ? "#000" : "#8e8e8e"} fill={activeMainTab === "gif" ? "#000" : "#8e8e8e"} height="24" role="img" viewBox="0 0 24 24" width="24"><rect fill="none" height="14" rx="3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" width="20" x="2" y="5"></rect><path d="M6 14.5v-5a1.5 1.5 0 0 1 3 0v.5M12.5 14.5v-5M15.5 14.5v-5h3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                        </button>
                        <button 
                          style={activeMainTab === "music" ? styles.stickerTabActive : styles.stickerTab}
                          onClick={() => setActiveMainTab("music")}
                        >
                          <svg aria-label="Музыка" color={activeMainTab === "music" ? "#000" : "#8e8e8e"} fill={activeMainTab === "music" ? "#000" : "#8e8e8e"} height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M12 2.052A9.948 9.948 0 1 0 21.948 12 9.96 9.96 0 0 0 12 2.052Zm0 17.91A7.962 7.962 0 1 1 19.962 12 7.971 7.971 0 0 1 12 19.962Zm5-12.462h-4.5a.5.5 0 0 0-.5.5v5.5a2.5 2.5 0 1 0 1 1.95v-4.45h3a.5.5 0 0 0 .5-.5v-2.5a.5.5 0 0 0-.5-.5Z" fill="currentColor"></path></svg>
                        </button>
                      </div>

                      {activeMainTab === "stickers" && (
                        <>
                          <div style={styles.stickerSearchWrapper}>
                            <div style={styles.stickerSearchInner}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              </svg>
                              <input 
                                style={styles.stickerSearchInput} 
                                placeholder="Поиск стикеров" 
                                value={stickerSearch}
                                onChange={(e) => setStickerSearch(e.target.value)}
                              />
                            </div>
                          </div>
                          <div style={styles.stickerCategories} className="hide-scrollbar">
                            {STICKER_CATEGORIES.map(cat => (
                              <div 
                                key={cat.id} 
                                style={activeStickerCategory === cat.id ? styles.stickerCatActive : styles.stickerCat}
                                onClick={() => setActiveStickerCategory(cat.id)}
                                title={cat.title}
                              >
                                {cat.icon}
                              </div>
                            ))}
                          </div>
                          <div style={styles.stickerContent} className="hide-scrollbar">
                            {renderStickerContent()}
                          </div>
                        </>
                      )}

                      {activeMainTab === "gif" && (
                        <>
                          <div style={styles.stickerSearchWrapper}>
                            <div style={styles.stickerSearchInner}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              </svg>
                              <input 
                                style={styles.stickerSearchInput} 
                                placeholder="Поиск в GIPHY" 
                                value={gifSearch}
                                onChange={(e) => setGifSearch(e.target.value)}
                                autoFocus
                              />
                            </div>
                          </div>
                          <div style={styles.stickerContent} className="hide-scrollbar">
                            {renderGifContent()}
                          </div>
                        </>
                      )}

                      {activeMainTab === "music" && (
                        <>
                          <div style={styles.stickerSearchWrapper}>
                            <div style={styles.stickerSearchInner}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              </svg>
                              <input 
                                style={styles.stickerSearchInput} 
                                placeholder="Поиск музыки" 
                                value={musicSearch}
                                onChange={(e) => setMusicSearch(e.target.value)}
                                autoFocus
                              />
                            </div>
                          </div>
                          
                          <div style={styles.musicTabsWrapper}>
                            <button 
                              style={activeMusicTab === "popular" ? styles.musicTabBtnActive : styles.musicTabBtn}
                              onClick={() => setActiveMusicTab("popular")}
                            >
                              Популярное
                            </button>
                            <button 
                              style={activeMusicTab === "saved" ? styles.musicTabBtnActive : styles.musicTabBtn}
                              onClick={() => setActiveMusicTab("saved")}
                            >
                              Сохраненное
                            </button>
                          </div>

                          <div style={styles.stickerContent} className="hide-scrollbar">
                            {renderMusicContent()}
                          </div>
                        </>
                      )}
                      
                      <div style={styles.stickerPickerArrow} />
                      
                      {/* Hide scrollbar styles injected */}
                      <style>{`
                        .hide-scrollbar::-webkit-scrollbar { display: none; }
                        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                      `}</style>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// ─── Inline Styles ────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    height: "100vh",
    background: "#fafafa",
    fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  // Sidebar
  sidebar: {
    width: 360,
    minWidth: 360,
    borderRight: "1px solid #dbdbdb",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "36px 24px 16px",
  },
  sidebarTitleWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    cursor: "pointer",
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    color: "#000",
  },
  newChatBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarSearchWrapper: {
    padding: "0 24px 16px",
    borderBottom: "1px solid #efefef",
  },
  sidebarSearchInner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#efefef",
    borderRadius: 8,
    padding: "8px 12px",
  },
  sidebarSearchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    width: "100%",
    fontSize: 14,
    color: "#262626",
  },
  sidebarSearchRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  sidebarSearchBackBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarSearchClearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarSearchClearInner: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#c7c7c7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarSearchResults: {
    flex: 1,
    overflowY: "auto" as const,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#000",
    padding: "12px 24px 8px",
    margin: 0,
  },
  // Modal
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#fff",
    borderRadius: 16,
    width: 400,
    maxHeight: "70vh",
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #efefef",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
    color: "#262626",
    flex: 1,
    textAlign: "center" as const,
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#262626",
    padding: 4,
  },
  modalSearchBox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 20px",
    borderBottom: "1px solid #efefef",
  },
  modalSearchLabel: {
    fontWeight: 600,
    fontSize: 14,
    color: "#262626",
  },
  modalSearchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: 14,
    color: "#262626",
    background: "transparent",
  },
  modalUserList: {
    flex: 1,
    overflowY: "auto" as const,
    maxHeight: 320,
  },
  modalHint: {
    textAlign: "center" as const,
    color: "#8e8e8e",
    padding: "32px 20px",
    fontSize: 14,
  },
  modalUserItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "10px 20px",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left" as const,
    transition: "background .15s",
  },
  modalUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  modalUserInfo: {
    flex: 1,
    minWidth: 0,
  },
  modalUserName: {
    fontWeight: 600,
    fontSize: 14,
    color: "#262626",
  },
  modalUserEmail: {
    fontSize: 13,
    color: "#8e8e8e",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  modalRadioBtn: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    border: "2px solid #dbdbdb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  modalRadioInner: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "#0095f6",
  },
  modalFooter: {
    padding: "16px 20px",
  },
  modalChatBtn: {
    width: "100%",
    background: "#0095f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "opacity .15s",
  },

  // Chat list
  chatList: {
    flex: 1,
    overflowY: "auto" as const,
  },
  chatItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    cursor: "pointer",
    transition: "background .15s",
    borderBottom: "1px solid #fafafa",
  },
  chatItemActive: {
    background: "#efefef",
  },
  chatAvatar: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 18,
  },
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  chatName: {
    fontWeight: 600,
    fontSize: 14,
    color: "#262626",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  chatLastMsg: {
    fontSize: 13,
    color: "#8e8e8e",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginTop: 2,
  },
  chatMeta: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: 6,
    flexShrink: 0,
  },
  chatTime: {
    fontSize: 11,
    color: "#8e8e8e",
  },
  deleteChatBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 2,
    color: "#8e8e8e",
    opacity: 0.5,
    transition: "opacity .15s, color .15s",
  },

  // Main area
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    background: "#fff",
  },

  // Empty state
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: "#8e8e8e",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 400,
    color: "#262626",
    margin: 0,
  },
  emptyDesc: {
    fontSize: 14,
    margin: 0,
    color: "#8e8e8e",
  },
  emptyIconWrapper: {
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sendMsgPrimaryBtn: {
    background: "#0095f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    marginTop: 20,
    transition: "background .15s",
  },

  // Chat header
  chatHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #efefef",
  },
  chatHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  chatAvatarSm: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    overflow: "hidden",
  },
  avatarPlaceholderSm: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
  },
  chatHeaderName: {
    fontWeight: 600,
    fontSize: 16,
    color: "#262626",
  },

  // Messages
  messagesArea: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "20px 20px 8px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  messageRow: {
    display: "flex",
    width: "100%",
  },
  messageBubble: {
    maxWidth: "65%",
    padding: "10px 14px",
    borderRadius: 18,
    position: "relative" as const,
  },
  ownBubble: {
    background: "#0095f6",
    color: "#fff",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    background: "#efefef",
    color: "#262626",
    borderBottomLeftRadius: 4,
  },
  messageImage: {
    maxWidth: "100%",
    borderRadius: 12,
    marginBottom: 6,
  },
  messageText: {
    margin: 0,
    fontSize: 14,
    lineHeight: "1.4",
    wordBreak: "break-word" as const,
  },
  messageFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  deleteMsgBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 2,
    opacity: 0.5,
    color: "inherit",
    display: "flex",
    alignItems: "center",
    transition: "opacity .15s",
  },

  // Input bar
  inputBar: {
    padding: "20px 20px",
    background: "#fff",
  },
  filePreview: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    marginBottom: 8,
    background: "#f0f0f0",
    borderRadius: 12,
    fontSize: 13,
    color: "#262626",
  },
  fileName: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  removeFile: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "#8e8e8e",
    padding: 2,
  },
  emojiPicker: {
    position: "absolute" as const,
    bottom: "48px",
    left: 0,
    width: 320,
    height: 400,
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    zIndex: 100,
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid #dbdbdb",
    borderRadius: 24,
    padding: "6px 8px",
    background: "#fff",
  },
  attachBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px",
    color: "#262626",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
  },
  textInput: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 14,
    padding: "8px 4px",
    color: "#262626",
  },
  sendTextBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px 12px",
    color: "#0095f6",
    fontWeight: 600,
    fontSize: 14,
  },
  
  // Custom Sticker Picker
  stickerPicker: {
    position: "absolute" as const,
    bottom: "56px",
    right: 0,
    width: 340,
    height: 440,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    zIndex: 100,
    display: "flex",
    flexDirection: "column" as const,
  },
  stickerPickerArrow: {
    position: "absolute" as const,
    bottom: "-6px",
    right: 20,
    width: 16,
    height: 16,
    background: "#fff",
    transform: "rotate(45deg)",
    boxShadow: "4px 4px 10px rgba(0,0,0,0.05)",
    zIndex: -1,
  },
  stickerTabs: {
    display: "flex",
    borderBottom: "1px solid #efefef",
  },
  stickerTabActive: {
    flex: 1,
    padding: "16px 0",
    background: "none",
    border: "none",
    borderBottom: "2px solid #000",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stickerTab: {
    flex: 1,
    padding: "16px 0",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stickerSearchWrapper: {
    padding: "16px",
  },
  stickerSearchInner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f2f2f2",
    borderRadius: 20,
    padding: "10px 16px",
  },
  stickerSearchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    width: "100%",
    fontSize: 15,
    color: "#262626",
  },
  stickerCategories: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "0 16px 12px",
    overflowX: "auto" as const,
  },
  stickerCatActive: {
    padding: 6,
    width: 44,
    height: 44,
    background: "#efefef",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  stickerCat: {
    padding: 6,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#262626",
    flexShrink: 0,
  },
  stickerContent: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "0 16px 16px",
  },
  stickerTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: "8px 0 16px",
    color: "#000",
  },
  stickerGrid: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  stickerImg: {
    width: "calc(25% - 6px)",
    height: 70,
    objectFit: "contain" as const,
    cursor: "pointer",
    transition: "transform 0.1s",
  },
  gifGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  gifImg: {
    width: "100%",
    height: "auto",
    objectFit: "cover" as const,
    borderRadius: "8px",
    cursor: "pointer",
    transition: "transform 0.1s",
    aspectRatio: "1", // roughly square or we could omit for masonry, let's keep it clean
  },
  musicTabsWrapper: {
    display: "flex",
    gap: 8,
    padding: "0 16px 12px",
  },
  musicTabBtnActive: {
    padding: "8px 16px",
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  musicTabBtn: {
    padding: "8px 16px",
    background: "#f2f2f2",
    color: "#000",
    border: "none",
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "background 0.1s",
  },
  musicList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  musicItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
  },
  musicCover: {
    width: 54,
    height: 54,
    borderRadius: 8,
    overflow: "hidden",
    background: "#efefef",
    flexShrink: 0,
  },
  musicInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  musicTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#262626",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  musicMeta: {
    fontSize: 13,
    color: "#8e8e8e",
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  musicSaveBtn: {
    background: "none",
    border: "none",
    padding: 8,
    color: "#000",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    textAlign: "center" as const,
    color: "#8e8e8e",
    padding: 40,
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center" as const,
    color: "#8e8e8e",
    padding: 40,
    fontSize: 14,
  },
};
