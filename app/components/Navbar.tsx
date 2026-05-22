'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useGetUsersQuery } from '../services/Search'
import { useGetMyProfileQuery } from '../services/Profile'

// Иконки из lucide-react
import { 
  Home, 
  Search, 
  Compass, 
  Clapperboard, 
  MessageSquare, 
  Heart, 
  PlusSquare, 
  Menu 
} from 'lucide-react'

const IMAGE_BASE_URL = "https://instagram-api.softclub.tj/images";

interface HistoryUser {
  id: string
  userName?: string
  fullName?: string
  image?: string
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  
  const [isOpenSearch, setIsOpenSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchHistory, setSearchHistory] = useState<HistoryUser[]>([])

  // Загружаем историю поиска из localStorage при монтировании
  useEffect(() => {
    const savedHistory = localStorage.getItem('instagram_recent_searches')
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Ошибка чтения истории поиска:', e)
      }
    }
  }, [])

  // Эффект Debounce для оптимизации запросов к поиску
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 400)

    return () => clearTimeout(handler)
  }, [searchQuery])

  // Запросы к API
  const { data: users, isLoading, isFetching } = useGetUsersQuery(debouncedQuery, {
    skip: !isOpenSearch || debouncedQuery.trim() === '',
  })

  const { data: myProfile } = useGetMyProfileQuery(undefined)
  
  const myUser = myProfile?.data || myProfile
  const myRawAvatar = myUser?.avatar || myUser?.image || myUser?.imagePath
  const myProfileAvatar = myRawAvatar
    ? (myRawAvatar.startsWith('http') ? myRawAvatar : `${IMAGE_BASE_URL}/${myRawAvatar}`)
    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'

  const toggleSearch = () => {
    setIsOpenSearch(!isOpenSearch)
    if (isOpenSearch) {
      setSearchQuery('')
      setDebouncedQuery('')
    }
  }

  const usersList = Array.isArray(users) ? users : []

  const filteredUsers = usersList.filter((user: any) =>
    user?.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Клик по пользователю: сохраняем в историю и переходим
  const handleUserClick = (user: HistoryUser) => {
    setIsOpenSearch(false)
    setSearchQuery('')
    setDebouncedQuery('')

    setSearchHistory((prevHistory) => {
      const filtered = prevHistory.filter((item) => item.id !== user.id)
      const updated = [user, ...filtered].slice(0, 10) // Храним топ-10 последних
      localStorage.setItem('instagram_recent_searches', JSON.stringify(updated))
      return updated
    })

    router.push(`/user/${user.id}`)
  }

  // Очистить всю историю поиска
  const clearAllHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('instagram_recent_searches')
  }

  // Удалить конкретного пользователя из истории
  const removeHistoryItem = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation() // Останавливаем клик, чтобы не перейти на профиль
    setSearchHistory((prevHistory) => {
      const updated = prevHistory.filter((item) => item.id !== userId)
      localStorage.setItem('instagram_recent_searches', JSON.stringify(updated))
      return updated
    })
  }

  // Хелпер для разбора аватарки и скрытия "женщины"
const getAvatarData = (user: any) => {
    // Берём именно то поле, которое присылает сервер (avatar, image или imagePath)
    const rawImage = (user?.avatar || user?.image || user?.imagePath || '').trim();
    
    // Строим полный путь к картинке
    const avatarUrl = rawImage 
      ? (rawImage.startsWith('http') ? rawImage : `${IMAGE_BASE_URL}/${rawImage}`)
      : '';
    
    // Проверяем, пустая ли ссылка или содержит ли она дефолтную женщину с Unsplash
    const isDefaultWoman = avatarUrl.includes('photo-1534528741775-53994a69daeb') || !rawImage;
    
    return {
      hasAvatar: !isDefaultWoman,
      avatarUrl: avatarUrl,
      firstLetter: (user.userName || user.fullName || 'U').charAt(0)
    }
  }
  return (
    <div className="flex fixed left-0 top-0 z-50 h-screen select-none">
      
      {/* ОСНОВНОЙ НАВБАР (ЛЕВАЯ СЛУЖЕБНАЯ ПАНЕЛЬ) */}
      <nav 
        className={`flex flex-col justify-between h-full bg-white border-r border-gray-200 px-3 pt-10 pb-6 font-sans text-[16px] text-[#262626] transition-all duration-300 ease-in-out z-20 ${
          isOpenSearch ? 'w-[73px]' : 'w-[244px]'
        }`}
      >
        <div className="flex flex-col gap-2">
          {/* Логотип Instagram */}
          <div className="mb-7 px-3 h-[40px] flex items-center justify-start overflow-hidden">
            {isOpenSearch ? (
              <Link href="/">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  className="w-7 h-7 min-w-[28px]"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#feda75" />
                      <stop offset="25%" stopColor="#fa7e1e" />
                      <stop offset="50%" stopColor="#d62976" />
                      <stop offset="75%" stopColor="#962fbf" />
                      <stop offset="100%" stopColor="#4f5bd5" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    stroke="url(#instagram-gradient)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    stroke="url(#instagram-gradient)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="17"
                    cy="7"
                    r="1.2"
                    fill="url(#instagram-gradient)"
                  />
                </svg>
              </Link>
            ) : (
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Instagram_logo.svg/1200px-Instagram_logo.svg.png"
                  alt="Instagram"
                  className="w-[120px] object-contain"
                />
              </Link>
            )}
          </div>

          {/* Пункты Навигации */}
          <div className="flex flex-col gap-1">
            {/* HOME */}
            <Link href="/home" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <Home 
                className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" 
                fill={pathname === "/home" ? "#262626" : "none"}
                strokeWidth={pathname === "/home" ? 2.5 : 2}
              />
              {!isOpenSearch && <span className={`${pathname === "/home" ? "font-bold" : "font-normal"} whitespace-nowrap`}>Home</span>}
            </Link>

            {/* SEARCH */}
            <button 
              onClick={toggleSearch} 
              className={`flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group w-full text-left ${
                isOpenSearch ? 'border border-gray-200 bg-gray-50' : ''
              }`}
            >
              <Search className={`w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform ${isOpenSearch || pathname === "/search" ? 'stroke-[2.5]' : ''}`} />
              {!isOpenSearch && <span className={`${pathname === "/search" ? "font-bold" : "font-normal"} whitespace-nowrap`}>Search</span>}
            </button>

            {/* EXPLORE */}
            <Link href="/explore" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <Compass 
                className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" 
                fill={pathname === "/explore" ? "#262626" : "none"}
                strokeWidth={pathname === "/explore" ? 2.5 : 2}
              />
              {!isOpenSearch && <span className={`${pathname === "/explore" ? "font-bold" : "font-normal"} whitespace-nowrap`}>Explore</span>}
            </Link>

            {/* REELS */}
            <Link href="/reels" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <Clapperboard 
                className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" 
                fill={pathname === "/reels" ? "#262626" : "none"}
                strokeWidth={pathname === "/reels" ? 2.5 : 2}
              />
              {!isOpenSearch && <span className={`${pathname === "/reels" ? "font-bold" : "font-normal"} whitespace-nowrap`}>Reels</span>}
            </Link>

            {/* MESSAGES */}
            <Link href="/messages" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <MessageSquare 
                className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" 
                fill={pathname === "/messages" ? "#262626" : "none"}
                strokeWidth={pathname === "/messages" ? 2.5 : 2}
              />
              {!isOpenSearch && <span className={`${pathname === "/messages" ? "font-bold" : "font-normal"} whitespace-nowrap`}>Messages</span>}
            </Link>

            {/* NOTIFICATIONS */}
            <Link href="/notifications" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <Heart 
                className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" 
                fill={pathname === "/notifications" ? "#262626" : "none"}
                strokeWidth={pathname === "/notifications" ? 2.5 : 2}
              />
              {!isOpenSearch && <span className={`${pathname === "/notifications" ? "font-bold" : "font-normal"} whitespace-nowrap`}>Notifications</span>}
            </Link>

            {/* CREATE */}
            <Link href="/create" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <PlusSquare 
                className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" 
                fill={pathname === "/create" ? "#262626" : "none"}
                strokeWidth={pathname === "/create" ? 2.5 : 2}
              />
              {!isOpenSearch && <span className={`${pathname === "/create" ? "font-bold" : "font-normal"} whitespace-nowrap`}>Create</span>}
            </Link>

            {/* PROFILE */}
            <Link href="/profile" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <div className={`w-6 h-6 min-w-[24px] rounded-full overflow-hidden border group-hover:scale-105 transition-transform ${pathname === "/profile" ? "border-black border-2" : "border-gray-300"}`}>
                <img 
                  src={myProfileAvatar} 
                  alt="My Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                  }}
                />
              </div>
              {!isOpenSearch && <span className={`${pathname === "/profile" ? "font-bold" : "font-semibold"} whitespace-nowrap`}>Profile</span>}
            </Link>
          </div>
        </div>

        {/* MORE / MENU BUTTON */}
        <div>
          <button className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group w-full text-left">
            <Menu className={`w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform ${pathname === "/more" ? "stroke-[2.5]" : ""}`} />
            {!isOpenSearch && <span className={`${pathname === "/more" ? "font-bold" : "font-normal"} whitespace-nowrap`}>More</span>}
          </button>
        </div>
      </nav>

      {/* ВЫЕЗЖАЮЩАЯ СБОКУ ПАНЕЛЬ ПОИСКА */}
      <div 
        className={`w-[397px] h-full bg-white border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.05)] transition-all duration-300 ease-in-out px-6 pt-6 transform rounded-r-3xl z-10 ${
          isOpenSearch ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none absolute'
        }`}
        style={{ marginLeft: isOpenSearch ? '0px' : '-397px' }}
      >
        <h2 className="text-[24px] font-bold mb-6 text-black tracking-wide">Search</h2>
        
        <div className="relative mb-6">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search" 
            className="w-full bg-[#efefef] rounded-lg px-4 py-2.5 text-[14px] outline-none placeholder-gray-500 focus:bg-white border border-transparent focus:border-gray-300 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setDebouncedQuery(''); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#c7c7c7] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold hover:bg-[#8e8e8e]"
            >
              ✕
            </button>
          )}
        </div>
        
        <hr className="border-gray-100 -mx-6 mb-4" />
        
        <div className="flex flex-col h-[calc(100%-165px)]">
          {searchQuery.trim() === '' ? (
            // ТЕПЕРЬ ТУТ ПОЛНОЦЕННАЯ РАБОЧАЯ ИСТОРИЯ ИЗ LOCALSTORAGE (RECENT)
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="text-[15px] font-semibold text-black">Recent</div>
                {searchHistory.length > 0 && (
                  <button 
                    onClick={clearAllHistory}
                    className="text-[14px] font-semibold text-[#0095f6] hover:text-[#00376b] transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              
              {searchHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-center text-[14px] text-gray-400 font-normal pb-20">
                  No recent searches.
                </div>
              ) : (
                <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                  {searchHistory.map((user) => {
                    const { hasAvatar, avatarUrl, firstLetter } = getAvatarData(user)
                    return (
                      <div 
                        key={`history-${user.id}`} 
                        onClick={() => handleUserClick(user)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center text-[16px] font-bold text-[#262626] uppercase">
                            {hasAvatar ? (
                              <img src={avatarUrl} alt={user.userName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{firstLetter}</span>
                            )}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-[14px] font-semibold text-[#262626] leading-tight truncate">{user.userName || 'username'}</span>
                            <span className="text-[14px] text-gray-400 leading-tight truncate mt-0.5 font-normal">{user.fullName || ''}</span>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => removeHistoryItem(e, user.id)}
                          className="text-gray-400 hover:text-black p-2 text-[14px]"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            // ДИНАМИЧЕСКИЕ РЕЗУЛЬТАТЫ С СЕРВЕРА
            <div className="flex flex-col h-full">
              <div className="text-[15px] font-semibold text-black mb-4 px-1">Accounts</div>
              
              <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {isLoading || isFetching ? (
                  <div className="text-gray-400 text-center py-10 text-[14px]">Searching accounts...</div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => {
                    const { hasAvatar, avatarUrl, firstLetter } = getAvatarData(user)

                    return (
                      <div 
                        key={user.id} 
                        onClick={() => handleUserClick(user)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors active:scale-[0.99]"
                      >
                        <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center text-[16px] font-bold text-[#262626] uppercase">
                          {hasAvatar ? (
                            <img 
                              src={avatarUrl} 
                              alt={user.userName} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "";
                              }}
                            />
                          ) : (
                            <span>{firstLetter}</span>
                          )}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-[14px] font-semibold text-[#262626] leading-tight truncate">
                            {user.userName || 'username'}
                          </span>
                          <span className="text-[14px] text-gray-400 leading-tight truncate mt-0.5 font-normal">
                            {user.fullName || ''}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-[14px] text-gray-400 mt-16 text-center px-4">
                    No accounts found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}