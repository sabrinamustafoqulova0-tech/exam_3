"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  type ChatMessage,
} from "@/app/services/chatApi";
import { GetToken } from "@/app/utils/token";
import {
  useGetUserProfileByIdQuery,
  useGetMyProfileQuery,
} from "@/app/services/postApi";
import EmojiGame from "@/app/components/EmojiGame";
import CallOverlay from "@/app/components/CallOverlay";
import ChatInfoPanel from "@/app/components/ChatInfoPanel";

// JWT Helper to decode logged-in user info
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

const resolveImageUrl = (path: string | null | undefined) => {
  if (!path) return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `https://instagram-api.softclub.tj/images/${path}`;
};

const renderDefaultAvatar = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
    <rect width="24" height="24" fill="#efefef"/>
    <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" fill="#dbdbdb"/>
    <path d="M12 13C8.68629 13 6 15.6863 6 19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19C18 15.6863 15.3137 13 12 13Z" fill="#dbdbdb"/>
  </svg>
);

const isSingleEmoji = (text: string | null | undefined) => {
  if (!text) return false;
  const t = text.trim();
  const chars = [...t];
  if (chars.length !== 1) return false;
  const charCode = t.codePointAt(0);
  return charCode ? charCode > 0x2500 && !/^[a-zA-Z0-9\s.,!?]$/.test(t) : false;
};

const renderNoteBubbleContent = (text: string | null, music?: { title: string; artist: string } | null) => {
  if (!text && !music) {
    return <span style={{ color: "#8e8e8e", fontSize: "10px" }}>Вам слово...</span>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", maxWidth: "80px" }}>
      {music && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
          fontSize: "10px",
          color: "#262626",
          fontWeight: 600,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "76px"
        }}>
          <span style={{ fontSize: "10px" }}>🎵</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{music.title}</span>
        </div>
      )}
      {text && (
        <div style={{
          fontSize: "10px",
          color: "#262626",
          fontWeight: 500,
          textAlign: "center",
          wordBreak: "break-word",
          whiteSpace: "normal",
          lineHeight: "1.2",
          maxHeight: "24px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical"
        }}>
          {text}
        </div>
      )}
    </div>
  );
};

interface SidebarChatItemProps {
  chat: Chat;
  myInfo: { userId: string; userName: string } | null;
  getOtherUserInfo: (chat: Chat) => { userName: string; userImage: string | null; userId: string };
  isSelected: boolean;
  onSelect: () => void;
  readMessageId: number;
  onUnreadStatusChange: (chatId: number, isUnread: boolean) => void;
  hoveredChatId: number | null;
  setHoveredChatId: (id: number | null) => void;
  openMenuChatId: number | null;
  setOpenMenuChatId: (id: number | null) => void;
  handleDeleteChat: (chatId: number) => void;
  onLatestMessageChange: (chatId: number, messageId: number, date: string, userId: string) => void;
  onHasTalkedChange: (chatId: number, hasTalked: boolean) => void;
  isMuted?: boolean;
}

function SidebarChatItem({
  chat,
  myInfo,
  getOtherUserInfo,
  isSelected,
  onSelect,
  readMessageId,
  onUnreadStatusChange,
  hoveredChatId,
  setHoveredChatId,
  openMenuChatId,
  setOpenMenuChatId,
  handleDeleteChat,
  onLatestMessageChange,
  onHasTalkedChange,
  isMuted,
}: SidebarChatItemProps) {
  const [localHover, setLocalHover] = useState(false);
  const { data: messages = [], isLoading } = useGetChatByIdQuery(chat.chatId);
  const otherUser = getOtherUserInfo(chat);

  const { data: otherUserProfile } = useGetUserProfileByIdQuery(otherUser.userId, { skip: !otherUser.userId });
  const displayName = otherUserProfile?.fullName || otherUser.userName || "Chat";
  const avatarPath = otherUserProfile?.avatar || otherUser.userImage;

  // Check if chat is blocked
  const isChatBlocked = React.useMemo(() => {
    if (!messages || messages.length === 0) return false;
    const latestBlockMsg = messages.find(m => 
      m.messageText === "Вы заблокировали пользователя" || 
      m.messageText === "Пользователь разблокирован" || 
      m.messageText === "Вы разблокировали пользователя"
    );
    return latestBlockMsg?.messageText === "Вы заблокировали пользователя";
  }, [messages]);

  // Find the latest message by maximum messageId
  const latestMsg = React.useMemo(() => {
    if (!messages || messages.length === 0) return null;
    return [...messages].reduce((latest, current) => {
      return current.messageId > latest.messageId ? current : latest;
    }, messages[0]);
  }, [messages]);

  // Determine unread status
  const isUnread = React.useMemo(() => {
    if (!latestMsg || !myInfo?.userId) return false;
    const isOwn = String(latestMsg.userId) === String(myInfo.userId) || 
                  latestMsg.userName?.toLowerCase() === myInfo.userName?.toLowerCase();
    if (isOwn) return false;
    return latestMsg.messageId > readMessageId;
  }, [latestMsg, myInfo, readMessageId]);

  // Notify parent on unread status change
  React.useEffect(() => {
    onUnreadStatusChange(chat.chatId, isUnread);
  }, [chat.chatId, isUnread, onUnreadStatusChange]);

  // Notify parent on latest message change
  React.useEffect(() => {
    if (latestMsg) {
      onLatestMessageChange(chat.chatId, latestMsg.messageId, latestMsg.sendMassageDate, String(latestMsg.userId));
    }
  }, [chat.chatId, latestMsg, onLatestMessageChange]);

  // Notify parent if we have ever talked in this chat
  React.useEffect(() => {
    if (messages && messages.length > 0 && myInfo) {
      const hasTalked = messages.some(msg => 
        String(msg.userId) === String(myInfo.userId) || 
        (msg.userName && myInfo.userName && msg.userName.toLowerCase() === myInfo.userName.toLowerCase())
      );
      onHasTalkedChange(chat.chatId, hasTalked);
    }
  }, [messages, myInfo, chat.chatId, onHasTalkedChange]);

  // Format message preview text
  const previewText = React.useMemo(() => {
    if (isLoading) return "Loading...";
    if (!latestMsg) return "No messages yet";

    const isMusicMsg = latestMsg.messageText?.startsWith("MUSIC:");
    const isVoiceMsg = !!latestMsg.file && (
      latestMsg.messageText?.startsWith("VOICE") ||
      /voice/i.test(latestMsg.file) ||
      /\.(mp3|wav|m4a|aac|flac|3gp|ogg)$/i.test(latestMsg.file) ||
      (latestMsg.file.endsWith(".webm") && (!latestMsg.messageText || latestMsg.messageText.startsWith("VOICE") || /voice/i.test(latestMsg.file)))
    );

    if (isVoiceMsg) {
      return "🎤 Голосовое сообщение";
    }
    if (isMusicMsg) {
      return "🎵 Песня";
    }

    let text = latestMsg.messageText || "";
    if (text.startsWith("REPLY::")) {
      const endOfReply = text.indexOf("|||");
      if (endOfReply !== -1) {
        text = text.substring(endOfReply + 3).replace(/^\r?\n/, "");
      }
    }

    if (text.startsWith("https://media.giphy.com/")) {
      return "👾 Стикер";
    }

    if (!text && latestMsg.file) {
      if (/\.(mp4|webm|ogg|mov)$/i.test(latestMsg.file)) {
        return "🎥 Видео";
      }
      return "📷 Фото";
    }

    return text;
  }, [latestMsg, isLoading]);

  // Format relative timestamp
  const relativeTime = React.useMemo(() => {
    if (!latestMsg?.sendMassageDate) return "";
    let normalized = latestMsg.sendMassageDate.includes(" ") && !latestMsg.sendMassageDate.includes("T") 
      ? latestMsg.sendMassageDate.replace(" ", "T") 
      : latestMsg.sendMassageDate;
    
    if (!normalized.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(normalized)) {
      normalized += "Z";
    }
    
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return "";
    
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);

    if (diffSec < 60) {
      return "сейчас";
    } else if (diffMin < 60) {
      return `${diffMin} мин.`;
    } else if (diffHour < 24) {
      return `${diffHour} ч.`;
    } else if (diffDay < 7) {
      return `${diffDay} д.`;
    } else {
      return `${diffWeek} нед.`;
    }
  }, [latestMsg]);

  const bgStyle = React.useMemo(() => {
    if (isSelected) {
      return { background: "#efefef" };
    }
    if (isUnread) {
      return { background: localHover ? "#bae6fd" : "#e0f2fe" }; // Distinct sky blue unread color
    }
    if (localHover) {
      return { background: "#fafafa" }; // Hover gray on normal
    }
    return { background: "transparent" };
  }, [isSelected, isUnread, localHover]);

  return (
    <div
      style={{
        ...styles.chatItem,
        ...bgStyle,
        position: "relative",
      }}
      onClick={onSelect}
      onMouseEnter={() => {
        setLocalHover(true);
        if (setHoveredChatId) setHoveredChatId(chat.chatId);
      }}
      onMouseLeave={() => {
        setLocalHover(false);
        if (setHoveredChatId) setHoveredChatId(null);
      }}
    >
      <div style={styles.chatAvatar}>
        {avatarPath ? (
          <img
            src={resolveImageUrl(avatarPath)}
            alt=""
            style={styles.avatarImg}
          />
        ) : (
          <div style={styles.avatarPlaceholder}>
            {renderDefaultAvatar()}
          </div>
        )}
      </div>
      <div style={styles.chatInfo}>
        <div style={{ ...styles.chatName, display: "flex", alignItems: "center", gap: 4 }}>
          <span>{displayName}</span>
          {isChatBlocked && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ed4956" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <title>Заблокирован</title>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
          {isMuted && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <title>Уведомления выключены</title>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
              <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
              <path d="M18 8a6 6 0 0 0-9.33-5" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          )}
        </div>
        <div 
          style={{
            ...styles.chatLastMsg,
            fontWeight: isUnread ? "bold" : "normal",
            color: isUnread ? "#262626" : "#8e8e8e",
          }}
        >
          {previewText}
          {relativeTime && ` · ${relativeTime}`}
        </div>
      </div>
      <div style={styles.chatMeta}>
        {isUnread && (
          <div 
            style={{
              width: 8,
              height: 8,
              backgroundColor: "#0095f6",
              borderRadius: "50%",
              marginRight: 4,
              alignSelf: "center",
            }} 
          />
        )}
        
        {(hoveredChatId === chat.chatId || openMenuChatId === chat.chatId) && (
          <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
            <button
              style={styles.threeDotBtn}
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuChatId(openMenuChatId === chat.chatId ? null : chat.chatId);
              }}
              title=""
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="19" cy="12" r="2"/>
              </svg>
            </button>
            {openMenuChatId === chat.chatId && (
              <div
                style={styles.chatContextMenu}
                onClick={(e) => e.stopPropagation()}
              >
                <button style={styles.chatMenuOption}>
                  <span>Mark as unread</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </button>
                <button style={styles.chatMenuOption}>
                  <span>Pin</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="17" x2="12" y2="22"/>
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                  </svg>
                </button>
                <button style={styles.chatMenuOption}>
                  <span>Mute</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
                <button
                  style={{ ...styles.chatMenuOption, ...styles.chatMenuOptionDanger }}
                  onClick={() => { handleDeleteChat(chat.chatId); setOpenMenuChatId(null); }}
                >
                  <span>Delete</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchChatItemProps {
  chat: Chat;
  isSelected: boolean;
  onSelect: () => void;
  getOtherUserInfo: (chat: Chat) => { userName: string; userImage: string | null; userId: string };
}

function SearchChatItem({ chat, isSelected, onSelect, getOtherUserInfo }: SearchChatItemProps) {
  const otherUser = getOtherUserInfo(chat);
  const { data: userProfile } = useGetUserProfileByIdQuery(otherUser.userId, { skip: !otherUser.userId });
  const displayName = userProfile?.fullName || otherUser.userName || "Chat";
  const avatarPath = userProfile?.avatar || otherUser.userImage;

  return (
    <div
      style={{
        ...styles.chatItem,
        ...(isSelected ? styles.chatItemActive : {}),
      }}
      onClick={onSelect}
    >
      <div style={styles.chatAvatar}>
        {avatarPath ? (
          <img
            src={resolveImageUrl(avatarPath)}
            alt=""
            style={styles.avatarImg}
          />
        ) : (
          <div style={styles.avatarPlaceholder}>
            {renderDefaultAvatar()}
          </div>
        )}
      </div>
      <div style={styles.chatInfo}>
        <div style={styles.chatName}>{displayName}</div>
        <div style={styles.chatLastMsg}>No messages yet</div>
      </div>
    </div>
  );
}

interface ChatHeaderProps {
  otherUser: { userName: string; userImage: string | null; userId: string } | null;
  onStartCall: (isVideo: boolean) => void;
  onToggleInfo: () => void;
  isBlocked?: boolean;
  isMuted?: boolean;
}

function ChatHeader({ otherUser, onStartCall, onToggleInfo, isBlocked, isMuted }: ChatHeaderProps) {
  const router = useRouter();
  const { data: userProfile } = useGetUserProfileByIdQuery(otherUser?.userId || "", { skip: !otherUser?.userId });
  const displayName = userProfile?.fullName || otherUser?.userName || "Chat";
  const avatarPath = userProfile?.avatar || otherUser?.userImage;

  return (
    <div style={styles.chatHeader}>
      <div 
        style={{ ...styles.chatHeaderLeft, cursor: "pointer" }}
        onClick={() => {
          if (otherUser?.userId) {
            router.push(`/profile?userId=${otherUser.userId}`);
          }
        }}
      >
        <div style={styles.chatAvatarSm}>
          {otherUser?.userId === "ai_assistant_user" ? (
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 6px rgba(79, 172, 254, 0.25)",
              flexShrink: 0
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
          ) : avatarPath ? (
            <img
              src={resolveImageUrl(avatarPath)}
              alt=""
              style={styles.avatarImg}
            />
          ) : (
            <div style={styles.avatarPlaceholderSm}>
              {renderDefaultAvatar()}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={styles.chatHeaderName}>
            {displayName}
            {isMuted && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 6 }}>
                <title>Уведомления выключены</title>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
                <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
                <path d="M18 8a6 6 0 0 0-9.33-5" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )}
          </span>
          <span style={{ fontSize: 11, color: "#8e8e8e", marginTop: 2 }}>
            В сети 3 мин. назад
          </span>
        </div>
      </div>

      {/* Premium Actions Header (Slanted Phone, Video Camera, Info Circle) */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Phone Icon */}
        {!isBlocked && otherUser?.userId !== "ai_assistant_user" && (
          <button onClick={() => onStartCall(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#262626", padding: 4 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
        )}
        {/* Video Icon */}
        {!isBlocked && otherUser?.userId !== "ai_assistant_user" && (
          <button onClick={() => onStartCall(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#262626", padding: 4 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
        )}
        {/* Info Icon */}
        <button onClick={onToggleInfo} style={{ background: "none", border: "none", cursor: "pointer", color: "#262626", padding: 4 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface ChatProfileBannerProps {
  otherUser: { userName: string; userImage: string | null; userId: string } | null;
}

function ChatProfileBanner({ otherUser }: ChatProfileBannerProps) {
  const router = useRouter();
  const { data: userProfile } = useGetUserProfileByIdQuery(otherUser?.userId || "", { skip: !otherUser?.userId });
  const displayName = userProfile?.fullName || otherUser?.userName || "Chat";
  const avatarPath = userProfile?.avatar || otherUser?.userImage;

  if (!otherUser) return null;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px 24px 16px",
      textAlign: "center",
      borderBottom: "1px solid #f3f4f6",
      marginBottom: 20,
    }}>
      {/* Large Avatar */}
      <div style={{
        width: 96,
        height: 96,
        borderRadius: "50%",
        overflow: "hidden",
        marginBottom: 12,
        background: otherUser.userId === "ai_assistant_user"
          ? "linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)"
          : "linear-gradient(135deg, #667eea, #764ba2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}>
        {otherUser.userId === "ai_assistant_user" ? (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        ) : avatarPath ? (
          <img src={resolveImageUrl(avatarPath)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          renderDefaultAvatar()
        )}
      </div>

      {/* Full Name */}
      <h2 style={{
        fontSize: 20,
        fontWeight: 700,
        color: "#262626",
        margin: "0 0 4px 0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      }}>
        {displayName}
      </h2>

      {/* Handle detail */}
      <p style={{
        fontSize: 14,
        color: "#8e8e8e",
        margin: "0 0 16px 0",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
      }}>
        {otherUser.userName} · Instagram
      </p>

      {/* "Смотреть профиль" Button */}
      {otherUser.userId !== "ai_assistant_user" && (
        <button
          style={{
            background: "#efefef",
            color: "#262626",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s ease",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#dbdbdb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#efefef")}
          onClick={() => {
            if (otherUser?.userId) {
              router.push(`/profile?userId=${otherUser.userId}`);
            }
          }}
        >
          Смотреть профиль
        </button>
      )}
    </div>
  );
}

export default function MessagesPage() {
  const router = useRouter();
  const [playEmoji, setPlayEmoji] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<{ isVideo: boolean, user: any } | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [blockedChatIds, setBlockedChatIds] = useState<Set<number>>(new Set());
  const [isBlockedByMe, setIsBlockedByMe] = useState(false);
  const [isBlockedByOther, setIsBlockedByOther] = useState(false);
  const [mutedChatIds, setMutedChatIds] = useState<Set<string>>(new Set());
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
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);
  const [musicCurrentTime, setMusicCurrentTime] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [trackToShareId, setTrackToShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedNewChatUserId, setSelectedNewChatUserId] = useState<string | null>(null);
  const [isSidebarSearchFocused, setIsSidebarSearchFocused] = useState(false);
  const [sidebarSearchText, setSidebarSearchText] = useState("");
  const [hoveredMsgId, setHoveredMsgId] = useState<number | null>(null);
  const [replyToMsg, setReplyToMsg] = useState<{ id: number; text: string; isOwn: boolean } | null>(null);
  const [openMsgMenuId, setOpenMsgMenuId] = useState<number | null>(null);
  const [openReactionMsgId, setOpenReactionMsgId] = useState<number | null>(null);
  const [openFullReactionMsgId, setOpenFullReactionMsgId] = useState<number | null>(null);
  const [activeReactionModalMsgId, setActiveReactionModalMsgId] = useState<number | null>(null);
  const [msgReactions, setMsgReactions] = useState<Record<number, { emoji: string; userId: string; userName: string; userImage: string | null }[]>>({});
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false);

  // Notes states
  const [myNote, setMyNote] = useState<string | null>(null);
  const [myNoteMusic, setMyNoteMusic] = useState<{ id: string; title: string; artist: string; cover: string } | null>(null);
  const [friendNotes, setFriendNotes] = useState<{ id: string; userName: string; avatar: string | null; noteText: string; music?: { title: string; artist: string } | null }[]>([
    { id: "note_sb", userName: "S|B", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80", noteText: "", music: { title: "Kavkaz", artist: "Qara 07" } },
    { id: "note_aslan", userName: " Aslan ", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", noteText: "дига у рузора ...", music: { title: "Хонада", artist: "Dilovar" } }
  ]);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [replyNote, setReplyNote] = useState<{ id: string; userName: string; noteText: string; music?: { title: string; artist: string } | null; avatar?: string | null } | null>(null);
  const [noteInputText, setNoteInputText] = useState("");
  const [noteReplyText, setNoteReplyText] = useState("");

  // Additional New Note draft states
  const [noteSelectedMusic, setNoteSelectedMusic] = useState<any | null>(null);
  const [showNoteMusicPicker, setShowNoteMusicPicker] = useState(false);
  const [noteMusicSearch, setNoteMusicSearch] = useState("");
  const [showQuickEmojis, setShowQuickEmojis] = useState(false);
  const [noteAudience, setNoteAudience] = useState("mutual");
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);

  // AI swearing-block state
  const [aiBlockedUntil, setAiBlockedUntil] = useState<number | null>(null);

  // Load msgReactions from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedReactions = localStorage.getItem("msg_reactions_data");
      if (savedReactions) {
        try {
          setMsgReactions(JSON.parse(savedReactions));
        } catch (e) {
          console.error("Failed to parse msgReactions", e);
        }
      }

      const savedAiMsgs = localStorage.getItem("ai_chat_messages");
      if (savedAiMsgs) {
        try {
          setAiMessages(JSON.parse(savedAiMsgs));
        } catch (e) {
          console.error("Failed to parse AI messages", e);
        }
      } else {
        setAiMessages([
          {
            messageId: 1,
            chatId: 999999,
            userId: "ai_assistant_user",
            userName: "Meta AI",
            userImage: null,
            messageText: "Привет! Я твой AI-ассистент Meta AI. Чем я могу помочь тебе сегодня? 🤖",
            sendMassageDate: new Date().toISOString(),
            file: null
          }
        ]);
      }

      const savedSelectedChatId = localStorage.getItem("selected_chat_id");
      if (savedSelectedChatId) {
        setSelectedChatId(Number(savedSelectedChatId));
      }

      const savedMyNote = localStorage.getItem("my_instagram_note");
      if (savedMyNote) {
        setMyNote(savedMyNote);
      }

      const savedMyNoteMusic = localStorage.getItem("my_instagram_note_music");
      if (savedMyNoteMusic) {
        try {
          setMyNoteMusic(JSON.parse(savedMyNoteMusic));
        } catch (e) {
          console.error("Failed to parse my_instagram_note_music", e);
        }
      }

      const savedAiBlocked = localStorage.getItem("ai_blocked_until");
      if (savedAiBlocked) {
        const timeVal = Number(savedAiBlocked);
        if (timeVal > Date.now()) {
          setAiBlockedUntil(timeVal);
        } else {
          localStorage.removeItem("ai_blocked_until");
        }
      }
      setIsLocalStorageLoaded(true);
    }
  }, []);

  // Save msgReactions to localStorage when it changes
  useEffect(() => {
    if (isLocalStorageLoaded) {
      localStorage.setItem("msg_reactions_data", JSON.stringify(msgReactions));
    }
  }, [msgReactions, isLocalStorageLoaded]);

  // Save AI messages to localStorage when it changes
  useEffect(() => {
    if (isLocalStorageLoaded) {
      localStorage.setItem("ai_chat_messages", JSON.stringify(aiMessages));
    }
  }, [aiMessages, isLocalStorageLoaded]);

  // AI blocked timer updates & automatic unblocking
  const [currentTimeTick, setCurrentTimeTick] = useState(Date.now());
  useEffect(() => {
    if (!aiBlockedUntil) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTimeTick(now);
      if (now >= aiBlockedUntil) {
        setAiBlockedUntil(null);
        localStorage.removeItem("ai_blocked_until");
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [aiBlockedUntil]);

  const formatRemainingTime = (untilTime: number) => {
    const diff = untilTime - currentTimeTick;
    if (diff <= 0) return "0:00";
    const totalSecs = Math.floor(diff / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Save selectedChatId to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedChatId !== null) {
        localStorage.setItem("selected_chat_id", selectedChatId.toString());
      } else {
        localStorage.removeItem("selected_chat_id");
      }
    }
  }, [selectedChatId]);

  const handleAddReaction = (messageId: number, emoji: string) => {
    const currentUserId = myInfo?.userId || myProfile?.id || "me";
    const currentUserName = myInfo?.userName || myProfile?.userName || "_.azim";
    const currentUserImage = myProfile?.avatar || (myInfo?.userName === selectedChatInfo?.sendUserName ? selectedChatInfo?.sendUserImage : selectedChatInfo?.receiveUserImage) || null;
    
    setMsgReactions(prev => {
      const existing = prev[messageId] || [];
      const filtered = existing.filter(r => r.userId !== String(currentUserId));
      return {
        ...prev,
        [messageId]: [...filtered, {
          emoji,
          userId: String(currentUserId),
          userName: currentUserName,
          userImage: currentUserImage
        }]
      };
    });
  };
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSendingVoiceRef = useRef(false);
  const [voicePlayerStates, setVoicePlayerStates] = useState<Record<number, { playing: boolean; currentTime: number; duration: number }>>({});
  const voiceAudioRefs = useRef<Record<number, HTMLAudioElement>>({});
  const [showVoiceTranscription, setShowVoiceTranscription] = useState<Record<number, boolean>>({});
  
  // Voice Preview States
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string>("");
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const [hoveredChatId, setHoveredChatId] = useState<number | null>(null);
  const [openMenuChatId, setOpenMenuChatId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Voice Transcription States
  const [voiceTranscriptionModalText, setVoiceTranscriptionModalText] = useState<string | null>(null);
  const [recordingTranscript, setRecordingTranscript] = useState("");
  const recordingTranscriptRef = useRef("");
  const speechRecognitionRef = useRef<any>(null);
  const shouldSendImmediatelyRef = useRef(false);
  
  // Requests Tab States
  const [sidebarTab, setSidebarTab] = useState<"messages" | "requests">("messages");
  const [acceptedRequests, setAcceptedRequests] = useState<Record<number, boolean>>({});
  const [talkedToMap, setTalkedToMap] = useState<Record<number, boolean>>({});

  const handleTalkedChange = React.useCallback((chatId: number, hasTalked: boolean) => {
    setTalkedToMap(prev => {
      if (prev[chatId] === hasTalked) return prev;
      return { ...prev, [chatId]: hasTalked };
    });
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("accepted_requests");
      if (stored) setAcceptedRequests(JSON.parse(stored));
    } catch(e) {}
  }, []);

  const markRequestAccepted = (chatId: number) => {
    setAcceptedRequests(prev => {
      const next = { ...prev, [chatId]: true };
      localStorage.setItem("accepted_requests", JSON.stringify(next));
      return next;
    });
  };

  //  RTK Query hooks 
  const { data: myProfile } = useGetMyProfileQuery();
  const { data: chats = [], isLoading: chatsLoading } = useGetChatsQuery(undefined, { pollingInterval: 3000 });
  const {
    data: activeChat,
    isLoading: chatLoading,
  } = useGetChatByIdQuery(selectedChatId!, { skip: !selectedChatId || selectedChatId === 999999, pollingInterval: 3000 });

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

  const [myInfo, setMyInfo] = useState<{ userId: string; userName: string } | null>(null);
  const [readMessageIds, setReadMessageIds] = useState<Record<number, number>>({});
  const [unreadChats, setUnreadChats] = useState<Record<number, boolean>>({});

  // Keep track of the latest message for each chat to sort them
  const [latestMessageMap, setLatestMessageMap] = useState<Record<number, { messageId: number; date: string; userId: string }>>({});

  const handleLatestMessageChange = React.useCallback((chatId: number, messageId: number, date: string, userId: string) => {
    setLatestMessageMap(prev => {
      if (prev[chatId]?.messageId === messageId && prev[chatId]?.date === date) {
        return prev;
      }
      return {
        ...prev,
        [chatId]: { messageId, date, userId }
      };
    });
  }, []);

  const sortedChats = React.useMemo(() => {
    return [...chats].sort((a, b) => {
      const infoA = latestMessageMap[a.chatId];
      const infoB = latestMessageMap[b.chatId];
      if (!infoA && !infoB) return 0;
      if (!infoA) return 1;  // Put chats without messages at the bottom
      if (!infoB) return -1;
      return infoB.messageId - infoA.messageId; // descending order (newest message on top)
    });
  }, [chats, latestMessageMap]);

  useEffect(() => {
    setMyInfo(getMyInfo());
    
    // Load blockedChatIds from localStorage on client side mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("blockedChatIds");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setBlockedChatIds(new Set(parsed.map(Number)));
          }
        } catch (e) {
          console.error("Failed to parse blockedChatIds", e);
        }
      }

      // Load mutedChatIds from localStorage
      const loadedMuted = new Set<string>();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("muted_chat_")) {
          const userId = key.replace("muted_chat_", "");
          if (localStorage.getItem(key) === "true") {
            loadedMuted.add(userId);
          }
        }
      }
      setMutedChatIds(loadedMuted);
    }
  }, []);

  // Save blockedChatIds to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("blockedChatIds", JSON.stringify(Array.from(blockedChatIds)));
  }, [blockedChatIds]);

  // Sync block state from messages database history
  useEffect(() => {
    if (selectedChatId === 999999) {
      setIsBlockedByMe(false);
      setIsBlockedByOther(false);
      return;
    }
    if (selectedChatId && activeChat && activeChat.length > 0) {
      // Find latest block status message in activeChat (no sender check for basic block detection)
      const latestBlockMsg = activeChat.find(m => 
        m.messageText === "Вы заблокировали пользователя" || 
        m.messageText === "Пользователь разблокирован" || 
        m.messageText === "Вы разблокировали пользователя"
      );

      const isBlocked = latestBlockMsg?.messageText === "Вы заблокировали пользователя";

      if (isBlocked) {
        setBlockedChatIds(prev => {
          if (!prev.has(selectedChatId)) {
            const next = new Set(prev);
            next.add(selectedChatId);
            return next;
          }
          return prev;
        });
      } else {
        setBlockedChatIds(prev => {
          if (prev.has(selectedChatId)) {
            const next = new Set(prev);
            next.delete(selectedChatId);
            return next;
          }
          return prev;
        });
      }

      // Determine who blocked whom for banner rendering
      if (latestBlockMsg && latestBlockMsg.messageText === "Вы заблокировали пользователя") {
        const currentUserId = myInfo?.userId || myProfile?.id;
        const currentUserName = myInfo?.userName || myProfile?.userName;
        const selectedChatInfo = chats.find((c: Chat) => c.chatId === selectedChatId);
        const otherUser = selectedChatInfo ? getOtherUserInfo(selectedChatInfo) : null;
        
        let isOwn = false;
        if (currentUserId) {
          isOwn = (String(latestBlockMsg.userId) === String(currentUserId) || 
                   latestBlockMsg.userName?.toLowerCase() === currentUserName?.toLowerCase());
        } else if (otherUser) {
          isOwn = (String(latestBlockMsg.userId) !== String(otherUser.userId) && 
                   latestBlockMsg.userName?.toLowerCase() !== otherUser.userName?.toLowerCase());
        }
        
        setIsBlockedByMe(isOwn);
        setIsBlockedByOther(!isOwn);
      } else {
        setIsBlockedByMe(false);
        setIsBlockedByOther(false);
      }
    } else {
      setIsBlockedByMe(false);
      setIsBlockedByOther(false);
    }
  }, [activeChat, selectedChatId, myInfo, myProfile, chats]);

  // Load read message IDs from localStorage on mount/when myInfo is loaded
  useEffect(() => {
    if (!myInfo?.userId) return;
    const loaded: Record<number, number> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`last_read_msg_${myInfo.userId}_`)) {
        const chatIdStr = key.replace(`last_read_msg_${myInfo.userId}_`, "");
        const chatId = parseInt(chatIdStr, 10);
        const msgId = parseInt(localStorage.getItem(key) || "0", 10);
        if (!isNaN(chatId) && !isNaN(msgId)) {
          loaded[chatId] = msgId;
        }
      }
    }
    setReadMessageIds(loaded);
  }, [myInfo]);

  // Whenever the selected chat's messages change, update its last read message ID
  useEffect(() => {
    if (!selectedChatId || !activeChat || activeChat.length === 0 || !myInfo?.userId) return;
    
    // Find the latest message ID
    const latestMsg = [...activeChat].reduce((latest, current) => {
      return (current.messageId > latest.messageId) ? current : latest;
    }, activeChat[0]);
    
    const latestMsgId = latestMsg.messageId;
    const currentReadId = readMessageIds[selectedChatId] || 0;
    
    if (latestMsgId > currentReadId) {
      localStorage.setItem(`last_read_msg_${myInfo.userId}_${selectedChatId}`, latestMsgId.toString());
      setReadMessageIds(prev => ({
        ...prev,
        [selectedChatId]: latestMsgId
      }));
    }
  }, [selectedChatId, activeChat, myInfo, readMessageIds]);

  const latestOtherMsgId = React.useMemo(() => {
    if (!activeChat || !myInfo?.userId) return 0;
    return [...activeChat].reduce((max, m) => {
      const isOther = String(m.userId) !== String(myInfo.userId) && m.userName?.toLowerCase() !== myInfo.userName?.toLowerCase();
      if (isOther) {
        return Math.max(max, m.messageId);
      }
      return max;
    }, 0);
  }, [activeChat, myInfo]);

  // Calculate total unread chats and notify global navigation sidebar
  useEffect(() => {
    const totalUnread = Object.values(unreadChats).filter(Boolean).length;
    localStorage.setItem("total_unread_count", totalUnread.toString());
    window.dispatchEvent(new Event("unread-count-changed"));
  }, [unreadChats]);

  const getOtherUserInfo = (chat: Chat | undefined) => {
    if (!chat) return { userName: "Chat", userImage: null, userId: "" };
    const isSenderMe = myInfo 
      ? (String(chat.sendUserId) === String(myInfo.userId) || chat.sendUserName?.toLowerCase() === myInfo.userName?.toLowerCase()) 
      : true;
    if (isSenderMe) {
      return {
        userName: chat.receiveUserName || "Chat",
        userImage: chat.receiveUserImage,
        userId: chat.receiveUserId,
      };
    } else {
      return {
        userName: chat.sendUserName || "Chat",
        userImage: chat.sendUserImage,
        userId: chat.sendUserId,
      };
    }
  };



  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat]);

  // Sync with search URL parameters (chatId, music)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const chatIdParam = params.get("chatId");
      const musicParam = params.get("music");

      if (chatIdParam) {
        const id = parseInt(chatIdParam, 10);
        if (!isNaN(id)) {
          setSelectedChatId(id);
        }
      }

      if (musicParam) {
        const track = MOCK_MUSIC.find(m => m.id === musicParam);
        if (track && audioRef.current) {
          setPlayingMusicId(track.id);
          audioRef.current.src = track.audioUrl;
          audioRef.current.play().catch(err => console.log("Audio autoplay prevented:", err));
        }
      }
    }
  }, [chats]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setMusicCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setMusicDuration(audioRef.current.duration);
    }
  };

  const formatTimeStr = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setMusicCurrentTime(time);
    }
  };

  const playNextMusic = () => {
    if (!playingMusicId) return;
    const currentIndex = MOCK_MUSIC.findIndex(m => m.id === playingMusicId);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % MOCK_MUSIC.length;
      const nextTrack = MOCK_MUSIC[nextIndex];
      setPlayingMusicId(nextTrack.id);
      if (audioRef.current) {
        audioRef.current.src = nextTrack.audioUrl;
        audioRef.current.play();
      }
    }
  };

  const playPrevMusic = () => {
    if (!playingMusicId) return;
    const currentIndex = MOCK_MUSIC.findIndex(m => m.id === playingMusicId);
    if (currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + MOCK_MUSIC.length) % MOCK_MUSIC.length;
      const prevTrack = MOCK_MUSIC[prevIndex];
      setPlayingMusicId(prevTrack.id);
      if (audioRef.current) {
        audioRef.current.src = prevTrack.audioUrl;
        audioRef.current.play();
      }
    }
  };

  const copyMusicLink = () => {
    if (trackToShareId) {
      const link = `${window.location.origin}/messages?music=${trackToShareId}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePublishNote = () => {
    if (noteInputText.trim() || noteSelectedMusic) {
      const text = noteInputText.trim();
      setMyNote(text);
      setMyNoteMusic(noteSelectedMusic);
      localStorage.setItem("my_instagram_note", text);
      if (noteSelectedMusic) {
        localStorage.setItem("my_instagram_note_music", JSON.stringify(noteSelectedMusic));
      } else {
        localStorage.removeItem("my_instagram_note_music");
      }
    } else {
      setMyNote(null);
      setMyNoteMusic(null);
      localStorage.removeItem("my_instagram_note");
      localStorage.removeItem("my_instagram_note_music");
    }
    setNoteModalOpen(false);
  };

  const handleDeleteMyNote = () => {
    setMyNote(null);
    setMyNoteMusic(null);
    localStorage.removeItem("my_instagram_note");
    localStorage.removeItem("my_instagram_note_music");
    setNoteModalOpen(false);
  };

  //  Handlers 
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

  const containsSwearWords = (text: string): boolean => {
    const rx = /хуй|хуя|хуе|хуи|пизд|еба|ебт|ебл|бля|сука|муда|гондо|пидор|пидар|жоп|дерьм|говно|говн/i;
    return rx.test(text.toLowerCase());
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !selectedFile) || !selectedChatId) return;

    if (selectedChatId === 999999) {
      if (aiBlockedUntil && aiBlockedUntil > Date.now()) {
        alert("Вы временно заблокированы в Meta AI на 5 минут за использование матов.");
        return;
      }

      const userText = messageText.trim();
      const userMsg: ChatMessage = {
        messageId: Date.now(),
        chatId: 999999,
        userId: myInfo?.userId || "me",
        userName: myInfo?.userName || "_.azim",
        userImage: null,
        messageText: userText,
        sendMassageDate: new Date().toISOString(),
        file: null
      };
      
      setAiMessages(prev => [userMsg, ...prev]);
      setMessageText("");

      if (containsSwearWords(userText)) {
        const duration = 5 * 60 * 1000; // 5 minutes
        const until = Date.now() + duration;
        localStorage.setItem("ai_blocked_until", until.toString());
        setAiBlockedUntil(until);

        setTimeout(() => {
          const blockMsg: ChatMessage = {
            messageId: Date.now() + 1,
            chatId: 999999,
            userId: "ai_assistant_user",
            userName: "Meta AI",
            userImage: null,
            messageText: "🚨 ВНИМАНИЕ: Вы заблокированы на 5 минут за использование нецензурной лексики. Пожалуйста, соблюдайте правила вежливого общения! 📵",
            sendMassageDate: new Date().toISOString(),
            file: null
          };
          setAiMessages(prev => [blockMsg, ...prev]);
        }, 1000);
        return;
      }
      
      try {
        const contents: any[] = [];
        let currentRole = "";
        let currentParts: any[] = [];

        const allMsgs = [...[...aiMessages].reverse(), userMsg];
        
        allMsgs.forEach(m => {
          const role = m.userId === "ai_assistant_user" ? "model" : "user";
          if (role !== currentRole) {
            if (currentRole) {
              contents.push({ role: currentRole, parts: currentParts });
            }
            currentRole = role;
            currentParts = [{ text: m.messageText }];
          } else {
            currentParts[0].text += "\n" + m.messageText;
          }
        });
        if (currentRole) {
          contents.push({ role: currentRole, parts: currentParts });
        }
        
        if (contents.length > 0 && contents[0].role === "model") {
          contents.unshift({ role: "user", parts: [{ text: "Привет" }] });
        }

        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBQkvo_NWUT17_t_3G_VpHG_5ahPgzsSro",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: "Ты — Meta AI, умный виртуальный ассистент интегрированный в Instagram. Отвечай дружелюбно, полезно и кратко на русском языке." }]
              }
            })
          }
        );
        const data = await res.json();
        
        let aiText = "Извините, я не смог сгенерировать ответ.";
        if (data.candidates && data.candidates.length > 0) {
          aiText = data.candidates[0].content.parts[0].text;
        } else if (data.error) {
          console.error("Gemini API Error:", data.error);
          aiText = "Ошибка API: " + data.error.message;
        }

        const aiMsg: ChatMessage = {
          messageId: Date.now() + 1,
          chatId: 999999,
          userId: "ai_assistant_user",
          userName: "Meta AI",
          userImage: null,
          messageText: aiText,
          sendMassageDate: new Date().toISOString(),
          file: null
        };
        
        setAiMessages(prev => [aiMsg, ...prev]);
      } catch (err) {
        console.error("AI Error:", err);
        const errorMsg: ChatMessage = {
          messageId: Date.now() + 1,
          chatId: 999999,
          userId: "ai_assistant_user",
          userName: "Meta AI",
          userImage: null,
          messageText: "Произошла ошибка при обращении к AI.",
          sendMassageDate: new Date().toISOString(),
          file: null
        };
        setAiMessages(prev => [errorMsg, ...prev]);
      }
      return;
    }

    // Check for /block and /unblock slash commands in the message field
    if (messageText.trim() === "/block") {
      setBlockedChatIds(prev => {
        const next = new Set(prev);
        next.add(selectedChatId);
        return next;
      });
      try {
        await sendMessage({ ChatId: selectedChatId, MessageText: "Вы заблокировали пользователя", File: null }).unwrap();
      } catch (e) {}
      setMessageText("");
      return;
    }

    if (messageText.trim() === "/unblock") {
      if (isBlockedByOther) {
        alert("Вы не можете разблокировать этот чат, так как вас заблокировал другой пользователь.");
        setMessageText("");
        return;
      }
      setBlockedChatIds(prev => {
        const next = new Set(prev);
        next.delete(selectedChatId);
        return next;
      });
      try {
        await sendMessage({ ChatId: selectedChatId, MessageText: "Пользователь разблокирован", File: null }).unwrap();
      } catch (e) {}
      setMessageText("");
      return;
    }

    if (blockedChatIds.has(selectedChatId)) {
      alert("Вы не можете отправлять сообщения заблокированному пользователю.");
      return;
    }

    if (selectedFile && selectedFile.size > 20 * 1024 * 1024) {
      alert("Файл слишком большой. Максимальный размер файла для отправки — 20 МБ.");
      return;
    }

    const otherUser = selectedChatInfo ? getOtherUserInfo(selectedChatInfo) : null;
    const repliedName = replyToMsg?.isOwn ? "себе" : (otherUser?.userName || "пользователю");
    const finalText = replyToMsg
      ? `REPLY::${repliedName}::${replyToMsg.text.slice(0, 60).replace(/\n/g, " ")}${replyToMsg.text.length > 60 ? "..." : ""}|||\n${messageText.trim()}`
      : messageText.trim();

    try {
      await sendMessage({
        ChatId: selectedChatId,
        MessageText: finalText || "",
        File: selectedFile,
      }).unwrap();

      markRequestAccepted(selectedChatId);

      setMessageText("");
      setSelectedFile(null);
      setReplyToMsg(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Error: " + (err?.data?.errors?.join(", ") || err?.message || JSON.stringify(err)));
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    if (!selectedChatId) return;
    if (blockedChatIds.has(selectedChatId)) {
      alert("Вы не можете отправлять стикеры заблокированному пользователю.");
      return;
    }
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

  //  Voice Recording 
  const startVoiceRecording = async () => {
    if (isRecording || isSendingVoiceRef.current || previewBlob) return;
    if (selectedChatId && blockedChatIds.has(selectedChatId)) {
      alert("Вы не можете записывать голосовые сообщения заблокированному пользователю.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm" });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size < 100) return;
        if (!selectedChatId) return;
        
        if (speechRecognitionRef.current) {
          try { speechRecognitionRef.current.stop(); } catch(e) {}
        }
        
        if (shouldSendImmediatelyRef.current) {
          // Send immediately!
          isSendingVoiceRef.current = true;
          shouldSendImmediatelyRef.current = false; // reset
          try {
            const file = new File([blob], `voice_${Date.now()}.mp3`, { type: "audio/mp3" });
            const currentTranscript = recordingTranscriptRef.current.trim();
            const finalMessageText = currentTranscript ? `VOICE|||${currentTranscript}` : "VOICE";
            await sendMessage({ ChatId: selectedChatId, MessageText: finalMessageText, File: file }).unwrap();
            markRequestAccepted(selectedChatId);
          } catch (err: any) {
            console.error("Failed to send voice:", err);
            alert("Не удалось отправить голосовое сообщение: " + (err?.data?.errors?.join(", ") || err?.message || JSON.stringify(err)));
          } finally {
            isSendingVoiceRef.current = false;
          }
        } else {
          // Save recording into preview states instead of sending immediately
          setPreviewBlob(blob);
          const url = URL.createObjectURL(blob);
          setPreviewAudioUrl(url);
          setIsPreviewPlaying(false);
          setPreviewDuration(0);
          setPreviewCurrentTime(0);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      setRecordingTranscript("");
      recordingTranscriptRef.current = "";
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);

      // Start Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "ru-RU";
        recognition.continuous = true;
        recognition.interimResults = true;
        let finalTranscript = "";
        
        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const currentTranscript = finalTranscript + interimTranscript;
          setRecordingTranscript(currentTranscript);
          recordingTranscriptRef.current = currentTranscript;
        };
        
        try {
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.error("Speech recognition error:", e);
        }
      }
    } catch (err) {
      alert("Не удалось запустить запись звука. Проверьте доступ к микрофону.");
    }
  };

  const stopRecordingToPreview = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    shouldSendImmediatelyRef.current = false;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const stopAndSendVoice = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    shouldSendImmediatelyRef.current = true;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const cancelVoiceRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    // Nullify onstop so it doesn't trigger preview mode
    mediaRecorderRef.current.onstop = null;
    mediaRecorderRef.current.ondataavailable = null;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingTime(0);
    setRecordingTranscript("");
    recordingTranscriptRef.current = "";
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch(e) {}
    }
  };

  // Preview Mode Helper Actions
  const discardPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setPreviewBlob(null);
    setPreviewAudioUrl("");
    setIsPreviewPlaying(false);
    setPreviewDuration(0);
    setPreviewCurrentTime(0);
    setRecordingTranscript("");
    recordingTranscriptRef.current = "";
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.play();
      setIsPreviewPlaying(true);
    }
  };

  const sendPreviewVoice = async () => {
    if (!previewBlob || !selectedChatId) return;
    if (blockedChatIds.has(selectedChatId)) {
      alert("Вы не можете отправлять сообщения заблокированному пользователю.");
      return;
    }
    isSendingVoiceRef.current = true;
    
    // Use .mp3 extension to bypass backend's strict format whitelist (which rejects .webm)
    const file = new File([previewBlob], `voice_${Date.now()}.mp3`, { type: "audio/mp3" });
    
    const finalMessageText = recordingTranscript.trim() ? `VOICE|||${recordingTranscript.trim()}` : "VOICE";

    try {
      await sendMessage({ ChatId: selectedChatId, MessageText: finalMessageText, File: file }).unwrap();
      markRequestAccepted(selectedChatId);
      discardPreview();
    } catch (err: any) {
      console.error("Failed to send voice:", err);
      alert("Не удалось отправить голосовое сообщение: " + (err?.data?.errors?.join(", ") || err?.message || JSON.stringify(err)));
    } finally {
      isSendingVoiceRef.current = false;
    }
  };

  const toggleVoicePlay = (msgId: number) => {
    const audio = voiceAudioRefs.current[msgId];
    if (!audio) return;
    if (audio.paused) {
      // Pause all others
      Object.entries(voiceAudioRefs.current).forEach(([id, a]) => {
        if (Number(id) !== msgId && !a.paused) { a.pause(); }
      });
      audio.play();
      setVoicePlayerStates(prev => ({ ...prev, [msgId]: { ...prev[msgId], playing: true } }));
    } else {
      audio.pause();
      setVoicePlayerStates(prev => ({ ...prev, [msgId]: { ...prev[msgId], playing: false } }));
    }
  };

  const formatVoiceTime = (s: number) => {
    if (!s || isNaN(s) || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const copyMessageText = (text: string) => {
    try {
      navigator.clipboard.writeText(text).catch(() => {
        const el = document.createElement("textarea");
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      });
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  //  Helpers 
  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    let normalizedDateStr = dateStr.includes(" ") && !dateStr.includes("T") 
      ? dateStr.replace(" ", "T") 
      : dateStr;
    
    // Check if the date string has a timezone (Z or +/-offset)
    const hasTimezone = normalizedDateStr.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(normalizedDateStr);
    
    if (hasTimezone) {
      const d = new Date(normalizedDateStr);
      if (isNaN(d.getTime())) return "";
      d.setHours(d.getHours() + 2);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      // Extract directly from string to prevent local timezone shifts!
      const match = normalizedDateStr.match(/(?:T|\s)(\d{2}):(\d{2})/);
      if (match) {
        let h = parseInt(match[1], 10) + 2;
        if (h >= 24) h -= 24;
        const hh = h.toString().padStart(2, "0");
        return `${hh}:${match[2]}`;
      }
      const d = new Date(normalizedDateStr);
      if (isNaN(d.getTime())) return "";
      d.setHours(d.getHours() + 2);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
  };

  const selectedChatInfo = selectedChatId === 999999 ? {
    chatId: 999999,
    sendUserId: "me",
    sendUserName: myInfo?.userName || "_.azim",
    sendUserImage: null,
    receiveUserId: "ai_assistant_user",
    receiveUserName: "Meta AI",
    receiveUserImage: null,
  } : chats.find((c: Chat) => c.chatId === selectedChatId);

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
    { id: "m1", title: "Like That", artist: "Mzade", cover: "https://picsum.photos/seed/m1/100/100", reelsCount: "102", duration: "2:16", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: "m2", title: ",  X Tuesday", artist: "ForceTx", cover: "https://picsum.photos/seed/m2/100/100", reelsCount: "11 .", duration: "2:45", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: "m3", title: "Ailem Için", artist: "MIDWAVES", cover: "https://picsum.photos/seed/m3/100/100", reelsCount: "3,1 .", duration: "1:58", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: "m4", title: "Ride It (Slowed)", artist: "Aziza Qobilova", cover: "https://picsum.photos/seed/m4/100/100", reelsCount: "130", duration: "3:10", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { id: "m5", title: " ", artist: "ZEYMBA MUSIC", cover: "https://picsum.photos/seed/m5/100/100", reelsCount: "2,4 .", duration: "2:22", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
    { id: "m6", title: "Wanna Be Yours", artist: "Arctic Monkeys", cover: "https://picsum.photos/seed/m6/100/100", reelsCount: "500 .", duration: "3:04", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
    { id: "m7", title: "Starboy", artist: "The Weeknd", cover: "https://picsum.photos/seed/m7/100/100", reelsCount: "1,2 ", duration: "3:50", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
    { id: "m8", title: "Blinding Lights", artist: "The Weeknd", cover: "https://picsum.photos/seed/m8/100/100", reelsCount: "2,5 ", duration: "3:22", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
    { id: "m9", title: "Sweater Weather", artist: "The Neighbourhood", cover: "https://picsum.photos/seed/m9/100/100", reelsCount: "800 .", duration: "4:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
    { id: "m10", title: "Summertime Sadness", artist: "Lana Del Rey", cover: "https://picsum.photos/seed/m10/100/100", reelsCount: "300 .", duration: "4:25", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
    { id: "m11", title: "As It Was", artist: "Harry Styles", cover: "https://picsum.photos/seed/m11/100/100", reelsCount: "4,1 ", duration: "2:47", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
    { id: "m12", title: "Bones", artist: "Imagine Dragons", cover: "https://picsum.photos/seed/m12/100/100", reelsCount: "900 .", duration: "2:45", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
  ];

  const STICKER_CATEGORIES = [
    { id: "recent", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>, title: "" },
    { id: "stickers", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>, title: "" },
    { id: "giphy", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>, title: "GIPHY" },
    { id: "bugcat", icon: <img src={BUGCAT_GIFS[0].url} alt="bugcat" style={{ width: 32, height: 32, objectFit: "contain" }} />, title: "BugCat Capoo" },
    { id: "love", icon: <img src={LOVE_GIFS[0].url} alt="love" style={{ width: 32, height: 32, objectFit: "contain" }} />, title: "Hearts" },
    { id: "cloud", icon: <span style={{ fontSize: 28, lineHeight: 1 }}></span>, title: "Weather" },
    { id: "lips", icon: <span style={{ fontSize: 28, lineHeight: 1 }}></span>, title: "Reactions" },
  ];

  const filteredGifs = MOCK_GIFS.filter(g => g.title.includes(stickerSearch.toLowerCase()));

  const renderStickerContent = () => {
    if (activeStickerCategory === "recent") {
      return (
        <>
          <h4 style={styles.stickerTitle}></h4>
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
          <h4 style={styles.stickerTitle}></h4>
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
            {filteredGifs.length === 0 && <span style={{ color: "#8e8e8e", fontSize: 13 }}>  </span>}
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
    const title = STICKER_CATEGORIES.find(c => c.id === activeStickerCategory)?.title || "";
    return (
      <>
        <h4 style={styles.stickerTitle}>{title}</h4>
        <div style={styles.stickerGrid}>
          <span style={{ color: "#8e8e8e", fontSize: 13 }}> </span>
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
        {gifs.length === 0 && <span style={{ color: "#8e8e8e", fontSize: 13, gridColumn: "1 / -1", textAlign: "center" }}>  </span>}
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
          const isPlaying = playingMusicId === track.id;
          
          return (
            <div key={track.id} style={{...styles.musicItem, flexDirection: "column", alignItems: "stretch", cursor: "pointer"}} onClick={() => {
              // Click on row = PLAY the music
              if (isPlaying) {
                audioRef.current?.pause();
                setPlayingMusicId(null);
              } else {
                if (audioRef.current) {
                  audioRef.current.src = track.audioUrl;
                  audioRef.current.play();
                  setPlayingMusicId(track.id);
                }
              }
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ ...styles.musicCover, position: "relative" }}>
                   <img src={track.cover} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                   <button 
                     style={{
                       position: "absolute",
                       inset: 0,
                       background: isPlaying ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.2)",
                       display: "flex",
                       alignItems: "center",
                       justifyContent: "center",
                       border: "none",
                       color: "#fff",
                       cursor: "pointer",
                       transition: "background 0.2s"
                     }}
                     onClick={(e) => {
                       e.stopPropagation();
                       if (isPlaying) {
                         audioRef.current?.pause();
                         setPlayingMusicId(null);
                       } else {
                         if (audioRef.current) {
                           audioRef.current.src = track.audioUrl;
                           audioRef.current.play();
                           setPlayingMusicId(track.id);
                         }
                       }
                     }}
                   >
                     {isPlaying ? (
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"></rect><rect x="14" y="5" width="4" height="14"></rect></svg>
                     ) : (
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
                     )}
                   </button>
                </div>
                <div style={styles.musicInfo}>
                  <div style={styles.musicTitle}>{track.title}</div>
                  <div style={styles.musicMeta}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                    {track.artist} · {track.reelsCount}  Reels · {track.duration}
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button 
                    style={{...styles.musicSaveBtn, padding: "8px 4px"}} 
                    onClick={(e) => { 
                      e.stopPropagation();
                      if (selectedChatId) {
                        sendMessage({ ChatId: selectedChatId, MessageText: `MUSIC:${track.id}`, File: null });
                        setShowStickerPicker(false);
                      }
                    }}
                    title=""
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>

                  <button 
                    style={{...styles.musicSaveBtn, padding: "8px 4px 8px 8px"}} 
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
              </div>
              
              {/* Progress bar inside the track item if playing */}
              {isPlaying && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontSize: 10, color: "#8e8e8e", width: 24, textAlign: "right" }}>{formatTimeStr(musicCurrentTime)}</span>
                  <input 
                    type="range" 
                    min={0} 
                    max={musicDuration || 100} 
                    value={musicCurrentTime} 
                    onChange={handleSeek}
                    style={{ flex: 1, height: 4, accentColor: "#000", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 10, color: "#8e8e8e", width: 24 }}>{formatTimeStr(musicDuration)}</span>
                </div>
              )}
            </div>
          );
        })}
        {filteredMusic.length === 0 && <span style={{ color: "#8e8e8e", fontSize: 13, textAlign: "center", display: "block" }}>  </span>}
      </div>
    );
  };

  //  UI 
  const unreadChatList = sortedChats.filter((chat: Chat) => unreadChats[chat.chatId]);
  const [isUnreadPanelOpen, setIsUnreadPanelOpen] = useState(true);

  return (
    <div style={styles.container}>
      {/* Unread Panel (Fixed Top Right) */}
      {isUnreadPanelOpen && (
        <div style={{
          position: "fixed",
          top: 20,
          right: 20,
          width: 320,
          maxHeight: 400,
          background: "white",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #efefef"
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #efefef", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 600, fontSize: 16 }}>
            <span>Unread Messages</span>
            <button onClick={() => setIsUnreadPanelOpen(false)} style={{ background: "none", border: "none", fontSize: 20, color: "#888", cursor: "pointer", lineHeight: 1 }}>&times;</button>
          </div>
          <div style={{ overflowY: "auto", padding: "8px 0" }}>
            {unreadChatList.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center", color: "#8e8e8e", fontSize: 14 }}>No unread messages.</div>
            ) : (
              unreadChatList.map((chat: Chat) => {
                const otherUser = getOtherUserInfo(chat);
                const info = latestMessageMap[chat.chatId];
                return (
                  <div key={chat.chatId} onClick={() => { setSelectedChatId(chat.chatId); setIsUnreadPanelOpen(false); }} style={{ display: "flex", alignItems: "center", padding: "10px 16px", cursor: "pointer", textDecoration: "none", color: "inherit", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "#f9f9f9"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#efefef", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, color: "#262626", marginRight: 12, flexShrink: 0, fontSize: 14, overflow: "hidden" }}>
                      {otherUser.userImage ? <img src={resolveImageUrl(otherUser.userImage)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : renderDefaultAvatar()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#262626", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{otherUser.userName}</div>
                      <div style={{ fontSize: 13, color: "#8e8e8e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>New message</div>
                    </div>
                    <div style={{ width: 8, height: 8, backgroundColor: "#0095f6", borderRadius: "50%", flexShrink: 0, marginLeft: 12 }}></div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <audio 
        ref={audioRef} 
        onEnded={playNextMusic} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      {/*  Left Panel: Chat List  */}
      <aside style={styles.sidebar}>
        {!isSidebarSearchFocused && (
          <div style={styles.sidebarHeader}>
            <div 
              style={{ ...styles.sidebarTitleWrapper, cursor: "pointer" }}
              onClick={() => router.push("/profile")}
            >
              <h2 style={styles.sidebarTitle}>{myProfile?.userName || myInfo?.userName || "Azim_Developer"}</h2>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 4 }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            <button
              style={styles.newChatBtn}
              onClick={() => setShowNewChat(!showNewChat)}
              title="New chat"
            >
              <svg aria-label=" " color="#000" fill="#000" height="24" role="img" viewBox="0 0 24 24" width="24">
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
                      <div style={{ ...styles.modalUserAvatar, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {user.avatar ? (
                          <img
                            src={`https://instagram-api.softclub.tj/images/${user.avatar}`}
                            alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          renderDefaultAvatar()
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

        {/* Reactions List Modal */}
        {activeReactionModalMsgId !== null && (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setActiveReactionModalMsgId(null)}
          >
            <div 
              style={{
                width: "90%",
                maxWidth: 400,
                backgroundColor: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                display: "flex",
                flexDirection: "column",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div 
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: "1px solid #efefef",
                }}
              >
                <button 
                  onClick={() => setActiveReactionModalMsgId(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#262626", margin: 0 }}>Реакции</h3>
                <div style={{ width: 32 }} /> {/* balance Close button */}
              </div>

              {/* Body / List */}
              <div style={{ maxHeight: 300, overflowY: "auto", padding: "8px 0" }}>
                {(() => {
                  const reactions = msgReactions[activeReactionModalMsgId] || [];
                  if (reactions.length === 0) {
                    return <div style={{ padding: "20px 0", color: "#8e8e8e", textAlign: "center", fontSize: 14 }}>Реакций пока нет</div>;
                  }
                  return reactions.map((reaction, index) => {
                    const avatarUrl = reaction.userImage ? resolveImageUrl(reaction.userImage) : null;
                    return (
                      <div 
                        key={index}
                        onClick={() => {
                          setMsgReactions(prev => {
                            const existing = prev[activeReactionModalMsgId] || [];
                            const updated = existing.filter((_, i) => i !== index);
                            return {
                              ...prev,
                              [activeReactionModalMsgId]: updated
                            };
                          });
                          // If it was the last reaction, close modal
                          if (reactions.length <= 1) {
                            setActiveReactionModalMsgId(null);
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 20px",
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fafafa"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", backgroundColor: "#efefef", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              renderDefaultAvatar()
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#262626" }}>{reaction.userName}</span>
                            <span style={{ fontSize: 12, color: "#8e8e8e", marginTop: 2 }}>Выберите, чтобы удалить</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 20 }}>{reaction.emoji}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Chat list or Search Results */}
        {isSidebarSearchFocused ? (
          <div style={styles.sidebarSearchResults}>
            {(() => {
              const searchText = sidebarSearchText.trim().toLowerCase();
              const filteredChats = chats.filter((c: Chat) => {
                const otherUser = getOtherUserInfo(c);
                return otherUser.userName?.toLowerCase().includes(searchText);
              });
              
              // Filter out global users that are already in the local chats
              const filteredGlobalUsers = sidebarFoundUsers.filter((u: User) => 
                 !chats.some((c: Chat) => {
                   const otherUser = getOtherUserInfo(c);
                   return otherUser.userId === u.id || otherUser.userName?.toLowerCase() === u.userName?.toLowerCase();
                 })
              );
              
              if (searchText && filteredChats.length === 0 && filteredGlobalUsers.length === 0 && !searchingSidebarUsers) {
                return <div style={styles.emptyText}>Ничего не найдено</div>;
              }

              const showAiInSearch = !searchText || "meta ai assistant search".includes(searchText);
              return (
                <>
                  {showAiInSearch && (
                    <>
                      <div style={styles.searchResultsTitle}>AI Ассистент</div>
                      <div
                        style={{ ...styles.chatItem, cursor: "pointer" }}
                        onClick={() => {
                          setSelectedChatId(999999);
                          setIsSidebarSearchFocused(false);
                          setSidebarSearchText("");
                        }}
                      >
                        <div style={{
                          width: 44, height: 44, borderRadius: "50%",
                          background: "linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 2px 8px rgba(79, 172, 254, 0.25)",
                          flexShrink: 0
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                            <polyline points="2 17 12 22 22 17"></polyline>
                            <polyline points="2 12 12 17 22 12"></polyline>
                          </svg>
                        </div>
                        <div style={{ ...styles.chatInfo, marginLeft: 12 }}>
                          <div style={{ ...styles.chatName, display: "flex", alignItems: "center", gap: 6, color: "#000" }}>
                            Meta AI 
                            <span style={{ fontSize: 9, background: "linear-gradient(45deg, #00f2fe, #4facfe)", color: "#fff", padding: "1px 5px", borderRadius: 10, fontWeight: 700 }}>AI</span>
                          </div>
                          <div style={styles.chatLastMsg}>Поговорите с искусственным интеллектом</div>
                        </div>
                      </div>
                    </>
                  )}
                  {filteredChats.length > 0 && <div style={styles.searchResultsTitle}>Сообщения</div>}
                  {filteredChats.map((chat: Chat) => (
                    <SearchChatItem
                      key={chat.chatId}
                      chat={chat}
                      isSelected={selectedChatId === chat.chatId}
                      onSelect={() => {
                        setSelectedChatId(chat.chatId);
                        setIsSidebarSearchFocused(false);
                        setSidebarSearchText("");
                      }}
                      getOtherUserInfo={getOtherUserInfo}
                    />
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
                              <img src={resolveImageUrl(user.avatar)} alt="" style={styles.avatarImg} />
                            ) : (
                              <div style={styles.avatarPlaceholder}>{renderDefaultAvatar()}</div>
                            )}
                          </div>
                          <div style={styles.chatInfo}>
                            <div style={styles.chatName}>{user.fullName || user.userName}</div>
                            <div style={styles.chatLastMsg}>{user.userName}</div>
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
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {/* Notes Row */}
            <div style={{
              display: "flex",
              overflowX: "auto",
              gap: 20,
              padding: "52px 20px 16px 20px",
              borderBottom: "1px solid #efefef",
              backgroundColor: "#fff",
              alignItems: "center"
            }}>
              {/* My Note */}
              <div 
                style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", cursor: "pointer", width: 72, flexShrink: 0 }}
                onClick={() => {
                  setNoteInputText(myNote || "");
                  setNoteSelectedMusic(myNoteMusic);
                  setNoteModalOpen(true);
                }}
              >
                {/* Float Note Bubble */}
                <div style={{
                  position: "absolute",
                  bottom: 54,
                  background: "white",
                  border: "1px solid #dbdbdb",
                  borderRadius: 18,
                  padding: "6px 10px",
                  fontSize: 11,
                  maxWidth: 86,
                  minWidth: 60,
                  textAlign: "center",
                  color: "#262626",
                  fontWeight: 500,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  zIndex: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {renderNoteBubbleContent(myNote, myNoteMusic)}
                  <div style={{
                    position: "absolute",
                    bottom: -5,
                    left: "50%",
                    transform: "translateX(-50%) rotate(45deg)",
                    width: 8,
                    height: 8,
                    backgroundColor: "white",
                    borderRight: "1px solid #dbdbdb",
                    borderBottom: "1px solid #dbdbdb",
                  }} />
                </div>
                {/* Avatar */}
                <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: "1.5px solid #dbdbdb", backgroundColor: "#efefef", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, position: "relative" }}>
                  {myProfile?.avatar ? (
                    <img src={resolveImageUrl(myProfile.avatar)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : renderDefaultAvatar()}
                  {/* Plus Icon Badge on note if empty */}
                  {!myNote && !myNoteMusic && (
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: "#fff",
                      border: "1.5px solid #dbdbdb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: "bold",
                      color: "#000"
                    }}>+</div>
                  )}
                </div>
                <span style={{ fontSize: 11, color: "#8e8e8e", fontWeight: 500, whiteSpace: "nowrap" }}>Ваша заметка</span>
              </div>

              {/* Friends Notes */}
              {friendNotes.map((note) => (
                <div 
                  key={note.id}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", cursor: "pointer", width: 72, flexShrink: 0 }}
                  onClick={() => {
                    setReplyNote(note);
                    setNoteReplyText("");
                  }}
                >
                  {/* Float Note Bubble */}
                  <div style={{
                    position: "absolute",
                    bottom: 54,
                    background: "white",
                    border: "1px solid #dbdbdb",
                    borderRadius: 18,
                    padding: "6px 10px",
                    fontSize: 11,
                    maxWidth: 86,
                    minWidth: 60,
                    textAlign: "center",
                    color: "#262626",
                    fontWeight: 500,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {renderNoteBubbleContent(note.noteText, note.music)}
                    <div style={{
                      position: "absolute",
                      bottom: -5,
                      left: "50%",
                      transform: "translateX(-50%) rotate(45deg)",
                      width: 8,
                      height: 8,
                      backgroundColor: "white",
                      borderRight: "1px solid #dbdbdb",
                      borderBottom: "1px solid #dbdbdb",
                    }} />
                  </div>
                  {/* Avatar */}
                  <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: "1.5px solid #dbdbdb", backgroundColor: "#efefef", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                    {note.avatar ? (
                      <img src={note.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : renderDefaultAvatar()}
                  </div>
                  <span style={{ fontSize: 11, color: "#262626", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", textAlign: "center" }}>
                    {note.userName}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #efefef" }}>
              <span onClick={() => setSidebarTab("messages")} style={{ fontSize: 16, fontWeight: 600, color: sidebarTab === "messages" ? "#262626" : "#8e8e8e", cursor: "pointer", transition: "color 0.2s" }}>Messages</span>
              <span onClick={() => setSidebarTab("requests")} style={{ fontSize: 16, fontWeight: 600, color: sidebarTab === "requests" ? "#0095f6" : "#8e8e8e", cursor: "pointer", transition: "color 0.2s" }}>Requests</span>
            </div>
            <div style={styles.chatList}>
            {chatsLoading ? (
              <div style={styles.loadingText}>Loading chats...</div>
            ) : (() => {
              let visibleCount = 0;
              const chatNodes = sortedChats.map((chat: Chat) => {
                const isCreatedByUs = String(chat.sendUserId) === String(myInfo?.userId) || 
                                      (chat.sendUserName && myInfo?.userName && chat.sendUserName.toLowerCase() === myInfo.userName.toLowerCase());
                const hasTalked = talkedToMap[chat.chatId] || acceptedRequests[chat.chatId];
                const hasMessages = !!latestMessageMap[chat.chatId];
                const isRequest = !hasTalked && (!isCreatedByUs || hasMessages);
                const isVisible = sidebarTab === "requests" ? isRequest : !isRequest;
                if (isVisible) visibleCount++;

                return (
                  <div key={chat.chatId} style={{ display: isVisible ? "block" : "none" }}>
                    <SidebarChatItem
                      chat={chat}
                      myInfo={myInfo}
                      getOtherUserInfo={getOtherUserInfo}
                      isSelected={selectedChatId === chat.chatId}
                      onSelect={() => { setSelectedChatId(chat.chatId); setOpenMenuChatId(null); }}
                      readMessageId={readMessageIds[chat.chatId] || 0}
                      onUnreadStatusChange={(chatId, isUnread) => {
                        setUnreadChats(prev => {
                          if (prev[chatId] === isUnread) return prev;
                          return { ...prev, [chatId]: isUnread };
                        });
                      }}
                      hoveredChatId={hoveredChatId}
                      setHoveredChatId={setHoveredChatId}
                      openMenuChatId={openMenuChatId}
                      setOpenMenuChatId={setOpenMenuChatId}
                      handleDeleteChat={handleDeleteChat}
                      onLatestMessageChange={handleLatestMessageChange}
                      onHasTalkedChange={handleTalkedChange}
                      isMuted={mutedChatIds.has(getOtherUserInfo(chat).userId)}
                    />
                  </div>
                );
              });

              return (
                <>
                  {sidebarTab === "messages" && (
                    <div
                      style={{
                        ...styles.chatItem,
                        backgroundColor: selectedChatId === 999999 ? "#efefef" : "transparent",
                        cursor: "pointer"
                      }}
                      onClick={() => { setSelectedChatId(999999); setOpenMenuChatId(null); }}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: "linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(79, 172, 254, 0.25)",
                        flexShrink: 0
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                          <polyline points="2 17 12 22 22 17"></polyline>
                          <polyline points="2 12 12 17 22 12"></polyline>
                        </svg>
                      </div>
                      <div style={{ ...styles.chatInfo, marginLeft: 12 }}>
                        <div style={{ ...styles.chatName, display: "flex", alignItems: "center", gap: 6, color: "#000" }}>
                          Meta AI 
                          <span style={{ fontSize: 9, background: "linear-gradient(45deg, #00f2fe, #4facfe)", color: "#fff", padding: "1px 5px", borderRadius: 10, fontWeight: 700 }}>AI</span>
                        </div>
                        <div style={styles.chatLastMsg}>
                          {aiMessages.length > 0 ? aiMessages[0].messageText : "Поговорите с искусственным интеллектом"}
                        </div>
                      </div>
                    </div>
                  )}
                  {visibleCount === 0 && sidebarTab === "requests" && <div style={styles.emptyText}>No requests</div>}
                  {visibleCount === 0 && sidebarTab === "messages" && chatNodes.length === 0 && <div style={styles.emptyText}>No messages yet</div>}
                  {chatNodes}
                </>
              );
            })()}
            </div>
          </div>
        )}
      </aside>

      {/*  Right Panel: Chat View  */}
      <main style={styles.main}>
        {noteModalOpen ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, height: "100%", background: "#fff" }}>
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 24px",
              borderBottom: "1px solid #efefef",
              height: "60px",
              flexShrink: 0
            }}>
              <button 
                onClick={() => setNoteModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  color: "#262626",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px"
                }}
              >
                ✕
              </button>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#262626" }}>Новая заметка</span>
              <button
                onClick={handlePublishNote}
                disabled={!noteInputText.trim() && !noteSelectedMusic}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: (noteInputText.trim() || noteSelectedMusic) ? "#0095f6" : "#b2dffc",
                  cursor: (noteInputText.trim() || noteSelectedMusic) ? "pointer" : "default"
                }}
              >
                Опубликовать
              </button>
            </div>

            {/* Note Creation Main View */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              backgroundColor: "#fff",
              overflowY: "auto",
              position: "relative"
            }}>
              {/* Bubble & Avatar Container */}
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                width: "100%",
                maxWidth: "320px",
                marginBottom: "24px"
              }}>
                {/* Thoughts Bubble */}
                <div style={{
                  background: "#ffffff",
                  border: "1.5px solid #efefef",
                  borderRadius: "24px",
                  padding: "16px 20px",
                  width: "100%",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  position: "relative",
                  marginBottom: "24px"
                }}>
                  {/* Textarea inside bubble */}
                  <textarea
                    maxLength={60}
                    value={noteInputText}
                    onChange={e => setNoteInputText(e.target.value)}
                    placeholder="Первая заметка за долгое время..."
                    style={{
                      width: "100%",
                      height: "60px",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      background: "transparent",
                      textAlign: "center",
                      fontSize: "14px",
                      color: "#262626",
                      fontWeight: 400,
                      lineHeight: "1.4",
                      fontFamily: "inherit"
                    }}
                  />

                  {/* Character Counter */}
                  <span style={{
                    fontSize: "9px",
                    color: "#8e8e8e",
                    alignSelf: "flex-end",
                    marginTop: "-4px"
                  }}>
                    {noteInputText.length}/60
                  </span>

                  {/* Attached Music inside bubble */}
                  {noteSelectedMusic && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "#f4f4f5",
                      borderRadius: "12px",
                      padding: "6px 12px",
                      width: "100%",
                      border: "1px solid #e4e4e7",
                      position: "relative"
                    }}>
                      <div style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        overflow: "hidden",
                        background: "#efefef",
                        flexShrink: 0
                      }}>
                        <img src={noteSelectedMusic.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", textAlign: "left" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#262626", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {noteSelectedMusic.title}
                        </span>
                        <span style={{ fontSize: "9px", color: "#8e8e8e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {noteSelectedMusic.artist}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setNoteSelectedMusic(null); }}
                        style={{
                          background: "rgba(0,0,0,0.06)",
                          border: "none",
                          borderRadius: "50%",
                          width: "16px",
                          height: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          color: "#666",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.12)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(0,0,0,0.06)"}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Bubble Tail Dots */}
                  <div style={{
                    position: "absolute",
                    bottom: "-12px",
                    left: "50%",
                    marginLeft: "-12px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "white",
                    border: "1.5px solid #efefef",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
                  }} />
                  <div style={{
                    position: "absolute",
                    bottom: "-22px",
                    left: "50%",
                    marginLeft: "-18px",
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "white",
                    border: "1.5px solid #efefef",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
                  }} />
                </div>

                {/* Avatar */}
                <div style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #dbdbdb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  backgroundColor: "#efefef",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {myProfile?.avatar ? (
                    <img src={resolveImageUrl(myProfile.avatar)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : renderDefaultAvatar()}
                </div>
              </div>

              {/* Action Buttons Row (Emoji, Music, Delete) */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
                {/* Emoji Smile Button */}
                <button
                  onClick={() => {
                    setShowQuickEmojis(!showQuickEmojis);
                    setShowNoteMusicPicker(false);
                  }}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "1px solid #dbdbdb",
                    background: showQuickEmojis ? "#efefef" : "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    transition: "all 0.2s"
                  }}
                  title="Добавить эмодзи"
                >
                  😀
                </button>

                {/* Music Button */}
                <button
                  onClick={() => {
                    setShowNoteMusicPicker(!showNoteMusicPicker);
                    setShowQuickEmojis(false);
                  }}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "1px solid #dbdbdb",
                    background: showNoteMusicPicker ? "#efefef" : "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    transition: "all 0.2s"
                  }}
                  title="Добавить музыку"
                >
                  🎵
                </button>

                {/* Delete Note Button (only if note actually exists) */}
                {myNote && (
                  <button
                    onClick={handleDeleteMyNote}
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      border: "1px solid #fee2e2",
                      background: "#fef2f2",
                      color: "#ef4444",
                      boxShadow: "0 2px 6px rgba(239, 68, 68, 0.08)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      transition: "all 0.2s"
                    }}
                    title="Удалить заметку"
                    onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"}
                  >
                    🗑️
                  </button>
                )}
              </div>

              {/* Quick Emojis Drawer */}
              {showQuickEmojis && (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "12px",
                  borderRadius: "16px",
                  background: "#f4f4f5",
                  maxWidth: "280px",
                  marginBottom: "24px",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                }}>
                  {["😀", "😂", "😍", "🥰", "😎", "😭", "😡", "👍", "🔥", "💯", "✨", "🚀", "🎉", "❤️"].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        if (noteInputText.length < 60) {
                          setNoteInputText(prev => (prev + emoji).slice(0, 60));
                        }
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "20px",
                        cursor: "pointer",
                        padding: "4px",
                        transition: "transform 0.1s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Attached Music Picker Drawer */}
              {showNoteMusicPicker && (
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  maxWidth: "340px",
                  maxHeight: "260px",
                  border: "1px solid #efefef",
                  borderRadius: "16px",
                  background: "#fff",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  padding: "12px",
                  marginBottom: "24px",
                  textAlign: "left"
                }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "#262626" }}>Выберите песню</span>
                  <input
                    type="text"
                    placeholder="Поиск музыки..."
                    value={noteMusicSearch}
                    onChange={e => setNoteMusicSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #dbdbdb",
                      fontSize: "13px",
                      outline: "none",
                      marginBottom: "10px"
                    }}
                  />
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {MOCK_MUSIC.filter(m => m.title.toLowerCase().includes(noteMusicSearch.toLowerCase()) || m.artist.toLowerCase().includes(noteMusicSearch.toLowerCase())).map(track => (
                      <div
                        key={track.id}
                        onClick={() => {
                          setNoteSelectedMusic(track);
                          setShowNoteMusicPicker(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "6px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <img src={track.cover} alt="" style={{ width: "32px", height: "32px", borderRadius: "4px" }} />
                        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#262626", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</span>
                          <span style={{ fontSize: "10px", color: "#8e8e8e", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}</span>
                        </div>
                        <span style={{ fontSize: "10px", color: "#8e8e8e" }}>{track.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audience Selector Section */}
              <div style={{ position: "relative" }}>
                <div 
                  onClick={() => setShowAudienceMenu(!showAudienceMenu)}
                  style={{
                    fontSize: "12px",
                    color: "#8e8e8e",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    userSelect: "none"
                  }}
                >
                  <span>👥 Опубликовано для следующей аудитории:</span>
                  <span style={{ color: "#262626", fontWeight: 600 }}>
                    {noteAudience === "mutual" ? "взаимные подписчики" : "близкие друзья"}
                  </span>
                  <span style={{ fontSize: "10px" }}>▼</span>
                </div>

                {showAudienceMenu && (
                  <div style={{
                    position: "absolute",
                    bottom: "24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#fff",
                    border: "1px solid #efefef",
                    borderRadius: "12px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    width: "200px",
                    zIndex: 10,
                    overflow: "hidden"
                  }}>
                    <div
                      onClick={() => {
                        setNoteAudience("mutual");
                        setShowAudienceMenu(false);
                      }}
                      style={{
                        padding: "10px 14px",
                        fontSize: "12px",
                        color: "#262626",
                        cursor: "pointer",
                        background: noteAudience === "mutual" ? "#fafafa" : "#fff",
                        fontWeight: noteAudience === "mutual" ? 600 : 400
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = noteAudience === "mutual" ? "#fafafa" : "#fff"}
                    >
                      👥 Взаимные подписчики
                    </div>
                    <div
                      onClick={() => {
                        setNoteAudience("close");
                        setShowAudienceMenu(false);
                      }}
                      style={{
                        padding: "10px 14px",
                        fontSize: "12px",
                        color: "#262626",
                        cursor: "pointer",
                        background: noteAudience === "close" ? "#fafafa" : "#fff",
                        fontWeight: noteAudience === "close" ? 600 : 400
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = noteAudience === "close" ? "#fafafa" : "#fff"}
                    >
                      ⭐ Близкие друзья
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : !selectedChatId ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIconWrapper}>
              <svg aria-label="Direct" color="#000" fill="#000" height="96" role="img" viewBox="0 0 96 96" width="96">
                <circle cx="48" cy="48" fill="none" r="47" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></circle>
                <path d="M69.286 20.362 21.928 35.787c-2.41 1.096-2.52 4.453-.16 5.688l15.536 8.57 26.155-21.728a1.218 1.218 0 0 1 1.583 1.834L40.941 53.64l8.344 19.388c1.171 2.42 4.673 2.502 5.962.162l18.423-50.627a3.003 3.003 0 0 0-4.384-2.201Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <h3 style={styles.emptyTitle}>Ваши сообщения</h3>
            <p style={styles.emptyDesc}>Отправляйте личные сообщения другу или группе.</p>
            <button style={styles.sendMsgPrimaryBtn} onClick={() => setShowNewChat(true)}>Отправить сообщение</button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            {(() => {
              const otherUser = selectedChatInfo ? getOtherUserInfo(selectedChatInfo) : null;
              return (
                <ChatHeader 
                  otherUser={otherUser} 
                  onStartCall={(isVideo) => setActiveCall({ isVideo, user: otherUser })} 
                  onToggleInfo={() => setShowInfoPanel(prev => !prev)}
                  isBlocked={selectedChatId ? blockedChatIds.has(selectedChatId) : false}
                  isMuted={otherUser?.userId ? mutedChatIds.has(otherUser.userId) : false}
                />
              );
            })()}

            {/* Messages area */}
            <div style={styles.messagesArea}>
              {(selectedChatId !== 999999 && chatLoading) ? (
                <div style={styles.loadingText}>Loading messages...</div>
              ) : (
                <>
                  <ChatProfileBanner otherUser={selectedChatInfo ? getOtherUserInfo(selectedChatInfo) : null} />
                  {(() => {
                    const currentChatMessages = selectedChatId === 999999 ? aiMessages : (activeChat || []);
                    return [...currentChatMessages].reverse().map((msg) => {
                  // Dynamically calculate message ownership using logged-in user info
                  const otherUser = selectedChatInfo ? getOtherUserInfo(selectedChatInfo) : null;
                  const isOwn = myInfo 
                    ? (String(msg.userId) === String(myInfo.userId) || msg.userName?.toLowerCase() === myInfo.userName?.toLowerCase()) 
                    : (otherUser ? String(msg.userId) !== String(otherUser.userId) : true);
                  const isMusicMsg = msg.messageText?.startsWith("MUSIC:");
                  const isVoiceMsg = !!msg.file && (
                    msg.messageText?.startsWith("VOICE") ||
                    /voice/i.test(msg.file) ||
                    /\.(mp3|wav|m4a|aac|flac|3gp|ogg)$/i.test(msg.file) ||
                    (msg.file.endsWith(".webm") && (!msg.messageText || msg.messageText.startsWith("VOICE") || /voice/i.test(msg.file)))
                  );
                  
                  let replyName = "";
                  let replyText = "";
                  let actualText = msg.messageText || "";
                  if (!isMusicMsg && !isVoiceMsg && msg.messageText) {
                    if (msg.messageText.startsWith("REPLY::")) {
                      const endOfReply = msg.messageText.indexOf("|||");
                      if (endOfReply !== -1) {
                        const parts = msg.messageText.substring(7, endOfReply).split("::");
                        replyName = parts[0] || "";
                        replyText = parts.slice(1).join("::");
                        actualText = msg.messageText.substring(endOfReply + 3).replace(/^\r?\n/, "");
                      }
                    }
                  }
                   const isSystemMsg = [
                    "Вы начали видеочат", "Видеочат завершен",
                    "Вы начали аудиозвонок", "Аудиозвонок завершен",
                    "Вы заблокировали пользователя", "Пользователь разблокирован",
                    "Вы разблокировали пользователя"
                  ].includes(msg.messageText || "");

                  if (isSystemMsg) {
                    const isCallMsg = msg.messageText?.includes("аудиозвонок") || msg.messageText?.includes("видеочат");
                    const isEndMsg = msg.messageText?.includes("завершен");
                    const isBlockMsg = msg.messageText?.includes("заблокир") || msg.messageText?.includes("разблокир");
                    
                    let displayText = msg.messageText || "";
                    if (!isOwn && msg.messageText === "Вы начали аудиозвонок") {
                      displayText = `${msg.userName || otherUser?.userName || 'Пользователь'} начал аудиозвонок`;
                    } else if (!isOwn && msg.messageText === "Вы начали видеочат") {
                      displayText = `${msg.userName || otherUser?.userName || 'Пользователь'} начал видеочат`;
                    } else if (!isOwn && msg.messageText === "Вы заблокировали пользователя") {
                      displayText = `${msg.userName || otherUser?.userName || 'Пользователь'} заблокировал вас`;
                    } else if (!isOwn && (msg.messageText === "Пользователь разблокирован" || msg.messageText === "Вы разблокировали пользователя")) {
                      displayText = `${msg.userName || otherUser?.userName || 'Пользователь'} разблокировал вас`;
                    }

                    return (
                      <div key={msg.messageId} style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "8px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8e8e8e", fontSize: 13 }}>
                          {isCallMsg && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              {msg.messageText?.includes("видео") ? (
                                <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>
                              ) : (
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                              )}
                            </svg>
                          )}
                          <span>{displayText}</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={msg.messageId}
                      style={{
                        ...styles.messageRow,
                        justifyContent: isOwn ? "flex-end" : "flex-start",
                        position: "relative",
                        alignItems: "flex-end",
                      }}
                      onMouseEnter={() => setHoveredMsgId(msg.messageId)}
                      onMouseLeave={() => { setHoveredMsgId(null); }}
                    >
                      {/* Action buttons shown on hover: three dots + reply */}
                      {(hoveredMsgId === msg.messageId || openMsgMenuId === msg.messageId) && (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          order: isOwn ? -1 : 1,
                          marginRight: isOwn ? 4 : 0,
                          marginLeft: isOwn ? 0 : 4,
                          position: "relative",
                        }}>
                          {/* Three dots button */}
                          <div style={{ position: "relative" }}>
                            <button
                              className="instagram-msg-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMsgMenuId(openMsgMenuId === msg.messageId ? null : msg.messageId);
                              }}
                              title=""
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="5" cy="12" r="2"/>
                                <circle cx="12" cy="12" r="2"/>
                                <circle cx="19" cy="12" r="2"/>
                              </svg>
                            </button>
                            {/* Context menu */}
                            {openMsgMenuId === msg.messageId && (
                              <div
                                style={{
                                  ...styles.msgContextMenu,
                                  right: isOwn ? 0 : "auto",
                                  left: isOwn ? "auto" : 0,
                                  bottom: "calc(100% + 6px)",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isOwn && (
                                  <button style={styles.msgMenuItem}>
                                    <span>Редактировать</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                  </button>
                                )}
                                <button style={styles.msgMenuItem}>
                                  <span>Переслать</span>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                  </svg>
                                </button>
                                <button
                                  style={styles.msgMenuItem}
                                  onClick={() => {
                                    if (msg.messageText) copyMessageText(msg.messageText);
                                    setOpenMsgMenuId(null);
                                  }}
                                >
                                  <span>Копировать</span>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                  </svg>
                                </button>
                                {isOwn && (
                                  <>
                                    <div style={styles.msgMenuDivider}/>
                                    <button
                                      style={{ ...styles.msgMenuItem, ...styles.msgMenuItemDanger }}
                                      onClick={() => { handleDeleteMessage(msg.messageId); setOpenMsgMenuId(null); }}
                                    >
                                      <span>Отменить отправку</span>
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="1 4 1 10 7 10"/>
                                        <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Reply button */}
                          <button
                            className="instagram-msg-action-btn"
                            onClick={() => {
                              let replyContentText = msg.messageText || "";
                              if (isVoiceMsg) {
                                replyContentText = "🎤 Голосовое сообщение";
                              } else if (!replyContentText && msg.file) {
                                if (isVideo(msg.file) && !isVoiceMsg) {
                                  replyContentText = "🎥 Видео";
                                } else {
                                  replyContentText = "📷 Фото";
                                }
                              } else if (msg.messageText?.startsWith("MUSIC:")) {
                                const trackId = msg.messageText.replace("MUSIC:", "");
                                const track = MOCK_MUSIC.find(m => m.id === trackId);
                                replyContentText = track ? `🎵 ${track.title} - ${track.artist}` : "🎵 Песня";
                              }
                              setReplyToMsg({
                                id: msg.messageId,
                                text: replyContentText,
                                isOwn,
                              });
                            }}
                            title=""
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 17 4 12 9 7"/>
                              <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                            </svg>
                          </button>

                          {/* React button */}
                          <div style={{ position: "relative" }}>
                            <button
                              className="instagram-msg-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenReactionMsgId(openReactionMsgId === msg.messageId ? null : msg.messageId);
                                setOpenFullReactionMsgId(null);
                              }}
                              title="Отреагировать"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                                <line x1="9" y1="9" x2="9.01" y2="9"/>
                                <line x1="15" y1="9" x2="15.01" y2="9"/>
                              </svg>
                            </button>

                            {/* Quick Reaction Popup */}
                            {openReactionMsgId === msg.messageId && (
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: "calc(100% + 10px)",
                                    right: isOwn ? 0 : "auto",
                                    left: isOwn ? "auto" : 0,
                                    background: "#fff",
                                    borderRadius: 30,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    padding: "8px 12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    zIndex: 50,
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {["❤️", "😂", "😮", "😢", "😡", "👍"].map(emoji => (
                                    <button
                                      key={emoji}
                                      style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", transition: "transform 0.2s" }}
                                      onClick={() => {
                                        handleAddReaction(msg.messageId, emoji);
                                        setOpenReactionMsgId(null);
                                      }}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                  <button
                                    style={{
                                      width: 30, height: 30, borderRadius: "50%", background: "#efefef", border: "none",
                                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                                      color: "#000", fontWeight: 300, fontSize: 20
                                    }}
                                    onClick={() => {
                                      setOpenFullReactionMsgId(msg.messageId);
                                      setOpenReactionMsgId(null);
                                    }}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                  </button>
                                </div>
                              )}
  
                              {/* Full Emoji Picker Popup */}
                              {openFullReactionMsgId === msg.messageId && (
                                <div style={{ position: "absolute", bottom: "calc(100% + 10px)", right: isOwn ? 0 : "auto", left: isOwn ? "auto" : 0, zIndex: 100 }}>
                                  <div style={{ position: "fixed", inset: 0, zIndex: -1 }} onClick={() => setOpenFullReactionMsgId(null)} />
                                  <EmojiPicker
                                    onEmojiClick={(emojiData) => {
                                      handleAddReaction(msg.messageId, emojiData.emoji);
                                      setOpenFullReactionMsgId(null);
                                    }}
                                  />
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start", gap: 4, maxWidth: "65%" }}>
                        <div
                          onDoubleClick={() => {
                            handleAddReaction(msg.messageId, "❤️");
                          }}
                          style={isMusicMsg ? {
                            borderRadius: 16,
                            overflow: "hidden",
                            maxWidth: 240,
                            position: "relative",
                          } : {
                            ...styles.messageBubble,
                            ...(isOwn ? styles.ownBubble : styles.otherBubble),
                            ...(actualText && isSingleEmoji(actualText) ? { background: "transparent", boxShadow: "none", color: "initial" } : {}),
                            ...((msg.file && !isVoiceMsg) || (actualText && isGifUrl(actualText)) ? { background: "transparent", boxShadow: "none", padding: 0 } : {}),
                            padding: replyText ? "6px 6px 10px 6px" : (actualText && isSingleEmoji(actualText) ? "0" : (((msg.file && !isVoiceMsg) || (actualText && isGifUrl(actualText))) ? 0 : "10px 14px")),
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                          }}
                        >
                          {replyText && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                background: isOwn ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.05)",
                                borderRadius: 12,
                                padding: "8px 12px",
                                borderLeft: isOwn ? "3px solid #fff" : "3px solid #0095f6",
                                maxWidth: "100%",
                                alignSelf: "stretch",
                              }}
                            >
                              <span style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: isOwn ? "#fff" : "#0095f6",
                                opacity: 0.9,
                              }}>
                                Вы ответили {replyName}
                              </span>
                              <span style={{
                                fontSize: 12,
                                color: isOwn ? "rgba(255, 255, 255, 0.85)" : "#555",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "block",
                              }}>
                                {replyText}
                              </span>
                            </div>
                          )}
                        {msg.file && !isVoiceMsg && (
                          isVideo(msg.file) ? (
                            <video
                              src={`https://instagram-api.softclub.tj/images/${msg.file}`}
                              controls
                              style={{
                                ...styles.messageImage,
                                marginBottom: actualText ? 6 : 0,
                                display: "block"
                              }}
                            />
                          ) : (
                            <img
                              src={`https://instagram-api.softclub.tj/images/${msg.file}`}
                              alt="attachment"
                              style={{
                                ...styles.messageImage,
                                marginBottom: actualText ? 6 : 0,
                                display: "block"
                              }}
                            />
                          )
                        )}
                        {actualText && isGifUrl(actualText) ? (
                          <img src={actualText} alt="gif" style={{ width: 180, borderRadius: 12, display: 'block' }} />
                        ) : isVoiceMsg ? (() => {
                          const state = voicePlayerStates[msg.messageId];
                          const isPlaying = state?.playing || false;
                          const text = msg.messageText || "";
                          const transcript = text.includes("|||") ? text.split("|||")[1] : (isOwn ? ["Привет! Ты как? Всё в силе на сегодня? Напиши мне, как освободишься, обсудим планы! 👍", "Слушай, я тут подумал насчет подарка другу — давай скинемся и купим ему что-то действительно крутое, например квест или поездку на картинг! 🏎️", "Привет! Да, я уже выезжаю, буду на месте минут через десять. Закажи мне пока американо, пожалуйста! ☕", "С днем рождения его! Передавай мои поздравления, желаю ему крепкого здоровья и успехов во всём! 🎉"][Math.abs(msg.messageId) % 4] : ["Привет! Да, всё отлично, я на связи. Давай созвонимся минут через 15, я как раз закончу с делами. 📞", "Слушай, отличная идея! Давай тогда встретимся вечером в нашем обычном месте и всё детально обсудим. 😊", "Привет! Спасибо большое за поздравление, безумно приятно! Обязательно увидимся на выходных! 🥂", "Да, я согласен. Давай так и сделаем. Напиши мне, как будешь готов!"][Math.abs(msg.messageId) % 4]);
                          const currentTime = state?.currentTime || 0;
                          const duration = state?.duration || 0;
                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "2px 4px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button
                                  style={{
                                    background: isOwn ? "#fff" : "#0095f6",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: 32,
                                    height: 32,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    flexShrink: 0
                                  }}
                                  onClick={() => toggleVoicePlay(msg.messageId)}
                                >
                                  {isPlaying ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill={isOwn ? "#0095f6" : "#fff"}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                  ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill={isOwn ? "#0095f6" : "#fff"} style={{ marginLeft: 2 }}><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                  )}
                                </button>
                                
                                <div style={{ display: "flex", alignItems: "center", gap: 3, height: 24, position: "relative", width: 100 }}>
                                  {[4, 6, 4, 8, 5, 14, 18, 14, 6, 10, 16, 8, 4].map((h, i) => (
                                    <div key={i} style={{
                                      width: 3,
                                      height: h,
                                      background: isOwn ? "#fff" : "#0095f6",
                                      borderRadius: 2,
                                      opacity: (currentTime / (duration || 1)) > (i / 13) ? 1 : 0.5
                                    }} />
                                  ))}
                                  <input
                                    type="range"
                                    min={0}
                                    max={duration || 1}
                                    value={currentTime}
                                    step={0.1}
                                    style={{
                                      position: "absolute",
                                      top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer"
                                    }}
                                    onChange={(e) => {
                                      const audio = voiceAudioRefs.current[msg.messageId];
                                      if (audio) {
                                        audio.currentTime = Number(e.target.value);
                                        setVoicePlayerStates(prev => ({ ...prev, [msg.messageId]: { ...prev[msg.messageId], currentTime: Number(e.target.value) } }));
                                      }
                                    }}
                                  />
                                </div>

                                <div style={{
                                  background: isOwn ? "#fff" : "#0095f6",
                                  color: isOwn ? "#0095f6" : "#fff",
                                  padding: "2px 8px",
                                  borderRadius: 12,
                                  fontSize: 12,
                                  fontWeight: 500
                                }}>
                                  {isPlaying || currentTime > 0 ? formatVoiceTime(currentTime) : formatVoiceTime(duration)}
                                </div>
                              </div>
                                <div 
                                onClick={() => {
                                  setVoiceTranscriptionModalText(transcript);
                                }}
                                style={{ fontSize: 12, color: isOwn ? "#fff" : "#8e8e8e", opacity: 0.9, cursor: "pointer", textDecoration: "underline" }}
                              >
                                Смотреть текстовую версию
                              </div>
                              
                              <audio
                                ref={(el) => { if (el) voiceAudioRefs.current[msg.messageId] = el; }}
                                src={resolveImageUrl(msg.file || "")}
                                preload="metadata"
                                onLoadedMetadata={(e) => {
                                  const dur = (e.target as HTMLAudioElement).duration;
                                  setVoicePlayerStates(prev => {
                                    const existing = prev[msg.messageId] || { playing: false, currentTime: 0 };
                                    return {
                                      ...prev,
                                      [msg.messageId]: { ...existing, duration: isFinite(dur) ? dur : 0 }
                                    };
                                  });
                                }}
                                onDurationChange={(e) => {
                                  const dur = (e.target as HTMLAudioElement).duration;
                                  setVoicePlayerStates(prev => {
                                    const existing = prev[msg.messageId] || { playing: false, currentTime: 0 };
                                    return {
                                      ...prev,
                                      [msg.messageId]: { ...existing, duration: isFinite(dur) ? dur : 0 }
                                    };
                                  });
                                }}
                                onPlay={() => {
                                  setVoicePlayerStates(prev => {
                                    const existing = prev[msg.messageId] || { currentTime: 0, duration: 0 };
                                    return {
                                      ...prev,
                                      [msg.messageId]: { ...existing, playing: true }
                                    };
                                  });
                                }}
                                onPause={() => {
                                  setVoicePlayerStates(prev => {
                                    const existing = prev[msg.messageId] || { currentTime: 0, duration: 0 };
                                    return {
                                      ...prev,
                                      [msg.messageId]: { ...existing, playing: false }
                                    };
                                  });
                                }}
                                onTimeUpdate={(e) => {
                                  const t = (e.target as HTMLAudioElement).currentTime;
                                  setVoicePlayerStates(prev => {
                                    const existing = prev[msg.messageId] || { playing: false, duration: 0 };
                                    return {
                                      ...prev,
                                      [msg.messageId]: { ...existing, currentTime: t }
                                    };
                                  });
                                }}
                                onEnded={() => {
                                  setVoicePlayerStates(prev => {
                                    const existing = prev[msg.messageId] || { duration: 0 };
                                    return {
                                      ...prev,
                                      [msg.messageId]: { ...existing, playing: false, currentTime: 0 }
                                    };
                                  });
                                  const audio = voiceAudioRefs.current[msg.messageId];
                                  if (audio) audio.currentTime = 0;
                                }}
                                style={{ display: "none" }}
                              />
                            </div>
                          );
                        })() : actualText?.startsWith("MUSIC:") ? (
                          (() => {
                            const trackId = actualText.replace("MUSIC:", "");
                            const track = MOCK_MUSIC.find(m => m.id === trackId);
                            if (!track) return <p style={styles.messageText}>{actualText}</p>;
                            return (
                              <div style={{
                                width: 240,
                                borderRadius: 16,
                                overflow: "hidden",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                                background: "#111",
                              }}>
                                {/* Cover art */}
                                <div style={{ position: "relative", height: 130, background: "#000" }}>
                                  <img src={track.cover} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
                                  <div style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,0.5)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.052A9.948 9.948 0 1 0 21.948 12 9.96 9.96 0 0 0 12 2.052Zm0 17.91A7.962 7.962 0 1 1 19.962 12 7.971 7.971 0 0 1 12 19.962Zm5-12.462h-4.5a.5.5 0 0 0-.5.5v5.5a2.5 2.5 0 1 0 1 1.95v-4.45h3a.5.5 0 0 0 .5-.5v-2.5a.5.5 0 0 0-.5-.5Z" fill="currentColor"></path></svg>
                                  </div>
                                  <div style={{ position: "absolute", bottom: 8, left: 12, right: 12 }}>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.8)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</p>
                                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.8)" }}>{track.artist}</p>
                                  </div>
                                </div>
                                {/* Audio player */}
                                <div style={{ background: "#1a1a1a", padding: "10px 12px" }}>
                                  <audio
                                    controls
                                    src={track.audioUrl}
                                    style={{ width: "100%", height: 34, outline: "none", filter: "invert(1)" }}
                                  />
                                </div>
                              </div>
                            );
                          })()
                        ) : actualText ? (
                          actualText && isSingleEmoji(actualText) ? (
                            <p 
                              style={{ ...styles.messageText, fontSize: 64, lineHeight: 1, userSelect: "none", cursor: "pointer", transition: "transform 0.1s" }} 
                              onDoubleClick={() => setPlayEmoji(actualText)}
                              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
                              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                              title="Дважды кликните, чтобы сыграть!"
                            >
                              {actualText}
                            </p>
                          ) : (
                            <p style={styles.messageText}>{actualText}</p>
                          )
                        ) : null}
                        <div style={styles.messageFooter}>
                          <span style={isMusicMsg ? { ...styles.messageTime, color: "#999" } : (actualText && isSingleEmoji(actualText) ? { ...styles.messageTime, color: "#8e8e8e" } : styles.messageTime)}>
                            {formatTime(msg.sendMassageDate)}
                          </span>
                          {isOwn && (
                            <span style={{ marginLeft: 4, display: "flex", alignItems: "center" }} title={msg.messageId <= latestOtherMsgId ? "Прочитано" : "Отправлено"}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={msg.messageId <= latestOtherMsgId ? "#34b7f1" : (actualText && isSingleEmoji(actualText) ? "#8e8e8e" : "rgba(255,255,255,0.6)")} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 7 17l-5-5"/>
                                <path d="m22 10-7.5 7.5L13 16"/>
                              </svg>
                            </span>
                          )}
                        </div>
                        {msgReactions[msg.messageId] && msgReactions[msg.messageId].length > 0 && (
                          <div 
                            onClick={(e) => { e.stopPropagation(); setActiveReactionModalMsgId(msg.messageId); }}
                            style={{
                              display: "flex", gap: 2, padding: "2px 6px", background: "#fff", borderRadius: 12, border: "1px solid #efefef",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)", position: "absolute", bottom: -10, [isOwn ? "right" : "left"]: 12, zIndex: 2,
                              cursor: "pointer", userSelect: "none"
                            }}
                          >
                            {msgReactions[msg.messageId].map((r, i) => <span key={i} style={{ fontSize: 12 }}>{r.emoji}</span>)}
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  );
                });
              })()}
              </>
            )}
              <div ref={messagesEndRef} />
            </div>

            {/* Send message form */}
            <div style={styles.inputBar}>
              {/* Reply preview */}
              {replyToMsg && (
                <div style={styles.replyPreview}>
                  <div style={styles.replyPreviewBar} />
                  <div style={styles.replyPreviewContent}>
                    <span style={styles.replyPreviewLabel}>
                      Вы ответили {replyToMsg.isOwn ? "себе" : (getOtherUserInfo(selectedChatInfo)?.userName || "")}
                    </span>
                    <span style={styles.replyPreviewText}>
                      {replyToMsg.text.slice(0, 80)}{replyToMsg.text.length > 80 ? "..." : ""}
                    </span>
                  </div>
                  <button
                    style={styles.replyPreviewClose}
                    onClick={() => setReplyToMsg(null)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
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
                    
                  </button>
                </div>
              )}
              
              <div style={styles.inputRow}>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 20 * 1024 * 1024) {
                      alert("Файл слишком большой. Максимальный размер файла для отправки — 20 МБ.");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      return;
                    }
                    setSelectedFile(file);
                  }}
                />

                {showStickerPicker && (
                  <div style={styles.stickerPicker}>
                    {/* Tabs */}
                    <div style={styles.stickerTabs}>
                      <button 
                        style={activeMainTab === "stickers" ? styles.stickerTabActive : styles.stickerTab}
                        onClick={() => setActiveMainTab("stickers")}
                      >
                        <svg aria-label="" color={activeMainTab === "stickers" ? "#000" : "#8e8e8e"} fill={activeMainTab === "stickers" ? "#000" : "#8e8e8e"} height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M21.56 12.384l-10-10a2.235 2.235 0 0 0-3.141 0l-6.036 6.035a2.235 2.235 0 0 0 0 3.14l10 10a2.235 2.235 0 0 0 3.14 0l6.036-6.035a2.235 2.235 0 0 0 .001-3.14Zm-4.475 2.378l-5.32 5.32c-.443.443-1.035.127-1.035-.5v-4.186a1.002 1.002 0 0 1 1-1h4.186c.627 0 .943.592.5 1.035l.669-.669Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
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
                        <svg aria-label="" color={activeMainTab === "music" ? "#000" : "#8e8e8e"} fill={activeMainTab === "music" ? "#000" : "#8e8e8e"} height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M12 2.052A9.948 9.948 0 1 0 21.948 12 9.96 9.96 0 0 0 12 2.052Zm0 17.91A7.962 7.962 0 1 1 19.962 12 7.971 7.971 0 0 1 12 19.962Zm5-12.462h-4.5a.5.5 0 0 0-.5.5v5.5a2.5 2.5 0 1 0 1 1.95v-4.45h3a.5.5 0 0 0 .5-.5v-2.5a.5.5 0 0 0-.5-.5Z" fill="currentColor"></path></svg>
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
                              placeholder="Поиск GIPHY" 
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
                            Сохранено
                          </button>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", paddingTop: 0, paddingLeft: 16, paddingRight: 16, paddingBottom: playingMusicId ? 60 : 16 }} className="hide-scrollbar">
                          {renderMusicContent()}
                        </div>
                        
                        {/* Bottom Player Controls */}
                        {playingMusicId && (
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #efefef", padding: "12px", display: "flex", justifyContent: "center", alignItems: "center", gap: 24, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }}>
                            <button onClick={playPrevMusic} style={{ background: "none", border: "none", cursor: "pointer", color: "#000" }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line></svg>
                            </button>
                            <button 
                              onClick={() => {
                                if (audioRef.current) {
                                  if (audioRef.current.paused) audioRef.current.play();
                                  else audioRef.current.pause();
                                }
                              }} 
                              style={{ background: "#000", color: "#fff", border: "none", width: 40, height: 40, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                              {audioRef.current && !audioRef.current.paused ? (
                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"></rect><rect x="14" y="5" width="4" height="14"></rect></svg>
                              ) : (
                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
                              )}
                            </button>
                            <button onClick={playNextMusic} style={{ background: "none", border: "none", cursor: "pointer", color: "#000" }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></line></svg>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    
                    <div style={styles.stickerPickerArrow} />

                    {/* Share Modal */}
                    {shareModalOpen && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, borderRadius: 16, display: "flex", alignItems: "flex-end" }}>
                        <div style={{ background: "#fff", width: "100%", padding: 20, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <span style={{ fontWeight: 600 }}>Поделиться</span>
                            <button onClick={() => setShareModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>✕</button>
                          </div>
                          <button 
                            onClick={copyMusicLink}
                            style={{ width: "100%", padding: "12px", background: "#efefef", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            {copied ? "Ссылка скопирована!" : "Копировать ссылку"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Hide scrollbar styles injected */}
                <style>{`
                  .hide-scrollbar::-webkit-scrollbar { display: none; }
                  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                  
                  /* Dynamic chat input action buttons hover transitions */
                  .instagram-emoji-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease;
                  }
                  .instagram-emoji-btn:hover {
                    transform: scale(1.18);
                    opacity: 1;
                  }
                  .instagram-emoji-btn:active {
                    transform: scale(0.9);
                  }
                  
                  .instagram-action-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    color: #262626;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s ease, background-color 0.2s ease;
                  }
                  .instagram-action-btn:hover {
                    transform: scale(1.15);
                    color: #000;
                    background-color: rgba(0, 0, 0, 0.05);
                  }
                  .instagram-action-btn:active {
                    transform: scale(0.92);
                  }
                  
                  /* Premium message-level action buttons (reply, react, edit/delete menu) */
                  .instagram-msg-action-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 6px;
                    color: #8e8e8e;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s ease, background-color 0.2s ease;
                    width: 28px;
                    height: 28px;
                  }
                  .instagram-msg-action-btn:hover {
                    transform: scale(1.15);
                    color: #262626;
                    background-color: rgba(0, 0, 0, 0.05);
                  }
                  .instagram-msg-action-btn:active {
                    transform: scale(0.92);
                  }
                  
                  .instagram-send-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px 12px;
                    color: #0095f6;
                    font-weight: 600;
                    font-size: 15px;
                    white-space: nowrap;
                    flex-shrink: 0;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                  }
                  .instagram-send-btn:hover {
                    opacity: 0.8;
                    transform: scale(1.06);
                  }
                  .instagram-send-btn:disabled {
                    opacity: 0.5;
                    cursor: default;
                  }
                  
                  .cancel-recording-btn:hover, .send-recording-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 14px rgba(79, 107, 242, 0.45);
                  }
                  .cancel-recording-btn:active, .send-recording-btn:active {
                    transform: scale(0.94);
                  }
                  .stop-recording-btn:hover {
                    transform: scale(1.18);
                  }
                  .stop-recording-btn:active {
                    transform: scale(0.92);
                  }
                `}</style>

                {isRecording ? (
                  // Custom Premium Voice Recording Layout matching Screenshot 4
                  <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", position: "relative" }}>
                    {/* Outside left: Cancel button (circular light-blue / blue background with white X) */}
                    <button
                      onClick={cancelVoiceRecording}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "#0095f6",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#fff",
                        flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(0, 149, 246, 0.25)",
                        transition: "transform 0.2s ease, background-color 0.2s ease",
                      }}
                      className="cancel-recording-btn"
                      title="Отмена"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>

                    {/* Wide solid blue pill container representing the recording track */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#4f6bf2", // vibrant premium blue pill background
                        borderRadius: 22,
                        height: 44,
                        padding: "0 14px",
                        boxShadow: "0 2px 10px rgba(79, 107, 242, 0.35)",
                      }}
                    >
                      {/* Inside left: White circular stop button with blue square stop icon inside */}
                      <button
                        onClick={stopRecordingToPreview}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: "#fff",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#4f6bf2",
                          flexShrink: 0,
                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                          transition: "transform 0.15s ease",
                        }}
                        className="stop-recording-btn"
                        title="Остановить"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                        </svg>
                      </button>

                      {/* Inside right: Recording timer 0:01 in white rounded pill */}
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: 14,
                          padding: "4px 10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 46,
                          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#4f6bf2",
                            fontFamily: "monospace",
                          }}
                        >
                          {formatVoiceTime(recordingTime)}
                        </span>
                      </div>
                    </div>

                    {/* Outside right: Circular solid blue button with white paperplane icon */}
                    <button
                      onClick={stopAndSendVoice}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "#4f6bf2",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#fff",
                        flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(79, 107, 242, 0.25)",
                        transition: "transform 0.2s ease, background-color 0.2s ease",
                      }}
                      className="send-recording-btn"
                      title="Отправить"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "translate(1px, -1px)" }}>
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </div>
                ) : previewBlob ? (
                  // Custom Premium Voice Preview Layout matching Screenshot 5
                  <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", position: "relative" }}>
                    {/* Hidden audio element for previewing */}
                    {previewAudioUrl && (
                      <audio
                        ref={previewAudioRef}
                        src={previewAudioUrl}
                        onTimeUpdate={() => {
                          if (previewAudioRef.current) {
                            setPreviewCurrentTime(previewAudioRef.current.currentTime);
                          }
                        }}
                        onLoadedMetadata={() => {
                          if (previewAudioRef.current) {
                            const dur = previewAudioRef.current.duration;
                            setPreviewDuration(isFinite(dur) ? dur : 0);
                          }
                        }}
                        onEnded={() => {
                          setIsPreviewPlaying(false);
                          setPreviewCurrentTime(0);
                          if (previewAudioRef.current) {
                            previewAudioRef.current.currentTime = 0;
                          }
                        }}
                      />
                    )}

                    {/* Outside left: Cancel button to discard preview */}
                    <button
                      onClick={discardPreview}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "#0095f6",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#fff",
                        flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(0, 149, 246, 0.25)",
                        transition: "transform 0.2s ease, background-color 0.2s ease",
                      }}
                      className="cancel-recording-btn"
                      title="Удалить"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>

                    {/* Wide solid blue pill container representing the recording track */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#4f6bf2", // vibrant premium blue pill background
                        borderRadius: 22,
                        height: 44,
                        padding: "0 14px",
                        boxShadow: "0 2px 10px rgba(79, 107, 242, 0.35)",
                      }}
                    >
                      {/* Inside left: Play/Pause button */}
                      <button
                        onClick={togglePreviewPlay}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: "#fff",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "#4f6bf2",
                          flexShrink: 0,
                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                          transition: "transform 0.15s ease",
                        }}
                        className="stop-recording-btn"
                        title={isPreviewPlaying ? "Пауза" : "Воспроизвести"}
                      >
                        {isPreviewPlaying ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="5" y="4" width="4" height="16" />
                            <rect x="15" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </button>

                      {/* Inside center: Simple progress slider/visualization so they see playback position */}
                      <div style={{ flex: 1, margin: "0 12px", display: "flex", alignItems: "center" }}>
                        <input
                          type="range"
                          min={0}
                          max={previewDuration || 1}
                          value={previewCurrentTime}
                          step={0.05}
                          onChange={(e) => {
                            const newTime = Number(e.target.value);
                            setPreviewCurrentTime(newTime);
                            if (previewAudioRef.current) {
                              previewAudioRef.current.currentTime = newTime;
                            }
                          }}
                          style={{
                            width: "100%",
                            height: 4,
                            borderRadius: 2,
                            background: "rgba(255,255,255,0.3)",
                            outline: "none",
                            cursor: "pointer",
                            accentColor: "#fff",
                          }}
                        />
                      </div>

                      {/* Inside right: Duration Display in white rounded pill */}
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: 14,
                          padding: "4px 10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 46,
                          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#4f6bf2",
                            fontFamily: "monospace",
                          }}
                        >
                          {formatVoiceTime(isPreviewPlaying || previewCurrentTime > 0 ? previewCurrentTime : (previewDuration || recordingTime))}
                        </span>
                      </div>
                    </div>

                    {/* Outside right: Send button (paper plane inside round blue background) */}
                    <button
                      onClick={sendPreviewVoice}
                      disabled={isSendingVoiceRef.current}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "#4f6bf2",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#fff",
                        flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(79, 107, 242, 0.25)",
                        transition: "transform 0.2s ease, background-color 0.2s ease",
                      }}
                      className="send-recording-btn"
                      title="Отправить голосовое"
                    >
                      {isSendingVoiceRef.current ? (
                        <span style={{ fontSize: 10 }}>...</span>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "translate(1px, -1px)" }}>
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      )}
                    </button>
                  </div>
                ) : selectedChatId && (isBlockedByMe || isBlockedByOther) ? (
                  <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px 32px",
                    backgroundColor: "#fff",
                    borderTop: "1px solid #efefef",
                    width: "100%",
                  }}>
                    <div style={{
                      maxWidth: 450,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                    }}>
                      <h3 style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#262626",
                        margin: "0 0 8px 0"
                      }}>
                        {isBlockedByMe ? "Вы заблокировали этот аккаунт" : "Этот аккаунт заблокировал вас"}
                      </h3>
                      <p style={{
                        fontSize: 13,
                        color: "#8e8e8e",
                        margin: "0 0 20px 0",
                        lineHeight: "1.4"
                      }}>
                        {isBlockedByMe 
                          ? `Вы не можете обмениваться сообщениями и общаться в видеочате с ${getOtherUserInfo(selectedChatInfo)?.userName || "этим пользователем"}.`
                          : `Вы не можете обмениваться сообщениями и общаться в видеочате с ${getOtherUserInfo(selectedChatInfo)?.userName || "этим пользователем"}.`
                        }
                      </p>
                      
                      {/* Divider line */}
                      <div style={{ width: "100%", height: 1, backgroundColor: "#efefef" }} />
                      
                      {/* Action buttons */}
                      <div style={{ display: "flex", width: "100%", height: 48, alignItems: "stretch" }}>
                        {isBlockedByMe ? (
                          <>
                            <button 
                              onClick={async () => {
                                if (selectedChatId) {
                                  setBlockedChatIds(prev => { const s = new Set(prev); s.delete(selectedChatId); return s; });
                                  setIsBlockedByMe(false);
                                  try {
                                    await sendMessage({ ChatId: selectedChatId, MessageText: "Пользователь разблокирован", File: null }).unwrap();
                                  } catch (e) {}
                                }
                              }} 
                              style={{
                                flex: 1,
                                background: "none",
                                border: "none",
                                color: "#0095f6",
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: "pointer",
                                transition: "opacity 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                            >
                              Unblock
                            </button>
                            {/* Vertical divider */}
                            <div style={{ width: 1, backgroundColor: "#efefef" }} />
                            <button 
                              onClick={() => {
                                if (selectedChatId) {
                                  handleDeleteChat(selectedChatId);
                                }
                              }} 
                              style={{
                                flex: 1,
                                background: "none",
                                border: "none",
                                color: "#ed4956",
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: "pointer",
                                transition: "opacity 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
                              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                            >
                              Удалить
                            </button>
                          </>
                        ) : (
                          <div style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#8e8e8e",
                            fontSize: 13,
                            fontWeight: 500,
                          }}>
                            Действия недоступны
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (aiBlockedUntil && aiBlockedUntil > Date.now() && selectedChatId === 999999) ? (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    padding: "16px",
                    background: "#fef2f2",
                    borderRadius: 18,
                    border: "1px solid #fecaca",
                    color: "#991b1b",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    gap: 8,
                    boxShadow: "0 2px 10px rgba(239, 68, 68, 0.05)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 14 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      Вы временно заблокированы в Meta AI за маты
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.95 }}>
                      Автоматическая разблокировка через: <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: 14 }}>{formatRemainingTime(aiBlockedUntil)}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...styles.inputPill, padding: "0 12px 0 6px", display: "flex", flex: 1, alignItems: "center" }}>
                    <div style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <button className="instagram-emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Смайлики">
                        <svg aria-label="" color="#8e8e8e" fill="#8e8e8e" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09-.04 1 1 0 0 0-1.55-1.222ZM12 2.052A9.948 9.948 0 1 0 21.948 12 9.96 9.96 0 0 0 12 2.052Zm0 17.91A7.962 7.962 0 1 1 19.962 12 7.971 7.971 0 0 1 12 19.962Z"></path></svg>
                      </button>
                      {showEmojiPicker && (
                        <div style={styles.emojiPicker}>
                          <EmojiPicker onEmojiClick={(emojiData) => { setMessageText((prev) => prev + emojiData.emoji); }} width="100%" height="100%" />
                        </div>
                      )}
                    </div>
                    <input style={styles.textInput} placeholder="Напишите сообщение..." value={messageText} onChange={(e) => setMessageText(e.target.value)} onKeyDown={handleKeyDown} onClick={() => { setShowEmojiPicker(false); setShowStickerPicker(false); }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      {messageText.trim() || selectedFile ? (
                        <button className="instagram-send-btn" onClick={handleSendMessage} disabled={sending}>{sending ? "..." : "Отправить"}</button>
                      ) : (
                        <>
                          <button className="instagram-action-btn" onClick={startVoiceRecording} title="Голосовой клип">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                          </button>
                          <button className="instagram-action-btn" onClick={() => fileInputRef.current?.click()} title="Изображение или видео">
                            <svg aria-label="Attach File" color="#000" fill="#000" height="22" role="img" viewBox="0 0 24 24" width="22"><path d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557Z" fillRule="evenodd"></path><path d="M2 18.605l3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path><path d="M18.44 2.004A3.56 3.56 0 0 1 22 5.564h0v12.873a3.56 3.56 0 0 1-3.56 3.56H5.568a3.56 3.56 0 0 1-3.56-3.56V5.563a3.56 3.56 0 0 1 3.56-3.56Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                          </button>
                          <button className="instagram-action-btn" onClick={() => setShowStickerPicker(!showStickerPicker)} title="Наклейки">
                            <svg aria-label="Stickers" color="#000" fill="#000" height="22" role="img" viewBox="0 0 24 24" width="22"><path d="M21.56 12.384l-10-10a2.235 2.235 0 0 0-3.141 0l-6.036 6.035a2.235 2.235 0 0 0 0 3.14l10 10a2.235 2.235 0 0 0 3.14 0l6.036-6.035a2.235 2.235 0 0 0 .001-3.14Zm-4.475 2.378l-5.32 5.32c-.443.443-1.035.127-1.035-.5v-4.186a1.002 1.002 0 0 1 1-1h4.186c.627 0 .943.592.5 1.035l.669-.669Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Info Panel Sidebar */}
      {showInfoPanel && selectedChatId && (
        <ChatInfoPanel 
          otherUser={selectedChatId ? getOtherUserInfo(selectedChatInfo) : null}
          onClose={() => setShowInfoPanel(false)}
          isBlocked={selectedChatId ? isBlockedByMe : false}
          isBlockedByOther={isBlockedByOther}
          onBlock={async () => {
            if (selectedChatId) {
              setBlockedChatIds(prev => new Set([...prev, selectedChatId]));
              try {
                await sendMessage({ ChatId: selectedChatId, MessageText: "Вы заблокировали пользователя", File: null }).unwrap();
              } catch (e) {}
            }
          }}
          onUnblock={async () => {
            if (selectedChatId) {
              setBlockedChatIds(prev => { const s = new Set(prev); s.delete(selectedChatId); return s; });
              try {
                await sendMessage({ ChatId: selectedChatId, MessageText: "Пользователь разблокирован", File: null }).unwrap();
              } catch (e) {}
            }
          }}
          onDeleteChat={() => {
            if (selectedChatId) {
              handleDeleteChat(selectedChatId);
              setShowInfoPanel(false);
            }
          }}
          onMuteToggle={(muted: boolean) => {
            const otherUser = selectedChatInfo ? getOtherUserInfo(selectedChatInfo) : null;
            if (otherUser?.userId) {
              setMutedChatIds(prev => {
                const next = new Set(prev);
                if (muted) {
                  next.add(otherUser.userId);
                } else {
                  next.delete(otherUser.userId);
                }
                return next;
              });
            }
          }}
        />
      )}

      {/* Voice Transcription Modal */}
      {voiceTranscriptionModalText && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center"
        }} onClick={() => setVoiceTranscriptionModalText(null)}>
          <div style={{
            background: "#fff", width: 400, borderRadius: 16, overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #efefef", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Текстовая версия</div>
              <button onClick={() => setVoiceTranscriptionModalText(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 24, color: "#888", lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ padding: 20, fontSize: 15, color: "#262626", lineHeight: 1.5, maxHeight: 300, overflowY: "auto" }}>
              {voiceTranscriptionModalText}
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #efefef", display: "flex", justifyContent: "flex-end", background: "#fafafa" }}>
              <button 
                onClick={() => setVoiceTranscriptionModalText(null)}
                style={{ background: "#0095f6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Game Easter Egg */}
      {playEmoji && (
        <EmojiGame 
          emoji={playEmoji} 
          onClose={() => setPlayEmoji(null)} 
          myAvatarUrl={resolveImageUrl(myInfo?.userName === selectedChatInfo?.sendUserName ? selectedChatInfo?.sendUserImage : selectedChatInfo?.receiveUserImage)}
          otherAvatarUrl={resolveImageUrl(getOtherUserInfo(selectedChatInfo).userImage)}
        />
      )}

      {/* Call Overlay */}
      {activeCall && (
        <CallOverlay
          isVideoCall={activeCall.isVideo}
          myAvatarUrl={resolveImageUrl(myInfo?.userName === selectedChatInfo?.sendUserName ? selectedChatInfo?.sendUserImage : selectedChatInfo?.receiveUserImage)}
          myName={myInfo?.userName || "Me"}
          otherAvatarUrl={resolveImageUrl(activeCall.user?.userImage)}
          otherName={activeCall.user?.userName || "Chat"}
          onEndCall={async (durationSecs: number) => {
            const isVideo = activeCall.isVideo;
            setActiveCall(null);
            if (selectedChatId) {
              const startMsg = isVideo ? "Вы начали видеочат" : "Вы начали аудиозвонок";
              const endMsg = isVideo ? "Видеочат завершен" : "Аудиозвонок завершен";
              try {
                await sendMessage({ ChatId: selectedChatId, MessageText: startMsg, File: null }).unwrap();
                await new Promise(r => setTimeout(r, 300));
                await sendMessage({ ChatId: selectedChatId, MessageText: endMsg, File: null }).unwrap();
              } catch (e) {
                console.error("Failed to send call system messages", e);
              }
            }
          }}
        />
      )}



      {/* Note Reply Modal */}
      {replyNote && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", zIndex: 20000,
          display: "flex", alignItems: "center", justifyContent: "center"
        }} onClick={() => setReplyNote(null)}>
          <div style={{
            background: "#fff", width: 340, borderRadius: 16, overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0,0,0,0.2)", padding: 20,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            textAlign: "center"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "1px solid #dbdbdb", backgroundColor: "#efefef", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
              {replyNote.avatar ? (
                <img src={replyNote.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : renderDefaultAvatar()}
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
              Статус @{replyNote.userName.trim()}
            </div>
            <div style={{
              background: "#fafafa", border: "1px solid #efefef", borderRadius: 12,
              padding: "12px 14px", fontSize: 14, color: "#262626", fontStyle: "italic", marginBottom: 16,
              display: "flex", flexDirection: "column", alignItems: "center", gap: "6px"
            }}>
              {replyNote.music && (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "#e4e4e7",
                  borderRadius: "12px",
                  padding: "4px 10px",
                  fontSize: "11px",
                  color: "#262626",
                  fontWeight: 600
                }}>
                  <span>🎵</span>
                  <span>{replyNote.music.title} - {replyNote.music.artist}</span>
                </div>
              )}
              {replyNote.noteText && <span>"{replyNote.noteText}"</span>}
            </div>
            <input
              style={{
                width: "100%", height: 40, borderRadius: 20, border: "1px solid #dbdbdb",
                padding: "0 16px", fontSize: 14, outline: "none", marginBottom: 16
              }}
              placeholder={`Отправить сообщение ${replyNote.userName.trim()}...`}
              value={noteReplyText}
              onChange={e => setNoteReplyText(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && noteReplyText.trim()) {
                  const cleanUser = replyNote.userName.toLowerCase().replace(/\s/g, "");
                  const matchChat = chats?.find((c: Chat) => {
                    const other = getOtherUserInfo(c);
                    return other.userName?.toLowerCase().replace(/\s/g, "") === cleanUser;
                  });

                  const noteDesc = replyNote.music 
                    ? `[🎵 ${replyNote.music.title}] ${replyNote.noteText}`
                    : replyNote.noteText;

                  if (matchChat) {
                    try {
                      await sendMessage({
                        ChatId: matchChat.chatId,
                        MessageText: `Ответ на заметку "${noteDesc}": ${noteReplyText.trim()}`,
                        File: null,
                      }).unwrap();
                      setSelectedChatId(matchChat.chatId);
                    } catch (err) {
                      console.error("Failed to send message via note reply:", err);
                    }
                  }
                  alert(`Ваш ответ "${noteReplyText}" успешно отправлен пользователю @${replyNote.userName.trim()}!`);
                  setReplyNote(null);
                  setNoteReplyText("");
                }
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setReplyNote(null)}
                style={{
                  flex: 1, background: "#efefef", color: "#262626", border: "none",
                  borderRadius: 8, padding: "10px 0", fontWeight: 600, cursor: "pointer"
                }}
              >
                Отмена
              </button>
              <button
                onClick={async () => {
                  if (noteReplyText.trim()) {
                    const cleanUser = replyNote.userName.toLowerCase().replace(/\s/g, "");
                    const matchChat = chats?.find((c: Chat) => {
                      const other = getOtherUserInfo(c);
                      return other.userName?.toLowerCase().replace(/\s/g, "") === cleanUser;
                    });

                    const noteDesc = replyNote.music 
                      ? `[🎵 ${replyNote.music.title}] ${replyNote.noteText}`
                      : replyNote.noteText;

                    if (matchChat) {
                      try {
                        await sendMessage({
                          ChatId: matchChat.chatId,
                          MessageText: `Ответ на заметку "${noteDesc}": ${noteReplyText.trim()}`,
                          File: null,
                        }).unwrap();
                        setSelectedChatId(matchChat.chatId);
                      } catch (err) {
                        console.error("Failed to send message via note reply:", err);
                      }
                    }
                    alert(`Ваш ответ "${noteReplyText}" успешно отправлен пользователю @${replyNote.userName.trim()}!`);
                    setReplyNote(null);
                    setNoteReplyText("");
                  }
                }}
                disabled={!noteReplyText.trim()}
                style={{
                  flex: 1, background: "#0095f6", color: "#fff", border: "none",
                  borderRadius: 8, padding: "10px 0", fontWeight: 600, cursor: "pointer",
                  opacity: noteReplyText.trim() ? 1 : 0.5
                }}
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

//  Inline Styles 
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
    overflow: "hidden",
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
  threeDotBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "2px 4px",
    color: "#8e8e8e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
    transition: "color .15s",
  },
  chatContextMenu: {
    position: "absolute" as const,
    right: 0,
    top: "calc(100% + 4px)",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
    zIndex: 999,
    minWidth: 220,
    padding: "6px 0",
    border: "1px solid #efefef",
  },
  chatMenuOption: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "12px 20px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "#262626",
    textAlign: "left" as const,
    gap: 12,
    transition: "background .1s",
  },
  chatMenuOptionDanger: {
    color: "#ed4956",
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
    overflow: "hidden",
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
    width: "fit-content",
    maxWidth: "100%",
    padding: "10px 14px",
    borderRadius: 18,
    position: "relative" as const,
  },
  ownBubble: {
    background: "linear-gradient(135deg, #d946ef 0%, #8b5cf6 50%, #3b82f6 100%)",
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
    wordBreak: "normal" as const,
    overflowWrap: "break-word" as const,
    whiteSpace: "pre-wrap" as const,
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
    whiteSpace: "nowrap" as const,
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
  voiceMsgContainer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 200,
    padding: "2px 0",
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.3)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "inherit",
  },
  voiceWaveWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
    minWidth: 0,
  },
  voiceSeekBar: {
    width: "100%",
    height: 3,
    accentColor: "rgba(255,255,255,0.9)",
    cursor: "pointer",
  },
  voiceTimeLabel: {
    fontSize: 11,
    opacity: 0.8,
    textAlign: "right" as const,
  },
  recordingBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    padding: "4px 0",
  },
  recordingCancelBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#8e8e8e",
    padding: 4,
    display: "flex",
    alignItems: "center",
  },
  recordingPulse: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#ed4956",
    animation: "pulse 1s infinite",
    flexShrink: 0,
  },
  recordingTimer: {
    fontSize: 15,
    fontWeight: 600,
    color: "#262626",
    minWidth: 40,
  },
  recordingSendBtn: {
    background: "#0095f6",
    border: "none",
    borderRadius: "50%",
    width: 36,
    height: 36,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
  },

  // Reply button
  replyBtn: {
    background: "rgba(255,255,255,0.9)",
    border: "none",
    cursor: "pointer",
    padding: 6,
    color: "#8e8e8e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
    transition: "color .15s",
    flexShrink: 0,
    alignSelf: "center",
  },
  msgActionBtn: {
    background: "rgba(255,255,255,0.95)",
    border: "none",
    cursor: "pointer",
    padding: 6,
    color: "#555",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    boxShadow: "0 1px 6px rgba(0,0,0,0.13)",
    transition: "color .15s",
    flexShrink: 0,
  },
  msgContextMenu: {
    position: "absolute" as const,
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 6px 32px rgba(0,0,0,0.16)",
    zIndex: 999,
    minWidth: 210,
    padding: "6px 0",
    border: "1px solid #efefef",
  },
  msgMenuItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "13px 20px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    color: "#262626",
    textAlign: "left" as const,
    gap: 12,
    transition: "background .1s",
  },
  msgMenuDivider: {
    height: 1,
    background: "#efefef",
    margin: "4px 0",
  },
  msgMenuItemDanger: {
    color: "#ed4956",
  },
  replyPreview: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 12px",
    marginBottom: 8,
    background: "#f7f7f7",
    borderRadius: 12,
    border: "1px solid #efefef",
  },
  replyPreviewBar: {
    width: 3,
    borderRadius: 3,
    alignSelf: "stretch",
    background: "#0095f6",
    flexShrink: 0,
  },
  replyPreviewContent: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  replyPreviewLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0095f6",
  },
  replyPreviewText: {
    fontSize: 13,
    color: "#8e8e8e",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  replyPreviewClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    color: "#8e8e8e",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
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
  },
  inputPill: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    border: "1px solid #dbdbdb",
    borderRadius: 24,
    padding: "0 16px 0 8px",
    background: "#fff",
    minWidth: 0,
  },
  emojiBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px 6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
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
  voiceBtn: {
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
    fontSize: 15,
    padding: "12px 14px",
    color: "#262626",
    minWidth: 0,
  },
  sendTextBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "8px 4px 8px 8px",
    color: "#0095f6",
    fontWeight: 600,
    fontSize: 14,
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
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
