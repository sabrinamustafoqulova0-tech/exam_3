import React from "react";
import StoriesSection from "./StoriesSection";
import "../../globals.css";
import PostsSection from "./PostsSection";
import RightSidebar from "./RightSidebar";

const Home = () => {
  return (
    <div className="">
      <div
        className="fixed top-0 left-[240px]   z-10 bg-white overflow-y-auto h-screen
                        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <div className="flex gap-[100px] items-start justify-start">
          <div className="w-[650px]">
            <StoriesSection />
            <PostsSection />
          </div>
          <div>
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
