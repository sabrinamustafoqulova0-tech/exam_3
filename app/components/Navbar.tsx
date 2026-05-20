'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [isOpenSearch, setIsOpenSearch] = useState(false)

  const toggleSearch = () => {
    setIsOpenSearch(!isOpenSearch)
  }

  return (
    <div className="flex fixed left-0 top-0 z-50 h-screen">

      <nav 
        className={`flex flex-col justify-between h-full bg-white border-r border-gray-200 px-3 pt-10 pb-6 font-sans text-[16px] text-[#262626] transition-all duration-300 ease-in-out ${
          isOpenSearch ? 'w-[72px]' : 'w-[244px]'
        }`}
      >
        <div className="flex flex-col gap-2">
          <div className="mt-[-40px] h-[60px] flex items-center justify-center overflow-hidden transition-all duration-300">
            {isOpenSearch ? (
              <svg className="w-6 h-6 fill-current min-w-[24px]" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            ) : (
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbnnLuoUQUkbjl12fbJ63azdzI0EcGRlJG-g&s" 
                alt="Instagram" 
                className="w-[110px] min-w-[110px] object-contain"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Link href="/" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-6 h-6 stroke-[2] stroke-current min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Home</span>}
            </Link>

            <button 
              onClick={toggleSearch} 
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group w-full text-left ${
                isOpenSearch ? 'border border-gray-300 bg-gray-50' : ''
              }`}
            >
              <svg className="w-6 h-6 stroke-[2] stroke-current min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              {!isOpenSearch && <span className="font-semibold">Search</span>}
            </button>

            <Link href="/explore" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-6 h-6 stroke-[2] stroke-current min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 120z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75l-4.5 2.25 2.25 4.5 4.5-2.25-2.25-4.5z" />
              </svg>
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Explore</span>}
            </Link>

            <Link href="/reels" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-6 h-6 stroke-[2] stroke-current min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.25l5.25 3.75-5.25 3.75V8.25z" />
              </svg>
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Reels</span>}
            </Link>

            <Link href="/messages" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-6 h-6 stroke-[2] stroke-current min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.765 5.99 5.99 0 011.523-3.078C4.304 15.792 3 14.046 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Messages</span>}
            </Link>

            <Link href="/notifications" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-6 h-6 stroke-[2] stroke-current min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Notification</span>}
            </Link>

            <Link href="/create" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <svg className="w-6 h-6 stroke-[2] stroke-current min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Create</span>}
            </Link>

            <Link href="/profile" className="flex items-center gap-4 p-3 rounded-xl transition-colors hover:bg-gray-50">
              <div className="w-6 h-6 min-w-[24px] rounded-full overflow-hidden border border-blue-200">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Profile</span>}
            </Link>
          </div>
        </div>

        <div>
          <Link href="/more" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <svg className="w-6 h-6 stroke-[2] stroke-current min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            {!isOpenSearch && <span className="font-normal whitespace-nowrap">More</span>}
          </Link>
        </div>
      </nav>

      
      <div 
        className={`w-[397px] h-full bg-white border-r border-gray-200 shadow-xl transition-all duration-300 ease-in-out px-6 pt-6 transform ${
          isOpenSearch ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none absolute'
        }`}
      >
        <h2 className="text-[24px] font-bold mb-6">Search</h2>
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-[#efefef] rounded-lg px-4 py-2 text-[14px] outline-none placeholder-gray-500 focus:bg-white border focus:border-gray-300"
          />
        </div>
        <hr className="border-gray-200 -mx-6 mb-4" />
        <div className="text-[14px] font-semibold text-[#262626]">Recent</div>
        <div className="text-[14px] text-gray-400 mt-12 text-center">No recent searches.</div>
      </div>
    </div>
  )
}