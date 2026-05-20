import React from 'react';
import StoriesSection from './StoriesSection';
import "../../globals.css"

const Home = () => {
  return (
    <>
      <div className='flex'>
        {/*
          Навбар занимает ~80px (свёрнут) или ~250px (раскрыт).
          Мы ставим fixed блок с left-[240px] — он всегда будет
          примерно в центре страницы, как в настоящем Instagram.
        */}
        <div className='fixed top-0 left-[240px] w-[800px] z-10 bg-white overflow-y-auto h-screen
                        [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
          <StoriesSection />
        </div>
        <div>
        </div>
      </div>
    </>
  );
};

export default Home;
