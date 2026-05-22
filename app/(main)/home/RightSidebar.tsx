"use client";

import React from "react";
import { Api, GetUserId } from "@/app/utils/token";
import {
  useDeletellowUserMutation,
  useFollowUserMutation,
  useGetSubscriptionsQuery,
  useGetUsersQuery,
  useGetMyProfileQuery,
} from "@/app/services/publication.home";
import Link from "next/link";

const RightSidebar = () => {
  const userID:any = GetUserId();
  const { data, isLoading } = useGetUsersQuery(undefined);
const { data: myProfile } = useGetMyProfileQuery(undefined);
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

  const isFollowing = (userId:any) => {
    return dataP?.data?.find((e:any) => e.userShortInfo.userId == userId)
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
    <div className="w-[340px] mt-[50px] flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {/* HEADER */}<div className="flex items-center justify-between mb-2">

  <div className="flex items-center gap-3">

    <img
      src={
        myProfile?.data?.image
          ? `${Api}/images/${myProfile.data.image}`
          : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
      }
      className="w-[56px] h-[56px] rounded-full object-cover"
      alt=""
    />

    <div className="flex flex-col">

      <span className="text-[14px] font-semibold leading-[16px]">
        {myProfile?.data?.userName || "username"}
      </span>

      <span className="text-[14px] text-gray-400 leading-[16px]">
        {myProfile?.data?.fullName || "User"}
      </span>

    </div>

  </div>

  <button
    className="
      text-[#0095f6]
      text-[12px]
      font-semibold
      hover:text-[#00376b]
      transition
    "
  >
    Switch
  </button>

</div>
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
                    user.avatar?.trim()
                      ? `${Api}/images/${user.avatar.trim()}`
                      : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  }
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; }}
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
                className={`text-xs font-semibold px-[10px] rounded-[10px] py-[5px] cursor-pointer hover:opacity-70 ${
                  isFollowing(user.id) ? "text-[#000000c2] border-2 border-[#000000c2]" : "text-[#381dffd8]"
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
