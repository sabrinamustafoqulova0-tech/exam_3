import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Api, GetToken } from "../utils/token";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatUser {
  userId: string;
  userName: string;
  userImage: string | null;
  fullName: string | null;
}

export interface ChatMessage {
  userId: string;
  userName: string;
  userImage: string | null;
  messageId: number;
  chatId: number;
  messageText: string | null;
  sendMassageDate: string;
  file: string | null;
}

export interface Chat {
  chatId: number;
  sendUserId: string;
  sendUserName: string;
  sendUserImage: string | null;
  receiveUserId: string;
  receiveUserName: string;
  receiveUserImage: string | null;
}

export interface SendMessageParams {
  ChatId: number;
  MessageText: string;
  File?: File | null;
}

export interface User {
  id: string;
  userName: string;
  fullName: string | null;
  avatar: string | null;
  subscribersCount: number;
}

export interface GetUsersParams {
  UserName?: string;
  PageNumber?: number;
  PageSize?: number;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const chatApi = createApi({
  reducerPath: "chatApi",

  baseQuery: fetchBaseQuery({
    baseUrl: Api,
    prepareHeaders: (headers) => {
      const token = GetToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),

  tagTypes: ["Chats", "ChatById"],

  endpoints: (builder) => ({
    // GET /User/get-users
    getUsers: builder.query<User[], GetUsersParams | void>({
      query: (params) => {
        const UserName = params?.UserName || "";
        const PageNumber = params?.PageNumber || 1;
        const PageSize = params?.PageSize || 20;
        return `/User/get-users?UserName=${encodeURIComponent(UserName)}&PageNumber=${PageNumber}&PageSize=${PageSize}`;
      },
      transformResponse: (response: { data: User[] }) => response.data || [],
    }),

    // GET /Chat/get-chats
    getChats: builder.query<Chat[], void>({
      query: () => "/Chat/get-chats",
      transformResponse: (response: { data: Chat[] }) => response.data || [],
      providesTags: ["Chats"],
    }),

    // GET /Chat/get-chat-by-id?chatId={id}
    getChatById: builder.query<ChatMessage[], number>({
      query: (chatId) => `/Chat/get-chat-by-id?chatId=${chatId}`,
      transformResponse: (response: { data: ChatMessage[] }) => response.data || [],
      providesTags: (_result, _error, chatId) => [
        { type: "ChatById", id: chatId },
      ],
    }),

    // POST /Chat/create-chat?receiverUserId={id}
    createChat: builder.mutation<number, string>({
      query: (receiverUserId) => ({
        url: `/Chat/create-chat?receiverUserId=${receiverUserId}`,
        method: "POST",
      }),
      transformResponse: (response: { data: number }) => response.data,
      invalidatesTags: ["Chats"],
    }),

    // PUT /Chat/send-message  (multipart/form-data)
    sendMessage: builder.mutation<void, SendMessageParams>({
      query: ({ ChatId, MessageText, File }) => {
        const formData = new FormData();
        formData.append("ChatId", ChatId.toString());
        formData.append("MessageText", MessageText);
        if (File) {
          formData.append("File", File);
        }
        return {
          url: "/Chat/send-message",
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: (_result, _error, { ChatId }) => [
        "Chats",
        { type: "ChatById", id: ChatId },
      ],
    }),

    // DELETE /Chat/delete-message?massageId={id}
    deleteMessage: builder.mutation<void, { messageId: number; chatId: number; deleteForEveryone?: boolean }>({
      query: ({ messageId, deleteForEveryone = true }) => ({
        url: `/Chat/delete-message?massageId=${messageId}&deleteForEveryone=${deleteForEveryone}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { chatId }) => [
        "Chats",
        { type: "ChatById", id: chatId },
      ],
    }),

    // DELETE /Chat/delete-chat?chatId={id}
    deleteChat: builder.mutation<void, number>({
      query: (chatId) => ({
        url: `/Chat/delete-chat?chatId=${chatId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chats"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetChatsQuery,
  useGetChatByIdQuery,
  useCreateChatMutation,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useDeleteChatMutation,
} = chatApi;
