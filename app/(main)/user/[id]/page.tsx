'use client'
import { useParams } from 'next/navigation'
import { 
  useGetUserProfileByIdQuery, 
  useGetIsFollowUserProfileByIdQuery,
  useAddFollowingRelationShipMutation,
  useDeleteFollowingRelationShipMutation 
} from '../../../services/Profile'
import { Grid, Clapperboard, MoreHorizontal, UserCheck } from 'lucide-react'
import { useState } from 'react'
import { Skeleton, Avatar } from 'antd'

export default function UserProfilePage() {
  const { id } = useParams() 

  // --- API Hooks ---
  const { data: profile, isLoading: isProfileLoading } = useGetUserProfileByIdQuery(id)
  const { data: isFollowData, isLoading: isFollowLoading } = useGetIsFollowUserProfileByIdQuery(id)
  
  const [followUser] = useAddFollowingRelationShipMutation()
  const [unfollowUser] = useDeleteFollowingRelationShipMutation()

  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts')

  if (isProfileLoading || isFollowLoading) {
    return (
      <div className="min-h-screen bg-white w-full md:pl-[244px] px-5 py-8">
        <div className="max-w-[935px] mx-auto">
          <div className="flex gap-10 items-center mb-10 pb-10 border-b border-[#dbdbdb]">
            <Skeleton.Avatar active size={150} shape="circle" />
            <div className="flex-1">
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          </div>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </div>
    )
  }

  const user = profile?.data || profile
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full md:pl-[244px] text-[#8e8e8e] bg-white font-sans">
        Пользователь не найден.
      </div>
    )
  }

  const username = user.userName || 'username'
  const fullName = user.fullName || 'Имя не указано'
  const bio = user.bio || ''
  const avatar = user.avatar || '/images/default-avatar.svg'
  
  const followersCount = user.subscribersCount || 0
  const subscriptionsCount = user.subscriptionsCount || 0
  const postsCount = user.postsCount || 0

  const isFollowing = isFollowData?.data ?? isFollowData ?? false

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await unfollowUser({ userId: id }).unwrap()
      } else {
        await followUser({ userId: id }).unwrap()
      }
    } catch (err) {
      console.error("Ошибка при изменении подписки:", err)
    }
  }

  return (
    <div className="min-h-screen bg-white w-full md:pl-[244px] font-sans antialiased text-[#262626]">
      <div className="max-w-[975px] mx-auto px-5 py-8">
        
        {/* ХЕДЕР ПРОФИЛЯ СТОРОННЕГО ПОЛЬЗОВАТЕЛЯ */}
        <header className="flex flex-col sm:flex-row items-stretch gap-8 sm:gap-24 pb-11 border-b border-[#dbdbdb] mb-0">
          
          {/* Блок аватара */}
          <div className="flex justify-center items-center sm:w-[290px] flex-shrink-0">
            <div className="w-[150px] h-[150px] rounded-full overflow-hidden border border-[#dbdbdb] bg-[#fafafa]">
              <img src={avatar} alt={username} className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Информационный блок */}
          <div className="flex-1 flex flex-col gap-5 pt-1">
            
            {/* Строка 1: Никнейм, кнопки действий */}
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
              <h2 className="text-[20px] font-light text-[#262626] tracking-wide mr-2">{username}</h2>
              
              <div className="flex items-center gap-2">
                {isFollowing ? (
                  <button 
                    onClick={handleFollowToggle}
                    className="bg-[#efefef] hover:bg-[#dbdbdb] transition-colors text-[14px] font-semibold text-[#262626] px-5 py-1.5 rounded-lg border-none cursor-pointer flex items-center gap-1.5"
                  >
                    <UserCheck size={16} /> Подписки
                  </button>
                ) : (
                  <button 
                    onClick={handleFollowToggle}
                    className="bg-[#0095f6] hover:bg-[#1877f2] transition-colors text-[14px] font-semibold text-white px-6 py-1.5 rounded-lg border-none cursor-pointer"
                  >
                    Подписаться
                  </button>
                )}
                
                <button className="bg-[#efefef] hover:bg-[#dbdbdb] transition-colors text-[14px] font-semibold text-[#262626] px-4 py-1.5 rounded-lg border-none cursor-pointer">
                  Отправить сообщение
                </button>
              </div>

              <MoreHorizontal className="w-6 h-6 text-[#262626] cursor-pointer hover:opacity-70 transition-opacity ml-1" />
            </div>

            {/* Строка 2: Статистика */}
            <div className="hidden sm:flex items-center gap-10 text-[16px] text-[#262626]">
              <div>Публикаций: <span className="font-semibold">{postsCount}</span></div>
              <div>Подписчики: <span className="font-semibold">{followersCount}</span></div>
              <div>Подписки: <span className="font-semibold">{subscriptionsCount}</span></div>
            </div>

            {/* Строка 3: Имя и Биография */}
            <div className="text-center sm:text-left text-[14px] text-[#262626] leading-relaxed">
              <h1 className="font-semibold">{fullName}</h1>
              {bio && <p className="whitespace-pre-wrap font-normal mt-1 text-[#262626]">{bio}</p>}
            </div>
          </div>
        </header>

        {/* Мобильная статистика */}
        <div className="flex sm:hidden justify-around border-b border-[#dbdbdb] py-3 text-center text-[14px] text-[#8e8e8e]">
          <div>публикаций<div className="font-semibold text-[#262626]">{postsCount}</div></div>
          <div>подписчиков<div className="font-semibold text-[#262626]">{followersCount}</div></div>
          <div>подписок<div className="font-semibold text-[#262626]">{subscriptionsCount}</div></div>
        </div>

        {/* ТАБЫ (Разделители разделов) */}
        <div className="flex justify-center gap-14 border-t border-transparent sm:border-[#dbdbdb] -mt-[1px]">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer transition-colors ${
              activeTab === 'posts' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'
            }`}
          >
            <Grid className="w-3 h-3 stroke-[2.5]" /> Публикации
          </button>
          <button 
            onClick={() => setActiveTab('reels')}
            className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer transition-colors ${
              activeTab === 'reels' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'
            }`}
          >
            <Clapperboard className="w-3 h-3 stroke-[2.5]" /> Reels
          </button>
        </div>

        {/* СЕТКА КОНТЕНТА */}
        <div className="mt-4">
          {activeTab === 'posts' && (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-white">
              <div className="p-4 border-[2px] border-[#262626] rounded-full mb-5">
                <Grid size={32} className="text-[#262626] stroke-[1.5]"/>
              </div>
              <h3 className="text-[32px] font-black text-[#262626] tracking-tight mb-2">Публикаций пока нет</h3>
            </div>
          )}
          {activeTab === 'reels' && (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-white">
              <div className="p-4 border-[2px] border-[#262626] rounded-full mb-5">
                <Clapperboard size={32} className="text-[#262626] stroke-[1.5]"/>
              </div>
              <h3 className="text-[32px] font-black text-[#262626] tracking-tight mb-2">Нет видео Reels</h3>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}