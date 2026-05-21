"use client";

import React from "react";
import { Api, GetUserId } from "@/app/utils/token";
import {
  useGetUsersQuery,
  useGetMyProfileQuery,
  useGetSubscriptionsQuery,
  useFollowUserMutation,
  useDeletellowUserMutation,
} from "@/app/services/publication.home";

const RightSidebar = () => {
  const userID = GetUserId();

  const { data: usersData, isLoading } = useGetUsersQuery();
  const { data: myProfile } = useGetMyProfileQuery();
  const { data: subscriptionsData } = useGetSubscriptionsQuery(userID);

  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useDeletellowUserMutation();
  
    const { data: dataP, isLoading: isLoadingP } =
      useGetSubscriptionsQuery(userID);

  // 👇 current user id
  const myId =
    myProfile?.data?.id ||
    myProfile?.data?.userId ||
    myProfile?.id ||
    myProfile?.userId ||
    userID;

  // 👇 users list
  const users = (usersData?.data ?? []).filter(
    (u: any) => u.id !== myId
  );

  // 👇 subscriptions list
  const subscriptions = subscriptionsData?.data ?? [];

  // 👇 check follow
  const isSubscribed = (userId: string) => {
    if (!Array.isArray(subscriptions)) return false;

    const targetId = String(userId).toLowerCase().trim();

    return subscriptions.some((sub: any) => {
      if (!sub) return false;

      const subId = String(sub.id ?? "").toLowerCase().trim();
      const subUserId = String(sub.userId ?? "").toLowerCase().trim();
      const subFollowingUserId = String(sub.followingUserId ?? "").toLowerCase().trim();

      return (
        subId === targetId ||
        subUserId === targetId ||
        subFollowingUserId === targetId
      );
    });
  };

  // 👇 follow/unfollow toggle
  const handleFollowToggle = async (userId: string) => {
    try {
      if (isSubscribed(userId)) {
        await unfollowUser(userId).unwrap();
      } else {
        await followUser(userId).unwrap();
      }
    } catch (error) {
      console.error("Follow toggle error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-[450px] mt-[50px]">
        <p className="text-gray-400 text-sm">Loading users...</p>
      </div>
    );
  }
    const isFollowing = (userId) => {
    return dataP?.data?.find((e) => e.userShortInfo.userId == userId)
      ? true
      : false;
  };
  const toggleFollow = async (userId: string) => {
    if (isFollowing(userId)) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };
  return (
    <div
      className="w-[450px] mt-[50px] flex flex-col gap-5 fixed top-0 left-[36%] z-10 bg-white overflow-y-auto h-screen
      [&::-webkit-scrollbar]:hidden"
    >
      <p className="font-semibold text-gray-700">Recommendations</p>
    
      {users?.map((user: any) => {

        return (
          <div
            key={user.id}
            className="flex items-center justify-between"
          >
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <img
                src={
                  user.avatar
                    ? `${Api}/images/${user.avatar}`
                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                className="w-10 h-10 rounded-full object-cover"
              />

              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {user.userName}
                </span>
                <span className="text-xs text-gray-400">
                  {user.fullName || "User"}
                </span>
              </div>
            </div>

            {/* BUTTON */}
            
              <button
                onClick={() => toggleFollow(user.id)}
                className={`text-xs font-semibold cursor-pointer hover:opacity-70 ${
                  isFollowing(user.id) ? "text-black py-[7px] border-1 border-black rounded-[10px] px-[20px] py-[7px]" : "bg-[#0095f6] px-[20px] py-[7px] text-white rounded-[10px]"
                }`}
              >
                {isFollowing(user.id) ? "Followed" : "Follow"}
              </button>
          </div>
        );
      })}
    </div>
  );
};

export default RightSidebar;