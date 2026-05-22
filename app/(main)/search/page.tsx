'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGetUsersQuery } from '../../services/Search'

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGES || 'https://instagram-api.softclub.tj/images'

export default function Navbar() {
  const router = useRouter()
  const [isOpenSearch, setIsOpenSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Имитируем задержку ввода (Debounce), чтобы не спамить сервер при каждом символе
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 400) // Запрос пойдет через 400мс после остановки ввода

    return () => clearTimeout(handler)
  }, [searchQuery])

  // RTK Query: Отправляем запрос ТОЛЬКО если панель открыта И в инпуте что-то написано
  const { data: filteredUsers = [], isLoading, isFetching } = useGetUsersQuery(debouncedQuery, {
    skip: !isOpenSearch || debouncedQuery.trim() === '',
  })

  const toggleSearch = () => {
    setIsOpenSearch(!isOpenSearch)
    if (isOpenSearch) {
      setSearchQuery('')
      setDebouncedQuery('')
    }
  }

  const handleUserClick = (userId: string) => {
    setIsOpenSearch(false)
    setSearchQuery('')
    setDebouncedQuery('')
    // Переход на страницу чужого профиля по id пользователя
    router.push(`/user/${userId}`)
  }

  return (
    <div className="flex fixed left-0 top-0 z-50 h-screen select-none">
      {/* ЛЕВАЯ ПАНЕЛЬ НАВИГАЦИИ */}
      <nav
        className={`flex flex-col justify-between h-full bg-white border-r border-[#dbdbdb] px-3 pt-10 pb-6 font-sans text-[16px] text-[#262626] transition-all duration-300 ease-in-out z-20 ${isOpenSearch ? 'w-[72px]' : 'w-[244px]'
          }`}
      >
        <div className="flex flex-col gap-2">
          {/* ЛОГОТИП */}
          <div className="mt-[-40px] h-[60px] flex items-center justify-center overflow-hidden transition-all duration-300">
            {isOpenSearch ? (
              <svg className="w-6 h-6 fill-current min-w-[24px]" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            ) : (
              <img
                src="/images/instagram-logo.svg"
                alt="Instagram"
                className="w-[110px] min-w-[110px] object-contain"
              />
            )}
          </div>

          <div className="flex flex-col gap-1">
            {/* Home */}
            <Link href="/home" className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#fafafa] transition-colors group">
              <svg className="w-6 h-6 stroke-[2] stroke-current min-w-[24px]" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Главная</span>}
            </Link>

            {/* Кнопка Search */}
            <button
              onClick={toggleSearch}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all group w-full text-left ${isOpenSearch ? 'border border-[#dbdbdb] bg-[#fafafa] font-bold' : 'hover:bg-[#fafafa]'
                }`}
            >
              <svg className="w-6 h-6 stroke-[2] stroke-current min-w-[24px]" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              {!isOpenSearch && <span className="font-normal">Поиск</span>}
            </button>

            {/* Profile */}
            <Link href="/profile" className="flex items-center gap-4 p-3 rounded-lg transition-colors hover:bg-[#fafafa]">
              <div className="w-6 h-6 min-w-[24px] rounded-full overflow-hidden border border-[#dbdbdb]">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              {!isOpenSearch && <span className="font-normal whitespace-nowrap">Профиль</span>}
            </Link>
          </div>
        </div>
      </nav>

      {/* ВЫЕЗЖАЮЩАЯ ПАНЕЛЬ ПОИСКА */}
      <div
        className={`w-[397px] h-full bg-white border-r border-[#dbdbdb] rounded-r-2xl shadow-sm transition-all duration-300 ease-in-out px-6 pt-6 transform z-10 ${isOpenSearch ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none absolute'
          }`}
        style={{ marginLeft: isOpenSearch ? '0px' : '-397px' }}
      >
        <h2 className="text-[24px] font-semibold mb-6 tracking-tight">Поиск</h2>

        <div className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск"
            className="w-full bg-[#efefef] rounded-lg px-4 py-2.5 text-[14px] outline-none placeholder-[#8e8e8e] focus:bg-white border border-transparent focus:border-[#dbdbdb] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#c7c7c7] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold hover:bg-[#8e8e8e]"
            >
              ✕
            </button>
          )}
        </div>

        <hr className="border-[#dbdbdb] -mx-6 mb-4" />

        {/* Результаты поиска */}
        <div className="flex flex-col h-[calc(100%-150px)]">
          {searchQuery.trim() === '' ? (
            // Состояние по умолчанию (История или заглушка как в инсте)
            <div className="flex flex-col h-full">
              <div className="text-[15px] font-semibold text-[#262626] mb-3 px-1">Недавнее</div>
              <div className="flex flex-col items-center justify-center flex-1 text-center text-[14px] text-[#8e8e8e] font-normal pb-20">
                Нет недавних запросов.
              </div>
            </div>
          ) : (
            // Динамические результаты с сервера
            <div className="flex flex-col h-full">
              <div className="text-[14px] font-semibold text-[#262626] mb-3 px-1">Результаты</div>

              <div className="flex flex-col gap-1 overflow-y-auto flex-1 -mx-2 px-2">
                {isLoading || isFetching ? (
                  <div className="text-[#8e8e8e] text-center py-6 text-[14px]">Поиск аккаунтов...</div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => {
                    {/* ЗАМЕНИ НА ЭТОТ КУСОК КОДА: */ }
                    const rawAvatar = (user?.avatar || user?.imagePath || user?.image || user?.userImage || '').trim()

                    const userAvatar = rawAvatar
                      ? (rawAvatar.startsWith('http')
                        ? rawAvatar
                        : `${IMAGE_BASE_URL}/${rawAvatar.replace(/^\/+/, '')}`)
                      : ''

                    // Проверяем, пустой ли аватар ИЛИ содержит ли он дефолтную картинку женщины с сервера
                    const isDefaultServerImage = userAvatar.includes('photo-1534528741775-53994a69daeb') || rawAvatar === ''
                    const hasAvatar = !isDefaultServerImage
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleUserClick(user.id)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#fafafa] cursor-pointer transition-colors"
                      >
                        <div className="w-11 h-11 rounded-full bg-[#f2f2f2] overflow-hidden border border-[#dbdbdb] flex-shrink-0 flex items-center justify-center text-[16px] font-bold text-[#262626] uppercase">
                          {hasAvatar ? (
                            <img
                              src={userAvatar}
                              alt={user.userName || user.fullName || 'User'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                ; (e.target as HTMLImageElement).src = ''
                              }}
                            />
                          ) : (
                            <span>
                              {(user.userName || user.fullName || 'U').charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[14px] font-semibold text-[#262626] truncate">{user.userName || 'username'}</span>
                          <span className="text-[14px] text-[#8e8e8e] truncate font-normal">{user.fullName || ''}</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-[14px] text-[#8e8e8e] mt-12 text-center font-normal">Ничего не найдено.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}