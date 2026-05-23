'use client'

import { 
  useGetMyProfileQuery,
  useUpdateUserProfileMutation,
  useUpdateUserImageProfileMutation,
  useGetMyPostsQuery, 
  useGetPostFavoritesQuery, 
  useGetPostByIdQuery,
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddPostFavoriteMutation,
  useViewPostMutation,
  useGetSubscribersQuery,
  useGetSubscriptionsQuery,
  useAddFollowingRelationShipMutation,
  useDeleteFollowingRelationShipMutation
} from '../../services/Profile' // Убедись, что путь к файлу profile.ts указан правильно
import { Grid, Heart, MessageCircle, Bookmark, Share2, X, Trash2, User, Settings, Plus, Camera } from 'lucide-react'
import { useState, useRef, ChangeEvent } from 'react'
import { Skeleton, message, Modal, Input, Avatar, Select } from 'antd'

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGES || 'https://instagram-api.softclub.tj/images'

export default function MyProfilePage() {
  const [messageApi, contextHolder] = message.useMessage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Состояния для табов и модалок
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts')
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [isPostDetailsModalOpen, setIsPostDetailsModalOpen] = useState(false)
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false)
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false)
  
  // Состояния для редактирования профиля
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)
  const [bioText, setBioText] = useState('')
  const [genderValue, setGenderValue] = useState<number>(0)
  
  const [commentText, setCommentText] = useState('')
  const [likedPostIds, setLikedPostIds] = useState<Record<number, boolean>>({})

  // --- RTK Query: Получение данных ---
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfileQuery(undefined)
  const { data: myPostsData, isLoading: isPostsLoading } = useGetMyPostsQuery(undefined)
  const { data: favoritesData, isLoading: isFavoritesLoading } = useGetPostFavoritesQuery({ PageNumber: 1, PageSize: 50 }, { skip: activeTab !== 'saved' })
  const { data: subscribersData } = useGetSubscribersQuery('')
  const { data: subscriptionsData } = useGetSubscriptionsQuery('')
  const { data: postDetails, refetch: refetchPostDetails } = useGetPostByIdQuery(selectedPostId || 0, { skip: !selectedPostId })
  
  // --- RTK Query: Мутации профиля ---
  const [updateProfileText, { isLoading: isSavingProfile }] = useUpdateUserProfileMutation()
  const [updateProfileImage, { isLoading: isUploadingImage }] = useUpdateUserImageProfileMutation()

  // --- RTK Query: Другие мутации ---
  const [followUser] = useAddFollowingRelationShipMutation()
  const [unfollowUser] = useDeleteFollowingRelationShipMutation()
  const [likePost] = useLikePostMutation()
  const [viewPost] = useViewPostMutation()
  const [addComment] = useAddCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()
  const [addToFavorite] = useAddPostFavoriteMutation()

  // Скелетон загрузки
  if (isProfileLoading || isPostsLoading || isFavoritesLoading) {
    return (
      <div className="min-h-screen bg-white w-full md:pl-[244px] px-5 py-8">
        <div className="max-w-[935px] mx-auto">
          <div className="flex gap-10 items-center mb-10 pb-10 border-b border-[#dbdbdb]">
            <Skeleton.Avatar active size={150} shape="circle" />
            <div className="flex-1">
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          </div>
          <Skeleton active paragraph={{ rows: 4 }} />
        </div>
      </div>
    )
  }

  // Безопасное извлечение данных профиля
  const myProfileData = profile?.data || profile
  const username = myProfileData?.userName || 'пользователь'
  const fullName = myProfileData?.fullName || myProfileData?.fullname || 'Имя не указано'
  const bio = myProfileData?.about || ''
  
  const rawAvatar = myProfileData?.image || myProfileData?.avatar || myProfileData?.userPhoto
  const avatar = rawAvatar ? (rawAvatar.startsWith('http') ? rawAvatar : `${IMAGE_BASE_URL}/${rawAvatar}`) : '/images/default-avatar.svg'

  // Подписчики и подписки
  const followersList = subscribersData?.data || (Array.isArray(subscribersData) ? subscribersData : [])
  const subscriptionsList = subscriptionsData?.data || (Array.isArray(subscriptionsData) ? subscriptionsData : [])
  const followersCount = myProfileData?.subscribersCount ?? followersList.length
  const subscriptionsCount = myProfileData?.subscriptionsCount ?? subscriptionsList.length

  // Списки публикаций и сохраненных постов
  const userPosts = myPostsData?.data || (Array.isArray(myPostsData) ? myPostsData : [])
  const savedPosts = favoritesData?.data || (Array.isArray(favoritesData) ? favoritesData : [])
  const totalPublications = userPosts.length
  const activePostsList = activeTab === 'posts' ? userPosts : savedPosts

  // --- Функция открытия модалки редактирования профиля ---
  const openEditProfileModal = () => {
    setBioText(myProfileData?.about || '')
    setGenderValue(myProfileData?.gender ?? 0)
    setIsEditProfileModalOpen(true)
  }

  // --- Сохранение текстовых данных профиля через RTK Query ---
  const handleSaveProfileText = async () => {
    try {
      await updateProfileText({
        about: bioText,
        gender: genderValue
      }).unwrap()
      
      messageApi.success('Профиль успешно обновлен')
      setIsEditProfileModalOpen(false)
    } catch (err) {
      messageApi.error('Не удалось сохранить изменения')
    }
  }
  
  // Перенаправление клика с аватарки на скрытый input
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  // --- Обновление аватарки (FormData) через RTK Query ---
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      messageApi.error('Пожалуйста, выберите изображение')
      return
    }

    const formData = new FormData()
    formData.append('imageFile', file) // Ключ "imageFile" взят строго из вашего Swagger

    try {
      await updateProfileImage(formData).unwrap()
      messageApi.success('Аватар успешно обновлен')
    } catch (err) {
      messageApi.error('Не удалось загрузить изображение')
    }
  }

  const handleActionClick = async (userId: string, isSubbed: boolean) => {
    try {
      if (isSubbed) {
        await unfollowUser(userId).unwrap()
        messageApi.success("Вы отписались")
      } else {
        await followUser(userId).unwrap()
        messageApi.success("Вы подписались")
      }
    } catch (err) {
      messageApi.error("Не удалось выполнить действие")
    }
  }

  const openPostModal = (postId: number) => {
    setSelectedPostId(postId)
    setIsPostDetailsModalOpen(true)
    viewPost(postId)
  }

  const handleLikePost = async (postId: number) => {
    try {
      await likePost(postId).unwrap()
      setLikedPostIds((prev) => ({ ...prev, [postId]: !prev[postId] }))
      refetchPostDetails()
    } catch (err) {
      messageApi.error('Ошибка изменения лайка')
    }
  }

  const handleAddComment = async (postId: number) => {
    if (!commentText.trim()) return
    try {
      await addComment({ postId, commentText }).unwrap()
      setCommentText('')
      refetchPostDetails()
    } catch (err) {
      messageApi.error('Ошибка добавления комментария')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId).unwrap()
      messageApi.success('Комментарий удален')
      refetchPostDetails()
    } catch (err) {
      messageApi.error('Не удалось удалить комментарий')
    }
  }

  const handleFileSave = async (postId: number) => {
    try {
      await addToFavorite(postId).unwrap()
      messageApi.success("Статус избранного обновлен")
      refetchPostDetails()
    } catch (err) {
      messageApi.error("Ошибка сохранения")
    }
  }

  const currentPost = postDetails?.data || postDetails
  const modalMediaUrl = currentPost?.images?.[0] ? (currentPost.images[0].startsWith('http') ? currentPost.images[0] : `${IMAGE_BASE_URL}/${currentPost.images[0]}`) : ''

  return (
    <div className="min-h-screen bg-white w-full md:pl-[244px] font-sans antialiased text-[#262626]">
      {contextHolder}
      <div className="max-w-[975px] mx-auto px-5 py-8">
        
        {/* СКРЫТЫЙ INPUT ДЛЯ ЗАГРУЗКИ КАРТИНКИ */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        {/* ШАПКА ПРОФИЛЯ */}
        <header className="flex flex-row items-start gap-10 md:gap-20 pb-11 border-b border-[#efefef] mb-0">
          <div className="flex-shrink-0 md:w-[290px] flex justify-center">
            <div 
              onClick={handleAvatarClick}
              className={`relative w-[150px] h-[150px] rounded-full overflow-hidden border border-[#dbdbdb] bg-[#fafafa] cursor-pointer group transition-all ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}
              title="Изменить фото профиля"
            >
              <img src={avatar} alt={username} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={26} className="mb-1" />
                <span className="text-[12px] font-medium">Обновить</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[20px] font-normal text-[#262626] mr-4">{username}</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={openEditProfileModal}
                  className="bg-[#efefef] hover:bg-[#dbdbdb] text-[14px] font-semibold text-[#262626] px-4 py-1.5 rounded-lg border-none cursor-pointer transition-colors"
                >
                  Редактировать профиль
                </button>
                <button className="bg-[#efefef] hover:bg-[#dbdbdb] p-1.5 rounded-lg border-none cursor-pointer">
                  <Plus size={18} />
                </button>
                <Settings className="w-6 h-6 text-[#262626] cursor-pointer hover:opacity-60 ml-1" />
              </div>
            </div>

            <div className="flex items-center gap-7 text-[16px] text-[#262626]">
              <div><span className="font-semibold">{totalPublications}</span> публикаций</div>
              <div onClick={() => setIsFollowersModalOpen(true)} className="cursor-pointer hover:opacity-70"><span className="font-semibold">{followersCount}</span> подписчиков</div>
              <div onClick={() => setIsFollowingModalOpen(true)} className="cursor-pointer hover:opacity-70"><span className="font-semibold">{subscriptionsCount}</span> подписок</div>
            </div>

            <div className="text-[14px]">
              <h1 className="font-bold text-black mb-1">{fullName}</h1>
              {bio && <p className="whitespace-pre-wrap font-normal text-[#262626]">{bio}</p>}
            </div>
          </div>
        </header>

        {/* ТАБЫ */}
        <div className="flex justify-center gap-14 border-t border-[#efefef]">
          <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === 'posts' ? 'border-black text-black font-bold' : 'border-transparent text-[#8e8e8e]'}`}><Grid className="w-3 h-3" /> Публикации</button>
          <button onClick={() => setActiveTab('saved')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === 'saved' ? 'border-black text-black font-bold' : 'border-transparent text-[#8e8e8e]'}`}><Bookmark className="w-3 h-3" /> Сохранения</button>
        </div>

        {/* СЕТКА КОНТЕНТА */}
        <div className="mt-2">
          {activePostsList.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 md:gap-7">
              {activePostsList.map((post: any) => {
                const mediaFile = post.images?.[0] || post.userImage || ''
                const pMedia = mediaFile ? (mediaFile.startsWith('http') ? mediaFile : `${IMAGE_BASE_URL}/${mediaFile}`) : '/images/default-avatar.svg'

                return (
                  <div key={post.postId || post.id} onClick={() => openPostModal(post.postId || post.id)} className="relative aspect-square bg-black overflow-hidden group cursor-pointer border border-[#efefef]">
                    <img src={pMedia} alt="post" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white gap-6 font-semibold z-20">
                      <div className="flex items-center gap-1.5"><Heart fill="white" size={20} /> {post.postLikeCount || 0}</div>
                      <div className="flex items-center gap-1.5"><MessageCircle fill="white" size={20} /> {post.commentCount || 0}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center mb-4">
                {activeTab === 'saved' ? <Bookmark size={32} /> : <Grid size={32} />}
              </div>
              <h3 className="text-[28px] font-extrabold mb-2">Публикаций пока нет</h3>
            </div>
          )}
        </div>

        {/* МОДАЛКА РЕДАКТИРОВАНИЯ ПРОФИЛЯ */}
        <Modal
          title={<div className="text-center font-bold text-[16px] border-b border-gray-100 pb-3 -mx-6">Редактировать профиль</div>}
          open={isEditProfileModalOpen}
          onCancel={() => setIsEditProfileModalOpen(false)}
          okText="Сохранить"
          cancelText="Отмена"
          onOk={handleSaveProfileText}
          confirmLoading={isSavingProfile}
          centered
          width={450}
        >
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-semibold text-gray-700">О себе</label>
              <Input.TextArea 
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Расскажите о себе..."
                autoSize={{ minRows: 3, maxRows: 5 }}
                className="text-[14px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-semibold text-gray-700">Пол</label>
              <Select
                value={genderValue}
                onChange={(value) => setGenderValue(value)}
                className="w-full text-[14px]"
                options={[
                  { value: 0, label: 'Мужской' },
                  { value: 1, label: 'Женский' },
                  { value: 2, label: 'Не указан' },
                ]}
              />
            </div>
          </div>
        </Modal>

        {/* МОДАЛКА ПРОСМОТРА ПОСТА */}
        <Modal 
          open={isPostDetailsModalOpen} 
          onCancel={() => { setIsPostDetailsModalOpen(false); setSelectedPostId(null); }} 
          width={1100} footer={null} centered styles={{ body: { padding: 0 } }}
          closeIcon={<X className="text-white fixed right-4 top-4 w-6 h-6" />}
        >
          {currentPost && (
            <div className="flex flex-col md:flex-row h-[85vh] md:h-[680px] bg-white overflow-hidden rounded-r-md rounded-l-md">
              <div className="w-full md:w-[60%] bg-black flex items-center justify-center h-[50%] md:h-full relative select-none">
                <img src={modalMediaUrl} alt="Post content" className="w-full h-full object-contain" />
              </div>

              <div className="w-full md:w-[40%] flex flex-col h-[50%] md:h-full bg-white text-black border-l border-[#efefef]">
                <div className="flex items-center gap-3 p-4 border-b border-[#efefef] bg-white">
                  <Avatar src={avatar} size="medium" className="border border-gray-200" />
                  <div className="flex flex-col">
                    <span className="font-semibold text-[14px] text-black">{username}</span>
                    <span className="text-[12px] text-gray-400">{currentPost?.title || 'Публикация'}</span>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white text-[14px]">
                  {currentPost?.content && (
                    <div className="flex gap-3 items-start pb-3 border-b border-[#fafafa]">
                      <Avatar src={avatar} size="small" className="flex-shrink-0" />
                      <div>
                        <span className="font-semibold mr-2 text-black">{username}</span>
                        <span className="text-[#262626] break-words">{currentPost.content}</span>
                      </div>
                    </div>
                  )}

                  {currentPost?.comments?.map((comment: any) => {
                    const commentAuthor = comment.userName || 'Пользователь';
                    const userAvatar = comment.userImage ? `${IMAGE_BASE_URL}/${comment.userImage}` : undefined
                    return (
                      <div key={comment.postCommentId} className="flex gap-3 items-start text-[13px] justify-between group">
                        <div className="flex gap-3 items-start flex-1">
                          <Avatar src={userAvatar} size="small" className="flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-semibold mr-1.5 text-black">{commentAuthor}</span>
                            <span className="text-gray-700 break-words">{comment.comment || ''}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteComment(comment.postCommentId)} className="text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="p-4 border-t border-[#efefef] bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLikePost(selectedPostId!)} className="bg-transparent border-none p-0 cursor-pointer">
                        <Heart size={24} className={likedPostIds[selectedPostId!] || currentPost?.postLike ? "text-red-500 fill-red-500" : "text-black"} />
                      </button>
                      <MessageCircle size={24} className="text-black cursor-pointer" />
                      <Share2 size={24} className="text-black cursor-pointer" />
                    </div>
                    <button onClick={() => handleFileSave(selectedPostId!)} className="bg-transparent border-none p-0 cursor-pointer">
                      <Bookmark size={24} className={currentPost?.postFavorite ? "text-black fill-black" : "text-black"} />
                    </button>
                  </div>
                  <div className="font-semibold text-[14px] text-black">{currentPost?.postLikeCount || 0} отметок «Нравится»</div>
                </div>

                <div className="p-3 border-t border-[#efefef] flex items-center gap-2 bg-white">
                  <Input 
                    value={commentText} 
                    onChange={(e) => setCommentText(e.target.value)} 
                    placeholder="Добавьте комментарий..." 
                    bordered={false} 
                    className="flex-1 text-[14px]" 
                    onPressEnter={() => handleAddComment(selectedPostId!)} 
                  />
                  <button onClick={() => handleAddComment(selectedPostId!)} disabled={!commentText.trim()} className="text-[#0095f6] font-semibold text-[14px] bg-transparent border-none cursor-pointer disabled:opacity-30">
                    Опубликовать
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* МОДАЛКА ПОДПИСЧИКОВ */}
        <Modal 
          title={<div className="text-center font-bold text-[16px] border-b border-gray-100 pb-3 -mx-6">Подписчики</div>}
          open={isFollowersModalOpen} 
          onCancel={() => setIsFollowersModalOpen(false)} 
          footer={null} centered width={400}
          styles={{ body: { padding: '8px 24px 24px 24px' } }}
        >
          <div className="max-h-[400px] overflow-y-auto flex flex-col gap-4 pt-3">
            {followersList && followersList.length > 0 ? followersList.map((item: any) => {
              const info = item.userShortInfo || item || {}
              const fAvatar = info.userPhoto || info.avatar || info.image
              return (
                <div key={item.id || info.userId} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      src={fAvatar ? (fAvatar.startsWith('http') ? fAvatar : `${IMAGE_BASE_URL}/${fAvatar}`) : undefined} 
                      size={44} icon={<User />} className="border border-gray-100 flex-shrink-0" 
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[14px] text-black leading-tight">{info.userName || 'user'}</span>
                      <span className="text-gray-400 text-[14px] font-normal leading-tight">{info.fullname || info.fullName || 'Имя не указано'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleActionClick(info.userId, true)}
                    className="bg-[#efefef] hover:bg-[#dbdbdb] text-[14px] font-semibold text-black px-4 py-1.5 rounded-lg border-none cursor-pointer transition-colors"
                  >
                    Удалить
                  </button>
                </div>
              )
            }) : <div className="text-center text-gray-400 py-6">Нет подписчиков</div>}
          </div>
        </Modal>

        {/* МОДАЛКА ПОДПИСОК */}
        <Modal 
          title={<div className="text-center font-bold text-[16px] border-b border-gray-100 pb-3 -mx-6">Подписки</div>}
          open={isFollowingModalOpen} 
          onCancel={() => setIsFollowingModalOpen(false)} 
          footer={null} centered width={400}
          styles={{ body: { padding: '8px 24px 24px 24px' } }}
        >
          <div className="max-h-[400px] overflow-y-auto flex flex-col gap-4 pt-3">
            {subscriptionsList && subscriptionsList.length > 0 ? subscriptionsList.map((item: any) => {
              const info = item.userShortInfo || item || {}
              const fAvatar = info.userPhoto || info.avatar || info.image
              return (
                <div key={item.id || info.userId} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar 
                      src={fAvatar ? (fAvatar.startsWith('http') ? fAvatar : `${IMAGE_BASE_URL}/${fAvatar}`) : undefined} 
                      size={44} icon={<User />} className="border border-gray-100 flex-shrink-0" 
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[14px] text-black leading-tight">{info.userName || 'user'}</span>
                      <span className="text-gray-400 text-[14px] font-normal leading-tight">{info.fullname || info.fullName || 'Имя не указано'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleActionClick(info.userId, true)}
                    className="bg-[#efefef] hover:bg-[#dbdbdb] text-[14px] font-semibold text-black px-4 py-1.5 rounded-lg border-none cursor-pointer transition-colors"
                  >
                    Отписаться
                  </button>
                </div>
              )
            }) : <div className="text-center text-gray-400 py-6">Нет подписок</div>}
          </div>
        </Modal>

      </div>
    </div>
  )
}