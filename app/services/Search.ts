// services/Search.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Api } from "../utils/token";

export const searchApi = createApi({
  reducerPath: "searchApi",
  baseQuery: fetchBaseQuery({
    baseUrl: Api,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("store_token"); 
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // --- USER SEARCH ---
    getUsers: builder.query({
      query: (searchName: string) => ({
        url: "/User/get-users",
        method: "GET",
        params: {
          UserName: searchName,
          PageNumber: 1,
          PageSize: 20
        }
      }),
      // Корректная обработка ответа: судя по логам, эндпоинт отдает сразу массив [ {...}, {...} ]
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response;
        if (response && Array.isArray(response.data)) return response.data;
        return [];
      },
    }),

    addSearchHistory: builder.mutation({
      query: (data) => ({
        url: "/User/add-search-history",
        method: "POST",
        body: data,
      }),
    }),
    getSearchHistories: builder.query({
      query: () => "/User/get-search-histories",
    }),
    deleteSearchHistory: builder.mutation({
      query: () => ({
        url: "/User/delete-search-history",
        method: "DELETE",
      }),
    }),
    deleteSearchHistories: builder.mutation({
      query: () => ({
        url: "/User/delete-search-histories",
        method: "DELETE",
      }),
    }),
    addUserSearchHistory: builder.mutation({
      query: (data) => ({
        url: "/User/add-user-search-history",
        method: "POST",
        body: data,
      }),
    }),
    getUserSearchHistories: builder.query({
      query: () => "/User/get-user-search-histories",
    }),
    deleteUserSearchHistory: builder.mutation({
      query: () => ({
        url: "/User/delete-user-search-history",
        method: "DELETE",
      }),
    }),
    deleteUserSearchHistories: builder.mutation({
      query: () => ({
        url: "/User/delete-user-search-histories",
        method: "DELETE",
      }),
    }),
    deleteUser: builder.mutation({
      query: () => ({
        url: "/User/delete-user",
        method: "DELETE",
      }),
    }),

    // --- LOCATION ---
    getLocations: builder.query({
      query: () => "/Location/get-Locations",
    }),
    getLocationById: builder.query({
      query: (id) => `/Location/get-Location-by-id?id=${id}`,
    }),
    addLocation: builder.mutation({
      query: (location) => ({
        url: "/Location/add-Location",
        method: "POST",
        body: location,
      }),
    }),
    updateLocation: builder.mutation({
      query: (location) => ({
        url: "/Location/update-Location",
        method: "PUT",
        body: location,
      }),
    }),
    deleteLocation: builder.mutation({
      query: () => ({
        url: "/Location/delete-Location",
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useAddSearchHistoryMutation,
  useGetSearchHistoriesQuery,
  useDeleteSearchHistoryMutation,
  useDeleteSearchHistoriesMutation,
  useAddUserSearchHistoryMutation,
  useGetUserSearchHistoriesQuery,
  useDeleteUserSearchHistoryMutation,
  useDeleteUserSearchHistoriesMutation,
  useDeleteUserMutation,
  useGetLocationsQuery,
  useGetLocationByIdQuery,
  useAddLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} = searchApi;