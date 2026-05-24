"use client";

import React, { useState } from "react";
import {
  useCreateChatMutation,
  useSendMessageMutation,
  useGetChatsQuery,
  type Chat,
} from "@/app/services/chatApi";
import { GetUserId } from "@/app/utils/token";

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: number | string;
  postUrl?: string;
  onSent?: (message: string) => void;
  onChatCreated?: (chatId: number) => void;
}

export default function NewMessageModal({
  isOpen,
  onClose,
  postId,
  postUrl,
  onSent,
  onChatCreated,
}: NewMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const myUserId = GetUserId();
  const { data: chats = [] } = useGetChatsQuery(undefined, { skip: !isOpen });
  const [createChat, { isLoading: creating }] = useCreateChatMutation();
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();

  // Extract other user's info from chats (only show users we chatted with)
  const chatUsers = React.useMemo(() => {
    return chats.map((chat: Chat) => {
      const isSenderMe = myUserId ? String(chat.sendUserId) === String(myUserId) : true;
      return {
        id: isSenderMe ? chat.receiveUserId : chat.sendUserId,
        userName: isSenderMe ? (chat.receiveUserName || "User") : (chat.sendUserName || "User"),
        avatar: isSenderMe ? chat.receiveUserImage : chat.sendUserImage,
      };
    });
  }, [chats, myUserId]);

  // Remove duplicates
  const uniqueUsers = React.useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const u of chatUsers) {
      if (u.id && !seen.has(u.id)) {
        seen.add(u.id);
        result.push(u);
      }
    }
    return result;
  }, [chatUsers]);

  // Filter users by search input
  const filteredUsers = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return uniqueUsers;
    return uniqueUsers.filter((u) => u.userName?.toLowerCase().includes(q));
  }, [uniqueUsers, searchQuery]);

  if (!isOpen) return null;

  const handleUserClick = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAction = async () => {
    if (selectedUserIds.length === 0) return;

    try {
      if (postId || postUrl) {
        // Share Mode to multiple users
        for (const userId of selectedUserIds) {
          let chatId: number | null = null;
          const existingChat = chats.find(
            (c: Chat) =>
              String(c.sendUserId) === String(userId) ||
              String(c.receiveUserId) === String(userId)
          );

          if (existingChat) {
            chatId = existingChat.chatId;
          } else {
            chatId = await createChat(userId).unwrap();
          }

          if (chatId) {
            const finalMessage = postUrl || `${window.location.origin}/post/${postId}`;
            
            await sendMessage({
              ChatId: chatId,
              MessageText: finalMessage,
              File: null,
            }).unwrap();
          }
        }

        if (onSent) {
          onSent("Отправлено в чат!");
        }
        handleClose();
      } else {
        // Normal DM Chat Creation Mode
        for (const userId of selectedUserIds) {
          const newChatId = await createChat(userId).unwrap();
          if (onChatCreated) {
            onChatCreated(newChatId);
          }
        }
        handleClose();
      }
    } catch (err) {
      console.error("Failed to execute action in NewMessageModal:", err);
    }
  };

  const handleSocialShare = (platform: string) => {
    const finalUrl = postUrl || `${window.location.origin}/post/${postId}`;
    if (!finalUrl) return;

    if (platform === "copy") {
      navigator.clipboard.writeText(finalUrl).then(() => {
        if (onSent) onSent("Ссылка скопирована!");
      });
    } else if (platform === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(finalUrl)}`, "_blank");
    } else if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(finalUrl)}`, "_blank");
    } else if (platform === "email") {
      window.open(`mailto:?body=${encodeURIComponent(finalUrl)}`, "_blank");
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedUserIds([]);
    onClose();
  };

  const renderDefaultAvatar = () => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="24" height="24" fill="#efefef"/>
      <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" fill="#dbdbdb"/>
      <path d="M12 13C8.68629 13 6 15.6863 6 19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19C18 15.6863 15.3137 13 12 13Z" fill="#dbdbdb"/>
    </svg>
  );

  return (
    <div style={styles.modalOverlay} onClick={handleClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ width: 24 }} />
          <h3 style={styles.modalTitle}>Поделиться</h3>
          <button style={styles.modalClose} onClick={handleClose}>✕</button>
        </div>
        <div style={styles.modalSearchBox}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            style={styles.modalSearchInput}
            placeholder="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div style={styles.modalUserList}>
          {filteredUsers.length === 0 ? (
            <div style={styles.modalHint}>
              {searchQuery ? "Нет совпадений" : "Начните чат в Direct, чтобы делиться публикациями"}
            </div>
          ) : (
            <div style={styles.gridContainer}>
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <button
                    key={user.id}
                    style={{
                      ...styles.gridItem,
                      backgroundColor: isSelected ? "#f3f4f6" : "transparent",
                    }}
                    onClick={() => handleUserClick(user.id)}
                    disabled={creating || sending}
                  >
                    <div style={{ position: "relative" }}>
                      <div style={styles.avatarWrapper}>
                        {user.avatar ? (
                          <img
                            src={`https://instagram-api.softclub.tj/images/${user.avatar}`}
                            alt=""
                            style={styles.avatarImg}
                          />
                        ) : (
                          renderDefaultAvatar()
                        )}
                      </div>
                      {isSelected && (
                        <div style={styles.checkmarkBadge}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span style={styles.gridUserName}>{user.userName}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Social Share platform row */}
        {(postId || postUrl) && (
          <div style={styles.socialContainer}>
            <div style={styles.socialShareRow}>
              <button onClick={() => handleSocialShare("copy")} style={styles.socialItem}>
                <div style={styles.socialCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <span style={styles.socialText}>Копировать ссылку</span>
              </button>
              
              <button onClick={() => handleSocialShare("telegram")} style={styles.socialItem}>
                <div style={styles.socialCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </div>
                <span style={styles.socialText}>Telegram</span>
              </button>

              <button onClick={() => handleSocialShare("whatsapp")} style={styles.socialItem}>
                <div style={styles.socialCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span style={styles.socialText}>WhatsApp</span>
              </button>

              <button onClick={() => handleSocialShare("email")} style={styles.socialItem}>
                <div style={styles.socialCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <span style={styles.socialText}>Email</span>
              </button>
            </div>
          </div>
        )}

        <div style={styles.modalFooter}>
          <button
            style={{
              ...styles.modalChatBtn,
              opacity: selectedUserIds.length > 0 ? 1 : 0.4,
            }}
            disabled={selectedUserIds.length === 0 || creating || sending}
            onClick={handleAction}
          >
            {postId || postUrl 
              ? (selectedUserIds.length > 1 ? "Отправить по отдельности" : "Отправить") 
              : "Чат"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
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
    width: 440,
    maxHeight: "85vh",
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
    gap: 10,
    padding: "10px 16px",
    margin: "12px 20px",
    background: "#efefef",
    borderRadius: 10,
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
    maxHeight: 280,
    padding: "0 20px",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px 12px",
    padding: "8px 0",
  },
  gridItem: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    background: "none",
    border: "none",
    padding: "10px 6px",
    borderRadius: 12,
    cursor: "pointer",
    transition: "background .15s",
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 6,
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  gridUserName: {
    fontSize: 11,
    color: "#262626",
    fontWeight: 500,
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%",
  },
  modalHint: {
    textAlign: "center" as const,
    color: "#8e8e8e",
    padding: "40px 20px",
    fontSize: 13,
  },
  socialContainer: {
    borderTop: "1px solid #efefef",
    padding: "12px 20px 4px 20px",
  },
  socialShareRow: {
    display: "flex",
    gap: 20,
    overflowX: "auto" as const,
    paddingBottom: 8,
    scrollbarWidth: "none" as const,
  },
  socialItem: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    flexShrink: 0,
    width: 76,
  },
  socialCircle: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "1px solid #dbdbdb",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  socialText: {
    fontSize: 9,
    color: "#8e8e8e",
    textAlign: "center" as const,
    whiteSpace: "normal" as const,
    lineHeight: "1.1",
  },
  modalFooter: {
    padding: "16px 20px",
    borderTop: "1px solid #efefef",
  },
  checkmarkBadge: {
    position: "absolute" as const,
    bottom: 4,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: "50%",
    backgroundColor: "#0095f6",
    border: "2px solid #fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    zIndex: 2,
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
};
