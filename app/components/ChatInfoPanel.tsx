"use client";

import React, { useState } from "react";

interface ChatInfoPanelProps {
  otherUser: any;
  onClose: () => void;
  onDeleteChat: () => void;
  isBlocked?: boolean;
  isBlockedByOther?: boolean;
  onBlock?: () => void;
  onUnblock?: () => void;
  onMuteToggle?: (muted: boolean) => void;
}

export default function ChatInfoPanel({
  otherUser,
  onClose,
  onDeleteChat,
  isBlocked: parentIsBlocked,
  isBlockedByOther = false,
  onBlock,
  onUnblock,
  onMuteToggle
}: ChatInfoPanelProps) {
  const [muteNotifications, setMuteNotifications] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && otherUser?.userId) {
      setMuteNotifications(localStorage.getItem(`muted_chat_${otherUser.userId}`) === "true");
    }
  }, [otherUser?.userId]);

  const handleToggleMute = () => {
    const next = !muteNotifications;
    setMuteNotifications(next);
    if (typeof window !== "undefined" && otherUser?.userId) {
      localStorage.setItem(`muted_chat_${otherUser.userId}`, next ? "true" : "false");
    }
    if (onMuteToggle) {
      onMuteToggle(next);
    }
  };

  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportStep, setReportStep] = useState<"reason" | "thank_you" | "success">("reason");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localIsBlocked, setLocalIsBlocked] = useState(false);

  const isBlocked = parentIsBlocked !== undefined ? parentIsBlocked : localIsBlocked;

  const reportReasons = [
    "Спам",
    "Оскорбления или травля",
    "Мошенничество или обман",
    "Сексуальные материалы",
    "Насилие или угрозы",
    "Другое",
  ];

  const handleBlock = () => {
    if (onBlock) {
      onBlock();
    } else {
      setLocalIsBlocked(true);
    }
    setShowBlockConfirm(false);
  };

  const handleUnblock = () => {
    if (onUnblock) {
      onUnblock();
    } else {
      setLocalIsBlocked(false);
    }
  };

  const handleReport = () => {
    if (!reportReason) return;
    setReportStep("thank_you");
  };

  return (
    <>
      <div style={{
        width: 350,
        height: "100%",
        backgroundColor: "#fff",
        borderLeft: "1px solid #dbdbdb",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        flexShrink: 0
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid #dbdbdb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: "#000" }}>Информация</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Mute Notifications */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #dbdbdb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer"
        }} onClick={handleToggleMute}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span style={{ fontSize: 15, color: "#262626" }}>Выключить уведомления о сообщениях</span>
          </div>
          <div style={{
            width: 44, height: 24, borderRadius: 12,
            backgroundColor: muteNotifications ? "#0095f6" : "#c7c7c7",
            position: "relative", transition: "background-color 0.2s", flexShrink: 0
          }}>
            <div style={{
              position: "absolute", top: 2,
              left: muteNotifications ? 22 : 2,
              width: 20, height: 20, borderRadius: "50%",
              backgroundColor: "#fff", transition: "left 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
            }} />
          </div>
        </div>

        {/* Participants */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #dbdbdb" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0", color: "#000" }}>Участники</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {otherUser?.userId === "ai_assistant_user" ? (
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(79, 172, 254, 0.25)",
                flexShrink: 0
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
            ) : otherUser?.userImage ? (
              <img
                src={`http://localhost:3000${otherUser.userImage}`}
                alt=""
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: "50%", backgroundColor: "#efefef", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
                  <rect width="24" height="24" fill="#efefef"/>
                  <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" fill="#dbdbdb"/>
                  <path d="M12 13C8.68629 13 6 15.6863 6 19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19C18 15.6863 15.3137 13 12 13Z" fill="#dbdbdb"/>
                </svg>
              </div>
            )}
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#262626" }}>{otherUser?.userName}</div>
              <div style={{ fontSize: 14, color: "#8e8e8e" }}>{otherUser?.userName}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "8px 0" }}>
          {otherUser?.userId !== "ai_assistant_user" && (
            <>
              <button style={actionBtnStyle}>Никнеймы</button>

              {!isBlockedByOther && (
                <button
                  onClick={() => {
                    if (isBlocked) {
                      handleUnblock();
                    } else {
                      setShowBlockConfirm(true);
                    }
                  }}
                  style={{
                    ...actionBtnStyle,
                    color: isBlocked ? "#0095f6" : "#262626",
                    fontWeight: isBlocked ? 600 : "normal",
                  }}
                >
                  {isBlocked ? "Разблокировать" : "Заблокировать"}
                </button>
              )}

              <button
                onClick={() => {
                  setReportStep("reason");
                  setReportReason("");
                  setShowReportModal(true);
                }}
                style={{ ...actionBtnStyle, color: "#ed4956" }}
              >
                Пожаловаться
              </button>
            </>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{ ...actionBtnStyle, color: "#ed4956" }}
          >
            Удалить чат
          </button>
        </div>
      </div>

      {/* Block Confirm Modal */}
      {showBlockConfirm && (
        <div style={overlayStyle} onClick={() => setShowBlockConfirm(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: "#efefef", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", overflow: "hidden" }}>
              {otherUser?.userId === "ai_assistant_user" ? (
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(79, 172, 254, 0.25)",
                  flexShrink: 0
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                </div>
              ) : otherUser?.userImage
                ? <img src={`http://localhost:3000${otherUser.userImage}`} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} />
                : <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%", display: "block" }}>
                    <rect width="24" height="24" fill="#efefef"/>
                    <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" fill="#dbdbdb"/>
                    <path d="M12 13C8.68629 13 6 15.6863 6 19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19C18 15.6863 15.3137 13 12 13Z" fill="#dbdbdb"/>
                  </svg>
              }
            </div>
            <h3 style={{ textAlign: "center", fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
              Заблокировать @{otherUser?.userName}?
            </h3>
            <p style={{ textAlign: "center", fontSize: 14, color: "#8e8e8e", margin: "0 0 20px" }}>
              Он больше не сможет найти ваш профиль или написать вам.
            </p>
            <button onClick={handleBlock} style={{ ...dangerBtnStyle, marginBottom: 8 }}>
              Заблокировать
            </button>
            <button onClick={() => setShowBlockConfirm(false)} style={cancelBtnStyle}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div style={overlayStyle} onClick={() => {
          // Prevent closing on success step to keep focus
          if (reportStep !== "success") {
            setShowReportModal(false);
          }
        }}>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes modalShow {
              from { opacity: 0; transform: scale(0.96) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .instagram-custom-modal {
              animation: modalShow 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
              transition: width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), padding 0.25s ease, border-radius 0.25s ease;
            }
            .guidelines-link:hover {
              text-decoration: underline;
            }
          `}} />
          <div
            className="instagram-custom-modal"
            onClick={e => e.stopPropagation()}
            style={{
              ...modalStyle,
              width: reportStep === "thank_you" ? 460 : 360,
              borderRadius: 28,
              padding: reportStep === "thank_you" ? "32px 24px 24px" : "28px 24px 20px",
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.15)",
              border: "none",
            }}
          >
            {reportStep === "success" ? (
              <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                {/* 3D Green checkmark in a rounded square */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 18,
                    background: "linear-gradient(135deg, #4ce07a, #27b653)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 8px 24px rgba(39, 182, 83, 0.35), inset 0 -3px 0 rgba(0, 0, 0, 0.15), inset 0 2px 0 rgba(255, 255, 255, 0.25)",
                    transform: "perspective(200px) rotateX(5deg)",
                  }}>
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 8px", color: "#262626" }}>Жалоба отправлена</h3>
                <p style={{ fontSize: 14, color: "#8e8e8e", margin: 0, lineHeight: "1.4" }}>Мы рассмотрим её в ближайшее время.</p>
              </div>
            ) : reportStep === "thank_you" ? (
              <div style={{ textAlign: "center" }}>
                {/* Green checkmark circle */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: "3px solid #47c126",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#47c126" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                </div>

                <h3 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#262626",
                  margin: "0 0 12px 0",
                  lineHeight: "1.2"
                }}>
                  Благодарим за информацию
                </h3>

                <p style={{
                  fontSize: 14,
                  color: "#555555",
                  lineHeight: "1.45",
                  margin: "0 0 24px 0",
                  padding: "0 8px",
                }}>
                  Когда вы видите в Instagram контент, который вам не нравится, вы можете пожаловаться на него, если он нарушает наши{" "}
                  <span className="guidelines-link" style={{ color: "#385185", fontWeight: 600, cursor: "pointer" }} onClick={() => alert("Нормы сообщества Instagram...")}>Нормы сообщества</span>. Вы также можете скрыть опубликовавшего его человека из своих лент.
                </p>

                {/* Actions list */}
                <div style={{
                  borderTop: "1px solid #dbdbdb",
                  borderBottom: "1px solid #dbdbdb",
                  margin: "0 -24px 24px -24px",
                }}>
                  {/* Block Action */}
                  <div
                    onClick={() => {
                      handleBlock();
                      setReportStep("success");
                      setTimeout(() => {
                        setShowReportModal(false);
                        setReportStep("reason");
                        setReportReason("");
                      }, 3000);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 24px",
                      cursor: "pointer",
                      backgroundColor: "#fff",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fafafa"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
                  >
                    <span style={{ fontSize: 14, color: "#ed4956", fontWeight: 600 }}>
                      Заблокировать {otherUser?.userName || "пользователя"}
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c7c7c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>

                  {/* Guidelines Action */}
                  <div
                    onClick={() => {
                      alert("Нормы сообщества: Мы стремимся поддерживать безопасную и уважительную среду общения.");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 24px",
                      borderTop: "1px solid #dbdbdb",
                      cursor: "pointer",
                      backgroundColor: "#fff",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fafafa"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fff"}
                  >
                    <span style={{ fontSize: 14, color: "#262626", fontWeight: 500 }}>
                      Подробнее о Нормах сообщества
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c7c7c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setReportStep("success");
                    setTimeout(() => {
                      setShowReportModal(false);
                      setReportStep("reason");
                      setReportReason("");
                    }, 3000);
                  }}
                  style={{
                    width: "100%",
                    padding: "14px",
                    backgroundColor: "#4c61f7",
                    color: "#fff",
                    border: "none",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(76, 97, 247, 0.2)",
                    transition: "background-color 0.2s, transform 0.1s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#3a4ee0"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#4c61f7"}
                  onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
                  onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  Закрыть
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ textAlign: "center", fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "#262626" }}>Пожаловаться</h3>
                <p style={{ textAlign: "center", fontSize: 14, color: "#8e8e8e", margin: "0 0 20px" }}>
                  Почему вы хотите пожаловаться на этого пользователя?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {reportReasons.map(reason => (
                    <label key={reason} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      borderRadius: 10, cursor: "pointer",
                      backgroundColor: reportReason === reason ? "#eff7ff" : "#fafafa",
                      border: "1px solid",
                      borderColor: reportReason === reason ? "#0095f6" : "#dbdbdb",
                      transition: "all 0.2s ease"
                    }}>
                      <input
                        type="radio"
                        name="report_reason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={() => setReportReason(reason)}
                        style={{ accentColor: "#0095f6" }}
                      />
                      <span style={{ fontSize: 14, color: "#262626", fontWeight: reportReason === reason ? 600 : "normal" }}>{reason}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleReport}
                  disabled={!reportReason}
                  style={{
                    ...dangerBtnStyle,
                    marginBottom: 8,
                    opacity: reportReason ? 1 : 0.4,
                    cursor: reportReason ? "pointer" : "not-allowed",
                    backgroundColor: reportReason ? "#ed4956" : "#efefef",
                    color: reportReason ? "#fff" : "#8e8e8e",
                    transition: "all 0.2s ease"
                  }}
                >
                  Отправить жалобу
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  style={{
                    ...cancelBtnStyle,
                    borderColor: "#dbdbdb",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fafafa"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Отмена
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div style={overlayStyle} onClick={() => setShowDeleteConfirm(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <h3 style={{ textAlign: "center", fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>Удалить чат?</h3>
            <p style={{ textAlign: "center", fontSize: 14, color: "#8e8e8e", margin: "0 0 20px" }}>
              Вся переписка будет удалена. Это действие невозможно отменить.
            </p>
            <button
              onClick={() => { setShowDeleteConfirm(false); onDeleteChat(); }}
              style={{ ...dangerBtnStyle, marginBottom: 8 }}
            >
              Удалить
            </button>
            <button onClick={() => setShowDeleteConfirm(false)} style={cancelBtnStyle}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const actionBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 24px",
  background: "none",
  border: "none",
  textAlign: "left",
  fontSize: 16,
  color: "#262626",
  cursor: "pointer",
  display: "block",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0, left: 0,
  width: "100%", height: "100%",
  backgroundColor: "rgba(0,0,0,0.6)",
  zIndex: 200000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: "28px 24px 20px",
  width: 340,
  maxWidth: "90vw",
  display: "flex",
  flexDirection: "column",
};

const dangerBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  backgroundColor: "#ed4956",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};

const cancelBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  backgroundColor: "transparent",
  color: "#262626",
  border: "1px solid #dbdbdb",
  borderRadius: 10,
  fontSize: 16,
  cursor: "pointer",
};
