import { createSlice, PayloadAction } from "@reduxjs/toolkit"

export interface INotification {
  id: string
  type: "like" | "comment" | "follow" | "mention"
  userName: string
  userImage: string | null
  text: string
  isRead: boolean
  createdAt: string
}

interface NotificationState {
  items: INotification[]
}

const initialMockNotifications: INotification[] = [
  {
    id: "1",
    type: "like",
    userName: "daler_kh",
    userImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80",
    text: "liked your video",
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "2",
    type: "comment",
    userName: "madina_r",
    userImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80",
    text: 'commented: "This reel is absolute fire! 🔥🚀"',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "3",
    type: "follow",
    userName: "softclub_tj",
    userImage: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80",
    text: "started following you",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "4",
    type: "mention",
    userName: "somon_z",
    userImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
    text: "mentioned you in a comment",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  }
]

const initialState: NotificationState = {
  items: initialMockNotifications,
}

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<Omit<INotification, "id" | "isRead" | "createdAt">>
    ) => {
      const newNotification: INotification = {
        ...action.payload,
        id: Math.random().toString(36).substring(2, 9),
        isRead: false,
        createdAt: new Date().toISOString(),
      }
      state.items.unshift(newNotification)
    },
    readNotification: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((item) => item.id === action.payload)
      if (notification) {
        notification.isRead = true
      }
    },
    readAllNotifications: (state) => {
      state.items.forEach((item) => {
        item.isRead = true
      })
    },
    clearNotifications: (state) => {
      state.items = []
    },
  },
})

export const {
  addNotification,
  readNotification,
  readAllNotifications,
  clearNotifications,
} = notificationSlice.actions

export default notificationSlice.reducer
