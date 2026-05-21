'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGetUsersQuery } from '../services/Search'
import { Home, Search, Compass, Clapperboard, MessageSquare, Heart, PlusSquare, Menu } from 'lucide-react'

// Базовый URL бэкенда для загрузки изображений пользователей
const IMAGE_BASE_URL = "https://instagram-api.softclub.tj";

export default function Navbar() {
  const router = useRouter()
  const [isOpenSearch, setIsOpenSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Имитируем задержку (Debounce): обновляем строку для запроса только через 400мс после остановки ввода
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 400)

    return () => clearTimeout(handler)
  }, [searchQuery])

  // Запрос на бэкенд уходит ТОЛЬКО когда панель открыта И пользователь ввёл хотя бы один символ
  const { data: users, isLoading, isFetching } = useGetUsersQuery(debouncedQuery, {
    skip: !isOpenSearch || debouncedQuery.trim() === '',
  })

  const toggleSearch = () => {
    setIsOpenSearch(!isOpenSearch)
    if (isOpenSearch) {
      setSearchQuery('') // Очищаем инпут при закрытии панели
      setDebouncedQuery('')
    }
  }

  // Безопасно приводим данные к массиву
  const usersList = Array.isArray(users) ? users : []

  // Локальная фильтрация (на случай, если бэк вернул чуть больше данных, для подстраховки)
  const filteredUsers = usersList.filter((user: any) =>
    user?.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Переход на страницу чужого профиля при клике в поиске
  const handleUserClick = (userId: string) => {
    setIsOpenSearch(false)
    setSearchQuery('')
    setDebouncedQuery('')
    router.push(`/user/${userId}`)
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
          {/* Логотип Instagram (Большой или mini) */}
          <div className="mb-7 px-3 h-[40px] flex items-center justify-start overflow-hidden">
            {isOpenSearch ? (
              <Link href="/">
                <svg className="w-6 h-6 fill-current min-w-[24px] hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </Link>
            ) : (
              <Link href="/">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Instagram_logo.svg/1200px-Instagram_logo.svg.png" 
                  alt="Instagram" 
                  className="w-[103px] min-w-[103px] object-contain"
                />
              </Link>
            )}
          </div>

          {/* Пункты Меню */}
          <div className="flex flex-col gap-1">
            <Link href="/" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <Home className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" />
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Home</span>}
            </Link>

            <button 
              onClick={toggleSearch} 
              className={`flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group w-full text-left ${
                isOpenSearch ? 'border border-gray-200 bg-gray-50' : ''
              }`}
            >
              <Search className={`w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform ${isOpenSearch ? 'stroke-[2.5]' : ''}`} />
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Search</span>}
            </button>

            <Link href="/explore" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <Compass className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" />
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Explore</span>}
            </Link>

            <Link href="/reels" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <Clapperboard className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" />
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Reels</span>}
            </Link>

            <Link href="/messages" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <MessageSquare className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" />
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Messages</span>}
            </Link>

            <Link href="/notifications" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <Heart className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" />
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Notifications</span>}
            </Link>

            <Link href="/create" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <PlusSquare className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" />
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Create</span>}
            </Link>

            <Link href="/profile" className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group">
              <div className="w-6 h-6 min-w-[24px] rounded-full overflow-hidden border border-gray-300 group-hover:scale-105 transition-transform">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                  alt="My Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
              {!isOpenSearch && <span className="font-semibold whitespace-nowrap">Profile</span>}
            </Link>
          </div>
        </div>

        <div>
          <button className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors group w-full text-left">
            <Menu className="w-6 h-6 min-w-[24px] text-[#262626] group-hover:scale-105 transition-transform" />
            {!isOpenSearch && <span className="font-normal whitespace-nowrap">More</span>}
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
            // Состояние "Недавнее" когда инпут пустой
            <div className="flex flex-col h-full">
              <div className="text-[15px] font-semibold text-black mb-4 px-1">Recent</div>
              <div className="flex flex-col items-center justify-center flex-1 text-center text-[14px] text-gray-400 font-normal pb-20">
                No recent searches.
              </div>
            </div>
          ) : (
            // Результаты поиска при вводе букв
            <div className="flex flex-col h-full">
              <div className="text-[15px] font-semibold text-black mb-4 px-1">Accounts</div>
              
              <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {isLoading || isFetching ? (
                  <div className="text-gray-400 text-center py-10 text-[14px]">Searching accounts...</div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => {
                    
                    // ФИКС АВАТАРА: Если в поле "image" пришло название картинки с бэка, 
                    // склеиваем его с доменом. Иначе — показываем дефолтный Unsplash плейсхолдер.
                    const finalAvatar = user?.image 
                      ? `${IMAGE_BASE_URL}/${user.image}` 
                      : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";

                    return (
                      <div 
                        key={user.id} 
                        onClick={() => handleUserClick(user.id)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors active:scale-[0.99]"
                      >
                        {/* Аватар пользователя */}
                        <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                          <img 
                            src={finalAvatar} 
                            alt={user.userName} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Если картинка упала с 404, подменяем на запасную
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80";
                            }}
                          />
                        </div>
                        {/* Имена */}
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