"use client"

import React, { useState, useMemo, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/app/store/store"
import {
  initializeNotifications,
  readNotification,
  readAllNotifications,
  clearNotifications,
  addNotification,
  INotification,
} from "@/app/store/notificationSlice"
import {
  BellIcon,
  TrashIcon,
  CheckIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"

export default function NotificationsPage() {
  const dispatch = useDispatch()
  const notifications = useSelector((state: RootState) => state.notifications.items)

  // Initialize notifications from localStorage
  useEffect(() => {
    dispatch(initializeNotifications())
  }, [dispatch])

  // Top pill filter state
  const [activeTab, setActiveTab] = useState<"all" | "following" | "comments">("all")

  // Local optimistic state for followed users
  const [followedUsers, setFollowedUsers] = useState<Record<string, boolean>>({
    "softclub_tj": true, // initially following
  })

  // Unread count
  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Toggle follow/following button
  const handleFollowToggle = (userName: string) => {
    setFollowedUsers((prev) => ({
      ...prev,
      [userName]: !prev[userName],
    }))
  }

  // Simulate diverse activities
  const simulateActivity = () => {
    const mockActivities: Array<{
      type: "like" | "comment" | "follow" | "mention"
      userName: string
      userImage: string
      text: string
    }> = [
      {
        type: "like",
        userName: "alijonakt",
        userImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        text: "liked your story.",
      },
      {
        type: "comment",
        userName: "tvgirlbutnotyours",
        userImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
        text: 'commented: "@somon_z this is incredible, absolute masterpiece! 👏🔥"',
      },
      {
        type: "follow",
        userName: "kamolov__j",
        userImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
        text: "started following you.",
      },
      {
        type: "mention",
        userName: "xo1ikzoda.1",
        userImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
        text: "mentioned you in a caption.",
      },
      {
        type: "like",
        userName: "dilwod.mma",
        userImage: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
        text: "liked your reels video.",
      },
      {
        type: "comment",
        userName: "kn1ghtwillbefine",
        userImage: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=150&q=80",
        text: "commented: \"Let's collaborate soon! 🚀\"",
      },
    ]

    const activity = mockActivities[Math.floor(Math.random() * mockActivities.length)]
    dispatch(addNotification(activity))
  }

  // Get dynamic post preview image based on ID
  const getPostPreview = (id: string) => {
    // Return a stable unsplash image depending on the id's last character
    const images = [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=120&q=80",
      "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=120&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=120&q=80",
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=120&q=80",
    ]
    const index = Math.abs(id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % images.length
    return images[index]
  }

  // Check if a user is verified
  const isVerified = (userName: string) => {
    const verifiedList = ["softclub_tj", "alijonakt", "kamolov__j", "xo1ikzoda.1"]
    return verifiedList.includes(userName)
  }

  // Relative time format in short Instagram style (e.g., "1h", "2d", "33m")
  const getShortRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "1m"
    if (diffMins < 60) return `${diffMins}m`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d`

    const diffWeeks = Math.floor(diffDays / 7)
    return `${diffWeeks}w`
  }

  // Filter notifications based on tab
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === "following") return item.type === "follow"
      if (activeTab === "comments") return item.type === "comment" || item.type === "mention"
      return true // "all"
    })
  }, [notifications, activeTab])

  // Group notifications by date categories
  const groupedNotifications = useMemo(() => {
    const today: INotification[] = []
    const yesterday: INotification[] = []
    const thisWeek: INotification[] = []
    const earlier: INotification[] = []

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000

    filteredNotifications.forEach((item) => {
      const time = new Date(item.createdAt).getTime()
      if (time >= todayStart) {
        today.push(item)
      } else if (time >= yesterdayStart) {
        yesterday.push(item)
      } else if (time >= weekStart) {
        thisWeek.push(item)
      } else {
        earlier.push(item)
      }
    })

    return [
      { title: "Today", items: today },
      { title: "Yesterday", items: yesterday },
      { title: "This week", items: thisWeek },
      { title: "Earlier", items: earlier },
    ].filter((group) => group.items.length > 0)
  }, [filteredNotifications])

  return (
    <div className="h-full w-full bg-white text-black flex justify-center overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
      <div className="w-full max-w-[500px] min-h-screen border-x border-gray-200 flex flex-col bg-white">
        
        {/* Header Section */}
        <div className="px-5 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-red-500 ring-4 ring-red-500/20"></span>
            )}
          </div>
          
          <button 
            onClick={() => window.history.back()}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Developer / Control Panel */}
        <div className="mx-4 mt-4 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-gray-400">Developer Actions</span>
            <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
              {unreadCount} unread
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={simulateActivity}
              className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-[#0095f6] hover:bg-[#1aa3ff] text-white text-[11px] font-bold transition active:scale-95 shadow-md"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Simulate
            </button>
            <button
              onClick={() => dispatch(readAllNotifications())}
              disabled={unreadCount === 0}
              className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-gray-100 border border-gray-200 hover:bg-gray-200 text-black text-[11px] font-bold transition disabled:opacity-40 disabled:pointer-events-none active:scale-95"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Read All
            </button>
            <button
              onClick={() => dispatch(clearNotifications())}
              disabled={notifications.length === 0}
              className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-[11px] font-bold transition disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Top Pill Tab Filters */}
        <div className="flex gap-2 px-5 py-4 border-b border-gray-100 overflow-x-auto scrollbar-none flex-shrink-0">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap ${
              activeTab === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap ${
              activeTab === "following"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200"
            }`}
          >
            People you follow
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap ${
              activeTab === "comments"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200"
            }`}
          >
            Comments
          </button>
        </div>

        {/* Meta Verified static information box (like the reference image) */}
        {activeTab === "all" && notifications.length > 0 && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3.5 hover:bg-gray-100 transition duration-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0095f6]/10 text-[#0095f6] flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5.5 h-5.5">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </div>
            <div className="flex-1 text-sm leading-tight text-gray-700">
              <p className="font-semibold text-black">Meta Verified subscription status</p>
              <p className="text-[12px] text-gray-500 mt-1 leading-snug">
                Your Meta Verified subscription was not completed because we couldn&apos;t verify your identity. <span className="text-[#0095f6] cursor-pointer hover:underline">Complete verification</span> • 23 min.
              </p>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 px-5 py-4 space-y-6">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-gray-600">
                <BellIcon className="h-10 w-10 text-black" />
              </div>
              <h3 className="text-lg font-bold text-black mb-1">No notifications</h3>
              <p className="text-xs text-gray-500 max-w-[280px]">
                Activities on your profile will appear here. Toggle developer controls to simulate updates.
              </p>
            </div>
          ) : (
            groupedNotifications.map((group) => (
              <div key={group.title} className="space-y-4 animate-fade-in">
                {/* Date Group Heading */}
                <h3 className="text-sm font-bold text-black border-b border-gray-100 pb-1">
                  {group.title}
                </h3>

                {/* Notifications in Group */}
                <div className="space-y-4">
                  {group.items.map((item) => {
                    const isFollowType = item.type === "follow"
                    const isUserFollowed = followedUsers[item.userName] || false

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!item.isRead) {
                            dispatch(readNotification(item.id))
                          }
                        }}
                        className={`flex items-center justify-between gap-3 group/item relative py-1 rounded-lg transition duration-150 ${
                          !item.isRead ? "after:content-[''] after:absolute after:-left-2.5 after:top-1/2 after:-translate-y-1/2 after:w-1.5 after:h-1.5 after:bg-[#0095f6] after:rounded-full" : ""
                        }`}
                      >
                        {/* Profile Image with Beautiful Story Gradient Circle Border */}
                        <div className="relative flex-shrink-0">
                          <div className={`p-[1.5px] rounded-full ${
                            !item.isRead 
                              ? "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600" 
                              : "bg-gray-200"
                          }`}>
                            <img
                              src={
                                item.userImage ||
                                `https://ui-avatars.com/api/?name=${item.userName}&background=333&color=fff`
                              }
                              alt={item.userName}
                              className="h-11 w-11 rounded-full object-cover border-2 border-white bg-gray-100"
                            />
                          </div>
                        </div>

                        {/* Content text description */}
                        <div className="flex-1 min-w-0 text-[13px] leading-snug">
                          <span className="font-bold text-black hover:underline cursor-pointer inline-flex items-center gap-1 mr-1">
                            {item.userName}
                            {isVerified(item.userName) && (
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#0095f6] inline flex-shrink-0">
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            )}
                          </span>
                          <span className="text-gray-700 font-normal">
                            {item.text}
                          </span>
                          <span className="text-gray-500 font-semibold ml-1.5 whitespace-nowrap">
                            {getShortRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        {/* Action buttons or Post Preview Thumbnails */}
                        <div className="flex-shrink-0 ml-1">
                          {isFollowType ? (
                            <button
                              onClick={(e) => {
                                  e.stopPropagation()
                                  handleFollowToggle(item.userName)
                              }}
                              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition duration-200 select-none ${
                                isUserFollowed
                                  ? "bg-gray-100 text-black hover:bg-gray-200"
                                  : "bg-[#0095f6] hover:bg-[#1aa3ff] text-white"
                              }`}
                            >
                              {isUserFollowed ? "Following" : "Follow back"}
                            </button>
                          ) : (
                            <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-gray-200 hover:opacity-85 transition cursor-pointer select-none">
                              <img
                                src={getPostPreview(item.id)}
                                alt="post preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
