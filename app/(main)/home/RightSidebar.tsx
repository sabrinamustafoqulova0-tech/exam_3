"use client";

import React from "react";
import { Api, GetUserId } from "@/app/utils/token";
import {
  useDeletellowUserMutation,
  useFollowUserMutation,
  useGetSubscriptionsQuery,
  useGetUsersQuery,
} from "@/app/services/publication.home";
import Link from "next/link";

const RightSidebar = () => {
  const userID = GetUserId();
  const { data, isLoading } = useGetUsersQuery();
  const { data: dataP, isLoading: isLoadingP } =
    useGetSubscriptionsQuery(userID);
  const [followUser] = useFollowUserMutation();
  const [unfollowUser] = useDeletellowUserMutation();

  const toggleFollow = async (userId: string) => {
    if (isFollowing(userId)) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
  };

  const users = data?.data ?? [];

  const isFollowing = (userId) => {
    return dataP?.data?.find((e) => e.userShortInfo.userId == userId)
      ? true
      : false;
  };
  if (isLoading) {
    return (
      <div className="w-[250px] fixed right-[80px] top-[20px]">
        <p className="text-gray-400 text-sm">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="w-[250px] mt-[50px] flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {/* HEADER */}
        <div className="flex justify-between">
          <p>Recommendations</p>

          <Link href="/users">
            <p className="text-gray-400 cursor-pointer">All user</p>
          </Link>
        </div>

        {users.slice(0, 8).map((user: any) => {
          return (
            <div key={user.id} className="flex items-center justify-between">
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
                  <span className="text-sm font-semibold">{user.userName}</span>
                  <span className="text-xs text-gray-400">
                    {user.fullName || "User"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleFollow(user.id)}
                className={`text-xs font-semibold cursor-pointer hover:opacity-70 ${
                  isFollowing(user.id) ? "text-black" : "text-[#0095f6]"
                }`}
              >
                {isFollowing(user.id) ? "Followed" : "Follow"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RightSidebar;
