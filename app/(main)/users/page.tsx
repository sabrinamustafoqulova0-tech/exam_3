"use client";

import React, { useState } from "react";
import { Api, GetUserId } from "@/app/utils/token";
import {
  useGetUsersQuery,
  useGetMyProfileQuery,
  useGetSubscriptionsQuery,
  useFollowUserMutation,
  useDeletellowUserMutation,
} from "@/app/services/publication.home";

const RightSidebar = () => {
  const userID:any = GetUserId();
  const [search, setSearch] = useState("");
  const { data: usersData, isLoading } = useGetUsersQuery(undefined);
  const { data: myProfile } = useGetMyProfileQuery(undefined);
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
  const users = (usersData?.data ?? [])
  .filter((u: any) => u.id !== myId)
  .filter((u: any) =>
    u.userName
      ?.toLowerCase()
      .includes(search.toLowerCase())
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
    const isFollowing = (userId:any) => {
    return dataP?.data?.find((e:any) => e.userShortInfo.userId == userId)
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
      className="w-[600px] mt-[50px] flex flex-col gap-5 fixed top-0 left-[33%] z-10 bg-white overflow-y-auto h-screen
      [&::-webkit-scrollbar]:hidden"
    >
      <p className="font-semibold text-gray-700">Recommendations</p>
      <div className="relative">
  <input
    type="text"
    placeholder="Search users..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="
      w-full
      bg-[#f2f2f2]
      rounded-xl
      px-4
      py-3
      text-sm
      outline-none
      border border-transparent
      focus:border-gray-300
      focus:bg-white
      transition-all
      placeholder:text-gray-400
    "
  />

  {search && (
    <button
      onClick={() => setSearch("")}
      className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
        text-gray-400
        hover:text-black
        text-sm
      "
    >
      ✕
    </button>
  )}
</div>
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
                className="w-[40px] h-[40px] rounded-full object-cover"
              />

              <div className="flex flex-col">
                <span className="text-[17px] font-bold">
                  {user.userName}
                </span>
                <span className="text-[15px] text-gray-400">
                  {user.fullName || "User"}
                </span>
              </div>
            </div>

            {/* BUTTON */}
            
              <button
                onClick={() => toggleFollow(user.id)}
                className={`text-xs font-semibold cursor-pointer hover:opacity-70 ${
                  isFollowing(user.id) ? "text-black bg-[#00000020] py-[7px]  rounded-[10px] px-[25px] py-[7px] text-[13.5px]" : " text-[13.5px] bg-[#381dffd8] px-[25px] py-[7px] text-white rounded-[10px]"
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