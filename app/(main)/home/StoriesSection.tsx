"use client";

import React, { useEffect, useState } from "react";
import Stories from "react-insta-stories";
import { Api } from "../../utils/token";
import { getStories } from "./home.store";

const StoriesSection = () => {
  const [showStories, setShowStories] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [formattedStories, setFormattedStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStories().then((data: any[]) => {
      if (data && data.length > 0) {
        const mapped = data.map((story) => ({
          url: story.fileName
            ? `${Api}/images/${story.fileName}`
            : "https://picsum.photos/seed/" + story.id + "/400/700",
          header: {
            heading:
              story.viewerDto?.userName || story.userId?.slice(0, 8) || "User",
            subheading: story.createAt
              ? new Date(story.createAt).toLocaleDateString()
              : "Just now",
            profileImage: story.userAvatar
              ? `${Api}/images/${story.userAvatar}`
              : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          },
        }));
        setFormattedStories(mapped);
      }
      setLoading(false);
    });
  }, []);

  /* ─── Skeleton loader ─── */
  if (loading) {
    return (
      <div className="flex gap-4 px-4 pt-5 pb-4 border-b border-gray-200 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 min-w-[66px] animate-pulse"
          >
            <div className="w-[66px] h-[66px] rounded-full bg-gradient-to-tr from-gray-200 to-gray-300" />
            <div className="h-2 w-12 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (formattedStories.length === 0) return null;

  return (
    <>
      {/* ─── Stories thumbnail row ─── */}
      <div
        className="flex gap-5  px-4 pt-5 pb-4 border-b border-gray-200 overflow-x-auto
                      [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {formattedStories.map((story, idx) => (
          <button
            key={idx}
            className="flex flex-col items-center gap-1.5 min-w-[62px] group cursor-pointer border-none bg-transparent p-0"
            onClick={() => {
              setActiveIndex(idx);
              setShowStories(true);
            }}
          >
            {/* Gradient ring — точные цвета Instagram */}
            <div
              className="w-[66px] h-[66px] rounded-full p-[2.5px]
                            bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]
                            group-hover:scale-105 transition-transform duration-200"
            >
              <div className="w-full h-full rounded-full border-[2.5px] border-white overflow-hidden bg-gray-100">
                <img
                  src={story.header.profileImage}
                  className="w-full h-full object-cover"
                  alt={story.header.heading}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                  }}
                />
              </div>
            </div>
            {/* Username */}
            <span className="text-[11px] font-medium text-gray-700 truncate w-[62px] text-center leading-tight">
              {story.header.heading}
            </span>
          </button>
        ))}
      </div>

      {/* ─── Full-screen story viewer ─── */}
      {showStories && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStories(false);
          }}
        >
          <button
            className="absolute top-5 right-5 text-white z-50 w-9 h-9 flex items-center
                       justify-center rounded-full bg-white/10 hover:bg-white/20
                       transition-colors text-xl font-bold"
            onClick={() => setShowStories(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

export default StoriesSection;
