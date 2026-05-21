"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Api } from "../../utils/token";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useGetStoriesQuery, useLikeStoryMutation } from "@/app/services/home.store";

const STORY_DURATION = 5000;

const StoriesSection = () => {
  const [likeStory] = useLikeStoryMutation();

  const [showStories, setShowStories] = useState(false);

  const [activeUserIndex, setActiveUserIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const [replyText, setReplyText] = useState("");

  // likes per story
  const [likedStories, setLikedStories] = useState<
    Record<number, boolean>
  >({});

  const { data: stories = [], isLoading } =
    useGetStoriesQuery({});

  // GROUP USERS
  const groupedUsers = useMemo(() => {
    return stories.reduce((acc: any[], story: any) => {
      const existing = acc.find(
        (u) => u.userId === story.userId
      );

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

  const activeStories =
    activeUser?.stories?.filter(
      (s: any) => s.fileName
    ) ?? [];

  const activeStory =
    activeStories?.[activeStoryIndex];

  // like state
  const isLiked =
    likedStories[activeStory?.id] ?? false;

  // NEXT
  const goNext = () => {
    if (
      activeStoryIndex <
      activeStories.length - 1
    ) {
      setActiveStoryIndex((prev) => prev + 1);
    } else if (
      activeUserIndex <
      groupedUsers.length - 1
    ) {
      setActiveUserIndex((prev) => prev + 1);
      setActiveStoryIndex(0);
    } else {
      setShowStories(false);
    }
  };

  // PREV
  const goPrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else if (activeUserIndex > 0) {
      const prevUser =
        groupedUsers[activeUserIndex - 1];

      setActiveUserIndex((prev) => prev - 1);

      setActiveStoryIndex(
        prevUser.stories.length - 1
      );
    }
  };

  // AUTO PLAY
  useEffect(() => {
    if (!showStories) return;

    const timer = setTimeout(() => {
      goNext();
    }, STORY_DURATION);

    return () => clearTimeout(timer);
  }, [
    showStories,
    activeStoryIndex,
    activeUserIndex,
  ]);

  if (isLoading) {
    return (
      <div className="flex gap-4 px-4 py-4 overflow-x-auto select-none bg-white border-b border-gray-100">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center animate-pulse"
          >
            <div className="w-[72px] h-[72px] rounded-full bg-gray-200" />
            <div className="w-14 h-2 bg-gray-200 rounded-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!groupedUsers.length) return null;

  return (
    <>
      {/* STORIES ROW */}
      <div
        className="flex gap-4 px-4 py-4 overflow-x-auto bg-white border-b border-gray-100 select-none
        [&::-webkit-scrollbar]:hidden
        [-ms-overflow-style:none]
        [scrollbar-width:none]"
      >
        {groupedUsers.map((user: any, idx: number) => (
          <button
            key={user.userId}
            onClick={() => {
              setActiveUserIndex(idx);
              setActiveStoryIndex(0);
              setShowStories(true);
            }}
            className="flex flex-col items-center gap-1.5 min-w-[74px] group outline-none"
          >
            <div
              className="
                w-[74px] h-[74px]
                rounded-full
                bg-gradient-to-tr
                from-[#f9ce34]
                via-[#ee2a7b]
                to-[#6228d7]
                p-[2.5px]
                flex items-center justify-center
                transition-transform duration-200 active:scale-95 group-hover:scale-[1.02]
              "
            >
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border border-gray-200">
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

            <span className="text-[11px] font-normal tracking-wide text-gray-700 text-center truncate w-[74px]">
              {user.userName}
            </span>
          </button>
        ))}
      </div>

      {/* STORY MODAL */}
      {showStories && activeStory && (
        <div className="fixed inset-0 z-50 bg-[#1a1a1a] md:bg-black/95 flex items-center justify-center select-none backdrop-blur-md p-4">
          {/* BLUR BG (Only for large screens) */}
          <img
            src={`${Api}/images/${activeStory.fileName}`}
            className="hidden md:block absolute inset-0 w-full h-full object-cover blur-[60px] scale-110 opacity-30 pointer-events-none"
            alt=""
          />

          {/* MAIN CONTAINER FOR INTERFACE (CARD + ARROWS) */}
          <div className="relative flex items-center justify-center w-full max-w-[540px] h-full md:h-[92vh] md:max-h-[840px]">
            
            {/* LEFT NAVIGATION BUTTON (Visible on MD screens and up) */}
            <button
              onClick={goPrev}
              className="hidden md:flex absolute -left-14 z-40 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-white/80 hover:text-white border border-white/10 backdrop-blur-sm cursor-pointer"
            >
              <ChevronLeftIcon className="text-[32px]" />
            </button>

            {/* CARD */}
            <div className="relative w-full h-full md:w-[420px] rounded-xl overflow-hidden bg-black md:shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col justify-between">
              
              {/* IMAGE */}
              <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
                <img
                  src={`${Api}/images/${activeStory.fileName}`}
                  className="w-full h-full object-cover pointer-events-none"
                  alt=""
                />
              </div>

              {/* HEADER */}
              <div className="absolute top-0 left-0 right-0 z-30 px-[11px] pt-3 pb-8 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                {/* progress */}
                <div className="flex gap-[3px] mb-3">
                  {activeStories.map(
                    (_: any, i: number) => (
                      <div
                        key={i}
                        className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden"
                      >
                        <div
                          className={`h-full bg-white rounded-full ${
                            i < activeStoryIndex
                              ? "w-full"
                              : i === activeStoryIndex
                              ? "animate-[progress_5s_linear_forwards]"
                              : "w-0"
                          }`}
                        />
                      </div>
                    )
                  )}
                </div>

                {/* user row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-[1px] bg-white/20 rounded-full">
                      <img
                        src={
                          activeUser.userAvatar
                            ? `${Api}/images/${activeUser.userAvatar}`
                            : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                        }
                        className="w-8 h-8 rounded-full object-cover border border-black/10"
                        alt=""
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-white text-[14px] font-semibold tracking-wide hover:underline cursor-pointer">
                        {activeUser.userName}
                      </p>
                      <span className="text-white/60 text-[13px] font-light">•</span>
                      <p className="text-white/60 text-[13px] font-normal">
                        {activeStory.createAt
                          ? new Date(
                              activeStory.createAt
                            ).toLocaleDateString([], { month: 'short', day: 'numeric' })
                          : "now"}
                      </p>
                    </div>
                  </div>

                  {/* CLOSE */}
                  <button
                    onClick={() =>
                      setShowStories(false)
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:text-white transition-colors duration-200"
                  >
                    <CloseIcon className="text-[26px]" />
                  </button>
                </div>
              </div>

              {/* INVISIBLE MOBILE TOUCH AREAS (Only handles click on mobile/tablets where arrows are hidden) */}
              <button
                onClick={goPrev}
                className="absolute left-0 top-16 bottom-20 w-1/4 z-20 md:hidden outline-none appearance-none"
              />
              <button
                onClick={goNext}
                className="absolute right-0 top-16 bottom-20 w-1/4 z-20 md:hidden outline-none appearance-none"
              />

              {/* FOOTER */}
              <div className="absolute bottom-0 left-0 right-0 z-30 p-[14px] pt-8 flex items-center gap-4 bg-gradient-to-t from-black/90 via-black/30 to-transparent">
                <div className="flex-1 relative flex items-center">
                  <input
                    value={replyText}
                    onChange={(e) =>
                      setReplyText(e.target.value)
                    }
                    placeholder={`Ответьте пользователю ${activeUser.userName}...`}
                    className="w-full bg-transparent border border-white/40 rounded-full pl-4 pr-10 py-[10px] text-white text-[14px] outline-none transition-all duration-200 placeholder:text-white/50 focus:border-white/70"
                  />
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-4">
                  {/* LIKE */}
                  <button
                    className="text-white hover:scale-105 active:scale-90 transition-transform duration-150 outline-none"
                    onClick={async () => {
                      try {
                        await likeStory(
                          activeStory.id
                        ).unwrap();

                        setLikedStories((prev) => ({
                          ...prev,
                          [activeStory.id]:
                            !prev[activeStory.id],
                        }));
                      } catch (err) {
                        console.log(err);
                      }
                    }}
                  >
                    {isLiked ? (
                      <FavoriteIcon className="text-[#ff3040] text-[26px] animate-[heartBeat_0.3s_ease-in-out]" />
                    ) : (
                      <FavoriteBorderIcon className="text-[26px]" />
                    )}
                  </button>

                  {/* SEND */}
                  <button className="text-white hover:scale-105 active:scale-90 transition-transform duration-150 outline-none">
                    <SendIcon className="text-[24px] -rotate-12 -translate-y-[2px]" />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT NAVIGATION BUTTON (Visible on MD screens and up) */}
            <button
              onClick={goNext}
              className="hidden md:flex absolute -right-14 z-40 w-10 h-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-white/80 hover:text-white border border-white/10 backdrop-blur-sm cursor-pointer"
            >
              <ChevronRightIcon className="text-[32px]" />
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default StoriesSection;