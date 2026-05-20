"use client"

import React from "react"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/app/store/store"
import {
  readNotification,
  readAllNotifications,
  clearNotifications,
  addNotification,
  INotification,
} from "@/app/store/notificationSlice"
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  UserPlusIcon,
  BellIcon,
  TrashIcon,
  CheckIcon,
  PlusIcon,
} from "@heroicons/react/24/outline"

export default function NotificationsPage() {
  const dispatch = useDispatch()
  const notifications = useSelector((state: RootState) => state.notifications.items)

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Simulated notifications generator list
  const simulateActivity = () => {
    const mockActivities: Array<{
      type: "like" | "comment" | "follow" | "mention"
      userName: string
      userImage: string
      text: string
    }> = [
      {
        type: "like",
        userName: "tahmina_dev",
        userImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80",
        text: "liked your latest reel",
      },
      {
        type: "comment",
        userName: "firdavs_tj",
        userImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80",
        text: 'replied: "This is super helpful, thanks! 🙌"',
      },
      {
        type: "follow",
        userName: "dilnoza_m",
        userImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80",
        text: "sent you a follow request",
      },
      {
        type: "mention",
        userName: "jamshed_far",
        userImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
        text: "tagged you in a new challenge video",
      },
    ]

    // Choose random activity
    const activity = mockActivities[Math.floor(Math.random() * mockActivities.length)]
    dispatch(addNotification(activity))
  }

  // Format date helper
  const getRelativeTimeString = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  // Get icon based on type
  const getNotificationIcon = (type: INotification["type"]) => {
    switch (type) {
      case "like":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <HeartIcon className="h-4.5 w-4.5 fill-current" />
          </div>
        )
      case "comment":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
            <ChatBubbleOvalLeftIcon className="h-4.5 w-4.5 fill-current" />
          </div>
        )
      case "follow":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <UserPlusIcon className="h-4.5 w-4.5" />
          </div>
        )
      case "mention":
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 font-bold text-xs">
            @
          </div>
        )
    }
  }

  return (
    <div className="h-full w-full bg-black text-white p-6 md:p-10 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        
        {/* Header bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="rounded-full bg-gradient-to-r from-pink-600 to-purple-600 px-3 py-0.5 text-xs font-bold text-white shadow-lg animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your local user interactions and simulated activities
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Simulation button */}
            <button
              onClick={simulateActivity}
              className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition active:scale-95 shadow-md"
            >
              <PlusIcon className="h-4 w-4" />
              Simulate Activity
            </button>

            {/* Read All button */}
            <button
              onClick={() => dispatch(readAllNotifications())}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition disabled:opacity-40 disabled:pointer-events-none active:scale-95"
            >
              <CheckIcon className="h-4 w-4" />
              Mark All Read
            </button>

            {/* Clear button */}
            <button
              onClick={() => dispatch(clearNotifications())}
              disabled={notifications.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-red-950/20 border border-red-500/25 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition disabled:opacity-30 disabled:pointer-events-none active:scale-95"
            >
              <TrashIcon className="h-4 w-4" />
              Clear All
            </button>
          </div>
        </div>

        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-white/5 bg-white/2 backdrop-blur-md">
            <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-gray-400">
              <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-25"></div>
              <BellIcon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Quiet in here...</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              You don&apos;t have any notifications at the moment. Click &quot;Simulate Activity&quot; above to generate some!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.isRead) {
                    dispatch(readNotification(item.id))
                  }
                }}
                className={`relative flex items-center justify-between gap-4 p-4 rounded-2xl border transition duration-200 cursor-pointer ${
                  item.isRead
                    ? "bg-white/2 border-white/5 text-gray-300 hover:bg-white/4 hover:border-white/10"
                    : "bg-white/5 border-pink-500/20 text-white hover:bg-white/8 hover:border-pink-500/30"
                }`}
              >
                {/* Left indicators & user metadata */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Unread Pink Dot */}
                  {!item.isRead && (
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-2 w-2 rounded-full bg-pink-500 shadow-md shadow-pink-500/50"></div>
                  )}

                  {/* Profile Image with Type Icon badge */}
                  <div className="relative flex-shrink-0 ml-1.5">
                    <img
                      src={
                        item.userImage ||
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
                      }
                      alt={item.userName}
                      className="h-11 w-11 rounded-full object-cover border border-white/10 bg-neutral-900"
                    />
                    <div className="absolute -bottom-1 -right-1 z-10 scale-90">
                      {getNotificationIcon(item.type)}
                    </div>
                  </div>

                  {/* Main text content */}
                  <div className="min-w-0 text-sm">
                    <p className="font-bold text-white tracking-wide truncate max-w-[200px] md:max-w-none inline mr-1.5">
                      {item.userName}
                    </p>
                    <span className="font-medium text-gray-300 leading-relaxed">
                      {item.text}
                    </span>
                    <span className="block text-[11px] font-semibold text-gray-500 mt-1">
                      {getRelativeTimeString(item.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Right actions (mark single as read option) */}
                {!item.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      dispatch(readNotification(item.id))
                    }}
                    className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/5 transition text-xs font-bold"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
