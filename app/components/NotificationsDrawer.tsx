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
} from "@heroicons/react/24/outline"

interface NotificationsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationsDrawer({ isOpen, onClose }: NotificationsDrawerProps) {
  const dispatch = useDispatch()
  const notifications = useSelector((state: RootState) => state.notifications.items)

  // Initialize notifications from localStorage
  useEffect(() => {
    if (isOpen) {
      dispatch(initializeNotifications())
    }
  }, [dispatch, isOpen])

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

  // Simulate diverse activities in English
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
        text: "mentioned you in a post.",
      },
      {
        type: "like",
        userName: "dilwod.mma",
        userImage: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
        text: "liked your Reels.",
      },
      {
        type: "comment",
        userName: "kn1ghtwillbefine",
        userImage: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=150&q=80",
        text: 'commented: "Let\'s collaborate soon! 🚀"',
      },
    ]

    const activity = mockActivities[Math.floor(Math.random() * mockActivities.length)]
    dispatch(addNotification(activity))
  }

  // Get dynamic post preview image based on ID
  const getPostPreview = (id: string) => {
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

  // Relative time format in English style
  const getShortRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "1 min"
    if (diffMins < 60) return `${diffMins} min`

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

  const getGroupTitle = (title: string) => {
    switch (title) {
      case "Today":
        return "Today"
      case "Yesterday":
        return "Yesterday"
      case "This week":
        return "This week"
      case "Earlier":
        return "Earlier"
      default:
        return title
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Invisible backdrop to capture click outsides */}
      <div 
        className="fixed inset-0 z-40 bg-transparent cursor-default" 
        onClick={onClose} 
      />

      {/* FIXED INSTAGRAM DRAWER */}
      <div className="notifications-drawer fixed left-0 md:left-[80px] md:group-hover:left-[250px] top-0 h-screen w-full md:w-[420px] bg-white border-r border-gray-200 z-50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.06)] animate-slideIn transition-all duration-300 cursor-default">
        
        {/* CSS Animation injection */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideIn {
            from { transform: translateX(-12px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-slideIn {
            animation: slideIn 0.22s ease-out forwards;
          }
        `}} />

        {/* Header Section */}
        <div className="px-6 pt-8 pb-4 flex justify-between items-center sticky top-0 bg-white z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold text-black tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="h-2 w-2 rounded-full bg-[#0095f6]"></span>
            )}
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition duration-200 cursor-pointer"
          >
            {/* X icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Top Pill Tab Filters */}
        <div className="flex gap-2 px-6 pb-4 overflow-x-auto scrollbar-none flex-shrink-0 select-none [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab("all")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === "all"
                ? "bg-gray-100 border-gray-100 text-black"
                : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-black"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === "following"
                ? "bg-gray-100 border-gray-100 text-black"
                : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-black"
            }`}
          >
            People you follow
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === "comments"
                ? "bg-gray-100 border-gray-100 text-black"
                : "border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-black"
            }`}
          >
            Comments
          </button>
        </div>

        {/* Developer / Control Panel */}
        <div className="mx-6 mb-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400">Developer Actions</span>
            <span className="text-[11px] font-bold text-gray-600 bg-gray-200/50 px-2 py-0.5 rounded-md">
              {unreadCount} unread
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={simulateActivity}
              className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-[#0095f6] hover:bg-[#1aa3ff] text-white text-[11px] font-bold transition active:scale-95 shadow-sm cursor-pointer"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Simulate
            </button>
            <button
              onClick={() => dispatch(readAllNotifications())}
              disabled={unreadCount === 0}
              className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 text-black text-[11px] font-bold transition disabled:opacity-40 disabled:pointer-events-none active:scale-95 cursor-pointer"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Read All
            </button>
            <button
              onClick={() => dispatch(clearNotifications())}
              disabled={notifications.length === 0}
              className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 text-[11px] font-bold transition disabled:opacity-30 disabled:pointer-events-none active:scale-95 cursor-pointer"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto h-[calc(100vh-150px)] pb-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          {/* Meta Verified static information box (Russian localized as in screenshot) */}
          {activeTab === "all" && notifications.length > 0 && (
            <div className="mx-6 mb-4 p-3 rounded-xl hover:bg-gray-50 transition duration-200 flex items-center gap-3.5 cursor-pointer">
              <div className="relative flex-shrink-0">
                <div className="h-11 w-11 rounded-full bg-blue-50 flex items-center justify-center text-[#0095f6]">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 text-[13px] leading-snug text-gray-700">
                <span className="text-gray-900 font-normal">
                  Only one step left to get Meta Verified: confirm your identity, otherwise your subscription will... <span className="text-gray-500 font-semibold hover:underline">more 19h</span>
                </span>
              </div>
            </div>
          )}

          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-gray-600">
                <BellIcon className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-base font-bold text-black mb-1">No notifications</h3>
              <p className="text-xs text-gray-500 max-w-[280px]">
                Activities on your profile will appear here. Toggle developer controls to simulate updates.
              </p>
            </div>
          ) : (
            groupedNotifications.map((group) => (
              <div key={group.title} className="flex flex-col">
                {/* Date Group Heading */}
                <h3 className="text-[16px] font-bold text-black px-6 pt-4 pb-1">
                  {getGroupTitle(group.title)}
                </h3>

                {/* Notifications in Group */}
                <div className="flex flex-col">
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
                        className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition cursor-pointer relative"
                      >
                        {/* Unread indicator blue dot */}
                        {!item.isRead && (
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#0095f6]"></span>
                        )}

                        {/* Avatar 44x44 */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={
                              item.userImage ||
                              `https://ui-avatars.com/api/?name=${item.userName}&background=333&color=fff`
                            }
                            alt={item.userName}
                            className="h-11 w-11 rounded-full object-cover border border-gray-100 bg-gray-100"
                          />
                        </div>

                        {/* Content text */}
                        <div className="flex-1 min-w-0 text-[13px] leading-snug text-black">
                          <span className="font-bold text-black hover:underline cursor-pointer inline-flex items-center gap-1 mr-1">
                            {item.userName}
                            {isVerified(item.userName) && (
                              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#0095f6] inline flex-shrink-0">
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                              </svg>
                            )}
                          </span>
                          <span className="text-gray-800 font-normal">
                            {item.text}
                          </span>
                          <span className="text-gray-400 font-normal ml-1.5 whitespace-nowrap">
                            {getShortRelativeTime(item.createdAt)}
                          </span>
                        </div>

                        {/* Actions or Preview Image */}
                        <div className="flex-shrink-0 ml-auto pl-1">
                          {isFollowType ? (
                            <button
                              onClick={(e) => {
                                  e.stopPropagation()
                                  handleFollowToggle(item.userName)
                              }}
                              className={`rounded-lg px-4 py-2 text-xs font-bold transition duration-200 select-none cursor-pointer ${
                                isUserFollowed
                                  ? "bg-gray-100 text-black hover:bg-gray-200"
                                  : "bg-[#0095f6] hover:bg-[#1aa3ff] text-white"
                              }`}
                            >
                              {isUserFollowed ? "Following" : "Follow back"}
                            </button>
                          ) : (
                            <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-gray-200 hover:opacity-85 transition cursor-pointer select-none">
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
    </>
  )
}
