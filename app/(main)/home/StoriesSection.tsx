"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Api } from "../../utils/token";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";

import {
  useAddStoryViewMutation,
  useGetStoriesQuery,
  useLikeStoryMutation,
} from "@/app/services/home.store";

const STORY_DURATION = 5000;

// Ключ для localStorage — хранит Set просмотренных storyId
const SEEN_STORAGE_KEY = "seen_story_user_ids";

// Читаем из localStorage список просмотренных userId
const getPersistedSeenUserIds = (): Record<number, boolean> => {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

// Сохраняем userId как просмотренный в localStorage
const persistSeenUserId = (userId: number) => {
  try {
    const current = getPersistedSeenUserIds();
    current[userId] = true;
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
};

const StoriesSection = () => {
  const [likeStory] = useLikeStoryMutation();
  const [addStoryView] = useAddStoryViewMutation();

  const [showStories, setShowStories] = useState(false);
  const [viewCounts, setViewCounts] = useState<Record<number, number>>({});

  const [activeUserIndex, setActiveUserIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const [replyText, setReplyText] = useState("");
  const [isMuted, setIsMuted] = useState(true);

  const [likedStories, setLikedStories] = useState<Record<number, boolean>>({});

  // seenStories — объединяет localStorage + бэкенд (isViewed) + текущая сессия
  const [seenStories, setSeenStories] = useState<Record<number, boolean>>(
    () => getPersistedSeenUserIds()
  );

  const { data: stories = [], isLoading } = useGetStoriesQuery({});

  // ГРУППИРОВКА СТОРИС ПО ПОЛЬЗОВАТЕЛЯМ
  const groupedUsers = useMemo(() => {
    return stories.reduce((acc: any[], story: any) => {
      const existing = acc.find((u) => u.userId === story.userId);

      if (!existing) {
        acc.push({
          userId: story.userId,
          userName: story.userName,
          userAvatar: story.userAvatar,
          stories: [story],
        });
      } else {
        existing.stories.push(story);
      }

      return acc;
    }, []);
  }, [stories]);

  const activeUser = groupedUsers[activeUserIndex];
  const activeStories = activeUser?.stories?.filter((s: any) => s.fileName) ?? [];
  const activeStory = activeStories?.[activeStoryIndex];

  // СИНХРОНИЗАЦИЯ ЛАЙКОВ
  const isLiked = activeStory
    ? (likedStories[activeStory.id] ?? !!activeStory.isLiked)
    : false;

  // Количество просмотров истории
  const currentStoryViews = activeStory
    ? (viewCounts[activeStory.id] ?? activeStory.viewCount ?? 0)
    : 0;

  // Пометить пользователя как просмотренного — локально + localStorage
  const markUserAsSeen = (userId: number) => {
    setSeenStories((prev) => {
      if (prev[userId]) return prev; // уже помечен — не обновляем стейт
      const updated = { ...prev, [userId]: true };
      return updated;
    });
    persistSeenUserId(userId);
  };

  // НАВИГАЦИЯ: ВПЕРЕД
  const goNext = () => {
    if (activeUser?.userId) {
      markUserAsSeen(activeUser.userId);
    }

    if (activeStoryIndex < activeStories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else if (activeUserIndex < groupedUsers.length - 1) {
      setActiveUserIndex((prev) => prev + 1);
      setActiveStoryIndex(0);
    } else {
      setShowStories(false);
    }
  };

  // НАВИГАЦИЯ: НАЗАД
  const goPrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else if (activeUserIndex > 0) {
      const prevUser = groupedUsers[activeUserIndex - 1];
      setActiveUserIndex((prev) => prev - 1);
      setActiveStoryIndex(prevUser.stories.length - 1);
    }
  };

  // ЭФФЕКТ ОТПРАВКИ ПРОСМОТРА
  useEffect(() => {
    if (!showStories || !activeStory?.id || !activeUser?.userId) return;

    // 1. Мгновенно помечаем как просмотренное (localStorage + стейт)
    markUserAsSeen(activeUser.userId);

    // 2. Отправляем на сервер
    addStoryView(activeStory.id)
      .unwrap()
      .then((res: any) => {
        // API возвращает { data: { id, viewUserId, storyId }, ... }
        // viewCount не возвращается — инкрементируем локально
        setViewCounts((prev) => ({
          ...prev,
          [activeStory.id]: (prev[activeStory.id] ?? activeStory.viewCount ?? 0) + 1,
        }));
      })
      .catch((error) => {
        console.error("Ошибка при добавлении просмотра:", error);
      });
  }, [activeStory?.id, showStories, activeUser?.userId]);

  // АВТОПЛЕЙ ТАЙМЕР
  useEffect(() => {
    if (!showStories) return;

    const timer = setTimeout(() => {
      goNext();
    }, STORY_DURATION);

    return () => clearTimeout(timer);
  }, [showStories, activeStoryIndex, activeUserIndex]);

  if (isLoading) {
    return (
      <div className="flex gap-4 px-4 py-4 overflow-x-auto select-none bg-white border-b border-gray-100 scrollbar-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col items-center animate-pulse">
            <div className="w-[68px] h-[68px] rounded-full bg-gray-200" />
            <div className="w-14 h-2 bg-gray-200 rounded-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!groupedUsers.length) return null;

  return (
    <>
      {/* ЛЕНТА ИСТОРИЙ */}
      <div className="flex gap-4 px-4 py-4 overflow-x-auto bg-white border-b border-gray-200 select-none scrollbar-none">
        {groupedUsers.map((user: any, idx: number) => {
          // Просмотрено: localStorage ИЛИ бэкенд (все сторис пользователя isViewed)
          const isBackendSeen = user.stories.every((story: any) => !!story.isViewed);
          const isSeen = seenStories[user.userId] || isBackendSeen;

          return (
            <button
              key={user.userId}
              onClick={() => {
                setActiveUserIndex(idx);
                setActiveStoryIndex(0);
                setShowStories(true);
              }}
              className="flex flex-col items-center gap-1.5 min-w-[72px] focus:outline-none"
            >
              <div
                className={`
                  w-[69px] h-[69px]
                  rounded-full
                  flex items-center justify-center
                  transition-all duration-300
                  ${
                    isSeen
                      ? "border border-gray-300 bg-transparent p-0"
                      : "bg-gradient-to-tr from-[#fbc117] via-[#f02a64] to-[#b325ad] p-[3px]"
                  }
                `}
              >
                <div className={`w-full h-full rounded-full bg-white transition-all ${isSeen ? "p-0" : "p-[2px]"}`}>
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                    <img
                      src={
                        user.userAvatar
                          ? `${Api}/images/${user.userAvatar}`
                          : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                      }
                      className="w-full h-full object-cover"
                      alt=""
                    />
                  </div>
                </div>
              </div>

              <span className={`text-[12px] tracking-tight truncate w-[72px] text-center ${isSeen ? "text-gray-400" : "text-gray-800"}`}>
                {user.userName}
              </span>
            </button>
          );
        })}
      </div>

      {/* МОДАЛКА ИСТОРИИ */}
      {showStories && activeStory && (
        <div className="fixed inset-0 z-50 bg-[#1a1a1a] flex items-center justify-center select-none p-0 md:p-6 overflow-hidden">

          {/* ЗАДНИЙ ФОН С РАЗМЫТИЕМ */}
          <div className="absolute inset-0 z-0 hidden md:block opacity-50 blur-3xl scale-110 pointer-events-none">
            {activeStory.fileName?.match(/\.(mp4|webm|ogg)$/i) ? (
              <video src={`${Api}/images/${activeStory.fileName}`} className="w-full h-full object-cover" muted />
            ) : (
              <img src={`${Api}/images/${activeStory.fileName}`} className="w-full h-full object-cover" alt="" />
            )}
          </div>

          {/* КРЕСТИК ЗАКРЫТИЯ */}
          <button
            onClick={() => setShowStories(false)}
            className="absolute top-4 right-4 z-40 text-white/80 hover:text-white transition focus:outline-none"
          >
            <CloseIcon sx={{ fontSize: 28 }} />
          </button>

          {/* ОСНОВНОЙ БЛОК */}
          <div className="relative z-10 flex items-center justify-center w-full max-w-[540px] h-full md:h-[95vh] max-h-[840px]">

            {/* СТРЕЛКА НАЗАД */}
            {(activeStoryIndex > 0 || activeUserIndex > 0) && (
              <button
                onClick={goPrev}
                className="absolute left-[-56px] hidden md:flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition focus:outline-none"
              >
                <ChevronLeftIcon sx={{ fontSize: 28 }} />
              </button>
            )}

            {/* КОНТЕЙНЕР КАРТОЧКИ (9:16) */}
            <div className="relative w-[450px] h-full md:aspect-[9/16] bg-black md:rounded-lg overflow-hidden flex flex-col justify-between shadow-2xl">

              {/* МЕДИА СТОРИС */}
              <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
                {activeStory.fileName?.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    src={`${Api}/images/${activeStory.fileName}`}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted={isMuted}
                    loop
                    playsInline
                  />
                ) : (
                  <img
                    src={`${Api}/images/${activeStory.fileName}`}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                )}
              </div>

              {/* ХЕДЕР СТОРИС */}
              <div className="relative z-20 w-full p-3 bg-gradient-to-b from-black/80 via-black/30 to-transparent pt-3">
                <div className="flex gap-1 mb-3">
                  {activeStories.map((_: any, index: number) => (
                    <div key={index} className="h-[2px] flex-1 bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-300 ease-linear"
                        style={{ width: index < activeStoryIndex ? "100%" : index === activeStoryIndex ? "100%" : "0%" }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-gray-800">
                      <img
                        src={
                          activeUser.userAvatar
                            ? `${Api}/images/${activeUser.userAvatar}`
                            : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        className="w-full h-full object-cover"
                        alt=""
                      />
                    </div>
                    <span className="font-semibold text-[14px]">{activeUser.userName}</span>
                    <span className="text-[12px] text-white/60">1ч.</span>
                  </div>

                  {/* ЗВУК ДЛЯ ВИДЕО */}
                  {activeStory.fileName?.match(/\.(mp4|webm|ogg)$/i) && (
                    <button
                      onClick={() => setIsMuted((prev) => !prev)}
                      className="text-white/90 hover:text-white transition p-1 focus:outline-none"
                    >
                      {isMuted ? <VolumeOffIcon sx={{ fontSize: 22 }} /> : <VolumeUpIcon sx={{ fontSize: 22 }} />}
                    </button>
                  )}
                </div>
              </div>

              {/* СЕНСОРНАЯ НАВИГАЦИЯ НА МОБИЛЬНЫХ */}
              <div className="absolute inset-x-0 top-16 bottom-20 z-10 flex md:hidden">
                <div onClick={goPrev} className="w-1/3 h-full" />
                <div className="w-1/3 h-full pointer-events-none" />
                <div onClick={goNext} className="w-1/3 h-full" />
              </div>

              {/* ПОДВАЛ */}
              <div className="relative z-20 w-full p-4 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex flex-col gap-2 pb-6 md:pb-4">

                {currentStoryViews > 0 && (
                  <div className="flex items-center gap-1.5 text-white/90 text-[12px] font-medium pl-1 mb-0.5">
                    <RemoveRedEyeIcon sx={{ fontSize: 16 }} className="text-white/80" />
                    <span>Просмотрено: {currentStoryViews}</span>
                  </div>
                )}

                <div className="w-full flex items-center gap-3.5">
                  <div className="flex-1 relative flex items-center">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${activeUser.userName}...`}
                      className="w-full bg-transparent border border-white/40 rounded-full pl-5 pr-12 py-2 text-[14px] text-white placeholder-white/60 outline-none focus:border-white transition-colors"
                    />
                    {replyText && (
                      <button className="absolute right-4 text-white font-semibold text-[14px] hover:text-sky-400">
                        Send
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3.5 text-white">
                    <button
                      className="hover:scale-105 active:scale-95 transition-transform focus:outline-none"
                      onClick={async () => {
                        try {
                          setLikedStories((prev) => ({
                            ...prev,
                            [activeStory.id]: !isLiked,
                          }));
                          await likeStory(activeStory.id).unwrap();
                        } catch (err) {
                          console.error("Ошибка при лайке:", err);
                        }
                      }}
                    >
                      {isLiked ? (
                        <FavoriteIcon className="text-[#ff3040]" fontSize="medium" />
                      ) : (
                        <FavoriteBorderIcon fontSize="medium" />
                      )}
                    </button>

                    <button className="hover:scale-105 active:scale-95 transition-transform focus:outline-none rotate-[-20deg] mb-0.5">
                      <SendIcon fontSize="medium" />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* СТРЕЛКА ВПЕРЕД */}
            <button
              onClick={goNext}
              className="absolute right-[-56px] hidden md:flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition focus:outline-none"
            >
              <ChevronRightIcon sx={{ fontSize: 28 }} />
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default StoriesSection;