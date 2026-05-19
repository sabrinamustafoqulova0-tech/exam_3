'use client'
import Link from 'next/link'
export default function Navbar() {
  return (
    <nav className="flex flex-col justify-between w-[244px] h-screen bg-white border-r border-gray-200 px-3 pt-10 pb-6 font-sans text-[16px] text-[#262626]">
      
      <div className="flex flex-col gap-2">
        
        <div className="mt-[-40px] w-[184px]">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbnnLuoUQUkbjl12fbJ63azdzI0EcGRlJG-g&s" alt="" />
          
        </div>

        <div className="flex flex-col gap-1">
          
          <Link href="/" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <svg className="w-6 h-6 stroke-[2] stroke-current text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="font-normal">Home</span>
          </Link>

          <Link href="/search" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <svg className="w-6 h-6 stroke-[2] stroke-current text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <span className="font-normal">Search</span>
          </Link>

          <Link href="/explore" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <svg className="w-6 h-6 stroke-[2] stroke-current text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 120z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75l-4.5 2.25 2.25 4.5 4.5-2.25-2.25-4.5z" />
            </svg>
            <span className="font-normal">Explore</span>
          </Link>

          <Link href="/reels" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <svg className="w-6 h-6 stroke-[2] stroke-current text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.25l5.25 3.75-5.25 3.75V8.25z" />
            </svg>
            <span className="font-normal">Reels</span>
          </Link>

          <Link href="/messages" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <svg className="w-6 h-6 stroke-[2] stroke-current text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.765 5.99 5.99 0 011.523-3.078C4.304 15.792 3 14.046 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <span className="font-normal">Messages</span>
          </Link>

          <Link href="/notifications" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <svg className="w-6 h-6 stroke-[2] stroke-current text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <span className="font-normal">Notification</span>
          </Link>

          <Link href="/create" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <svg className="w-6 h-6 stroke-[2] stroke-current text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-normal">Create</span>
          </Link>

          <Link 
            href="/profile" 
            className="relative flex items-center justify-between p-3 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full overflow-hidden border border-blue-200">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span>Profile</span>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-xl" />
          </Link>

        </div>
      </div>

      <div>
        <Link href="/more" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
          <svg className="w-6 h-6 stroke-[2] stroke-current text-[#262626] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <span className="font-normal">More</span>
        </Link>
      </div>

    </nav>
  )
}