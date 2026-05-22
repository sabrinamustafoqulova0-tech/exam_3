'use client'
import { 
  useGetMyProfileQuery, 
  useGetMyPostsQuery,
  useUpdateUserProfileMutation, 
  useUpdateUserImageProfileMutation,
  useAddPostMutation,
  useGetPostByIdQuery,
  useDeletePostMutation,
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useGetSubscribersQuery,
  useGetSubscriptionsQuery,
  useGetPostFavoritesQuery,
  useDeleteFollowingRelationShipMutation,
} from '../../services/Profile'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Modal, Input, message, Skeleton, Avatar, Select } from 'antd'
import { Grid, Bookmark, Settings, Camera, Plus, User, Heart, MessageCircle, X, Share2, Trash2 } from 'lucide-react'

const { TextArea } = Input
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGES || 'https://instagram-api.softclub.tj/images'

export default function MyProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [messageApi, contextHolder] = message.useMessage()
  const router = useRouter()

  // --- API Hooks ---
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfileQuery(undefined)
  const { data: myPosts, isLoading: isPostsLoading } = useGetMyPostsQuery(undefined)
  
  const user = profile?.data || profile
  const myUserId = user?.id || user?.userId || ''

  const { data: subscribersData } = useGetSubscribersQuery(myUserId, { skip: !myUserId })
  const { data: subscriptionsData, refetch: refetchSubscriptions } = useGetSubscriptionsQuery(myUserId, { skip: !myUserId })
  const { data: favoritesData } = useGetPostFavoritesQuery(undefined)

  const [updateProfile] = useUpdateUserProfileMutation()
  const [updateImage] = useUpdateUserImageProfileMutation()
  const [addPost] = useAddPostMutation()
  const [deleteFollowingRelationShip] = useDeleteFollowingRelationShipMutation()

  // --- States ---
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts')
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [isPostDetailsModalOpen, setIsPostDetailsModalOpen] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false)
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false)
  const [likedPostIds, setLikedPostIds] = useState<Record<number, boolean>>({})

  // Form States
  const [about, setAbout] = useState('')
  const [gender, setGender] = useState<number>(0)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // --- Post Details Hooks ---
  const { data: postDetails, refetch: refetchPostDetails } = useGetPostByIdQuery(selectedPostId || 0, { skip: !selectedPostId })
  const [deletePost] = useDeletePostMutation()
  const [likePost] = useLikePostMutation()
  const [addComment] = useAddCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()

  const postsList = myPosts || []
  const savedPostsList = favoritesData?.data || favoritesData || []
  const followersList = Array.isArray(subscribersData) ? subscribersData : subscribersData?.data || []
  const subscriptionsList = Array.isArray(subscriptionsData) ? subscriptionsData : subscriptionsData?.data || []

  const rawAvatar = user?.avatar || user?.image || user?.imagePath
  const avatarUrl = rawAvatar ? (rawAvatar.startsWith('http') ? rawAvatar : `${IMAGE_BASE_URL}/${rawAvatar}`) : '/images/default-avatar.svg'

  const openEditModal = () => {
    setAbout(user?.about || user?.bio || '')
    setGender(user?.gender || 0)
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ about, gender: Number(gender) }).unwrap()
      messageApi.success('Профиль успешно обновлен!')
      setIsEditModalOpen(false)
    } catch (err) {
      messageApi.error('Не удалось обновить профиль')
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const formData = new FormData()
      formData.append('imageFile', file)
      try {
        await updateImage(formData).unwrap()
        messageApi.success('Фото профиля обновлено!')
      } catch (err) {
        messageApi.error('Ошибка загрузки фото')
      }
    }
  }

  const handleCreatePost = async () => {
    if (!selectedFile) {
      messageApi.warning('Пожалуйста, выберите фото')
      return
    }
    const formData = new FormData()
    formData.append('Images', selectedFile) 
    formData.append('Title', postTitle || 'Публикация')
    formData.append('Content', postContent)
    
    try {
      await addPost(formData).unwrap()
      messageApi.success('Публикация добавлена!')
      setIsPostModalOpen(false)
      setSelectedFile(null)
      setPostTitle('')
      setPostContent('')
    } catch (err) {
      messageApi.error('Ошибка публикации')
    }
  }

  const handleDeletePost = async (postId: number) => {
    try {
      await deletePost(postId).unwrap()
      messageApi.success('Пост успешно удален')
      setIsPostDetailsModalOpen(false)
      setSelectedPostId(null)
    } catch (err) {
      messageApi.error('Ошибка удаления поста')
    }
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

  const handleUnsubscribe = async (userId: string) => {
    try {
      await deleteFollowingRelationShip(userId).unwrap()
      messageApi.success('Вы отписались')
      refetchSubscriptions()
    } catch (err) {
      messageApi.error('Не удалось отписаться')
    }
  }

  if (isProfileLoading || isPostsLoading) {
    return (
      <div className="min-h-screen bg-white w-full md:pl-[244px] flex items-center justify-center">
        <Skeleton active paragraph={{ rows: 6 }} className="max-w-[600px] px-4" />
      </div>
    )
  }

  const currentPost = postDetails?.data || postDetails
  const activePostsList = activeTab === 'posts' ? postsList : savedPostsList

  return (
    <div className="min-h-screen bg-white w-full md:pl-[244px] font-sans antialiased text-[#262626]">
      {contextHolder}
      
      <div className="max-w-[935px] mx-auto px-5 py-8">
        
        {/* ХЕДЕР ПРОФИЛЯ (СТРОГО ПО ИНСТАГРАМУ) */}
        <header className="flex flex-row items-start gap-12 md:gap-24 pb-11 border-b border-[#efefef] mb-0">
          {/* Левая колонка - Аватар */}
          <div className="flex-shrink-0 md:w-[290px] flex justify-center">
            <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer w-[80px] h-[80px] sm:w-[150px] sm:h-[150px] rounded-full overflow-hidden border border-[#dbdbdb] bg-[#fafafa]">
              <img src={avatarUrl} alt="my avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[12px] font-semibold">
                <Camera size={20} className="mb-1" />
              </div>
              <input type="file" ref={fileInputRef} hidden onChange={handleAvatarChange} accept="image/*" />
            </div>
          </div>

          {/* Правая колонка - Инфо */}
          <div className="flex-1 flex flex-col gap-5 pt-2">
            {/* Ряд 1: Username + Кнопки */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[20px] font-normal text-[#262626] mr-2">{user?.userName || 'username'}</h2>
              <div className="flex items-center gap-2">
                <button onClick={openEditModal} className="bg-[#efefef] hover:bg-[#dbdbdb] text-black font-semibold text-[14px] px-4 py-1.5 rounded-lg border-none cursor-pointer transition-colors">
                  Редактировать профиль
                </button>
                <button onClick={() => setIsPostModalOpen(true)} className="bg-[#efefef] hover:bg-[#dbdbdb] text-black p-1.5 rounded-lg border-none cursor-pointer flex items-center justify-center">
                  <Plus size={18} />
                </button>
                <button onClick={() => setIsSettingsModalOpen(true)} className="bg-transparent border-none p-1 cursor-pointer flex items-center justify-center hover:opacity-70">
                  <Settings className="w-6 h-6 text-[#262626]" />
                </button>
              </div>
            </div>

            {/* Ряд 2: Статистика */}
            <div className="flex items-center gap-10 text-[16px] text-[#262626]">
              <div><span className="font-semibold">{postsList.length}</span> публикаций</div>
              <div onClick={() => setIsFollowersModalOpen(true)} className="cursor-pointer hover:opacity-70"><span className="font-semibold">{user?.subscribersCount ?? followersList.length}</span> подписчиков</div>
              <div onClick={() => setIsFollowingModalOpen(true)} className="cursor-pointer hover:opacity-70"><span className="font-semibold">{user?.subscriptionsCount ?? subscriptionsList.length}</span> подписок</div>
            </div>

            {/* Ряд 3: Имя и Описание */}
            <div className="text-[14px]">
              <h1 className="font-semibold text-black mb-1">{user?.fullName || 'Имя не указано'}</h1>
              {user?.about && <p className="whitespace-pre-wrap font-normal text-[#262626]">{user.about}</p>}
            </div>
          </div>
        </header>

        {/* ТАБЫ */}
        <div className="flex justify-center gap-14 border-t border-[#efefef]">
          <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === 'posts' ? 'border-black text-black font-bold' : 'border-transparent text-[#8e8e8e]'}`}><Grid className="w-3 h-3" /> Публикации</button>
          <button onClick={() => setActiveTab('saved')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === 'saved' ? 'border-black text-black font-bold' : 'border-transparent text-[#8e8e8e]'}`}><Bookmark className="w-3 h-3" /> Сохранения</button>
        </div>

        {/* СЕТКА ПОСТОВ (ЧИСТЫЙ INSTAGRAM STYLE) */}
        <div className="mt-2">
          {activePostsList.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 md:gap-7">
              {activePostsList.map((post: any) => {
                const pImg = post.images?.[0] ? (post.images[0].startsWith('http') ? post.images[0] : `${IMAGE_BASE_URL}/${post.images[0]}`) : '/images/default-avatar.svg';
                return (
                  <div key={post.id || post.postId} onClick={() => { setSelectedPostId(post.id || post.postId); setIsPostDetailsModalOpen(true); }} className="relative aspect-square bg-[#fafafa] overflow-hidden group cursor-pointer">
                    <img src={pImg} alt="post" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white gap-6 font-semibold">
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
                <Camera size={32} />
              </div>
              <h3 className="text-[28px] font-extrabold mb-2">Поделиться фото</h3>
              <p className="text-gray-500 text-[14px] max-w-[350px] mb-4">Фото, которыми вы делитесь, будут показываться в вашем профиле.</p>
              <button onClick={() => setIsPostModalOpen(true)} className="text-[#0095f6] hover:text-[#1877f2] font-bold text-[14px] bg-transparent border-none cursor-pointer">Поделись своим первым фото</button>
            </div>
          )}
        </div>

        {/* МОДАЛКА НАСТРОЕК */}
        <Modal open={isSettingsModalOpen} onCancel={() => setIsSettingsModalOpen(false)} footer={null} closable={false} width={400} centered styles={{ body: { padding: 0 } }}>
          <div className="flex flex-col text-center text-[14px] select-none divide-y divide-[#efefef]">
            <button onClick={() => { setIsSettingsModalOpen(false); router.push('/settings'); }} className="py-3.5 bg-transparent text-black border-none cursor-pointer hover:bg-gray-50 font-normal">Приложения и сайты</button>
            <button onClick={() => { setIsSettingsModalOpen(false); router.push('/settings'); }} className="py-3.5 bg-transparent text-black border-none cursor-pointer hover:bg-gray-50 font-normal">QR-код</button>
            <button onClick={() => { setIsSettingsModalOpen(false); router.push('/settings'); }} className="py-3.5 bg-transparent text-black border-none cursor-pointer hover:bg-gray-50 font-normal">Уведомления</button>
            <button onClick={() => { setIsSettingsModalOpen(false); router.push('/settings'); }} className="py-3.5 bg-transparent text-black border-none cursor-pointer hover:bg-gray-50 font-semibold">Настройки и конфиденциальность</button>
            <button onClick={() => { setIsSettingsModalOpen(false); router.push('/settings'); }} className="py-3.5 bg-transparent text-black border-none cursor-pointer hover:bg-gray-50 font-normal">Meta Verified</button>
            <button onClick={() => { setIsSettingsModalOpen(false); router.push('/settings'); }} className="py-3.5 bg-transparent text-black border-none cursor-pointer hover:bg-gray-50 font-normal">Родительский контроль</button>
            <button onClick={() => { setIsSettingsModalOpen(false); router.push('/settings'); }} className="py-3.5 bg-transparent text-black border-none cursor-pointer hover:bg-gray-50 font-normal">Входы в аккаунт</button>
            <button className="py-3.5 bg-transparent text-red-500 font-bold border-none cursor-pointer hover:bg-gray-50">Выйти</button>
            <button onClick={() => setIsSettingsModalOpen(false)} className="py-3.5 bg-transparent text-black border-none cursor-pointer hover:bg-gray-50 rounded-b-lg">Отмена</button>
          </div>
        </Modal>

        {/* ПРОСМОТР ДЕТАЛЕЙ ПОСТА */}
        <Modal 
          open={isPostDetailsModalOpen} 
          onCancel={() => { setIsPostDetailsModalOpen(false); setSelectedPostId(null); }} 
          width={1100} footer={null} centered styles={{ body: { padding: 0 } }}
          closeIcon={<X className="text-white fixed right-4 top-4 w-6 h-6" />}
        >
          {currentPost && (
            <div className="flex flex-col md:flex-row h-[85vh] md:h-[650px] bg-white overflow-hidden rounded-md">
              {/* Левая часть: Изображение */}
              <div className="w-full md:w-[55%] bg-black flex items-center justify-center h-[45%] md:h-full">
                <img 
                  src={currentPost?.images?.[0] ? (currentPost.images[0].startsWith('http') ? currentPost.images[0] : `${IMAGE_BASE_URL}/${currentPost.images[0]}`) : '/images/default-avatar.svg'}
                  alt="Post content" className="w-full h-full object-contain"
                />
              </div>

              {/* Правая часть: Комментарии и информация */}
              <div className="w-full md:w-[45%] flex flex-col h-[55%] md:h-full bg-white text-black">
                {/* Хедер модалки */}
                <div className="flex items-center justify-between p-4 border-b border-[#efefef]">
                  <div className="flex items-center gap-3">
                    <Avatar src={avatarUrl} size="small" />
                    <span className="font-semibold text-[14px]">{user?.userName}</span>
                  </div>
                  <button onClick={() => handleDeletePost(selectedPostId!)} className="text-red-500 bg-transparent border-none cursor-pointer p-1 hover:bg-red-50 rounded transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Основной блок с прокруткой комментов */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white text-[14px]">
                  {currentPost?.content && (
                    <div className="flex gap-3 items-start pb-3 border-b border-[#fafafa]">
                      <Avatar src={avatarUrl} size="small" className="flex-shrink-0" />
                      <div><span className="font-semibold mr-2">{user?.userName}</span><span className="text-[#262626]">{currentPost.content}</span></div>
                    </div>
                  )}
                  {currentPost?.comments?.map((comment: any) => {
                    const commentAuthor = comment.userName || 'User';
                    return (
                      <div key={comment.postCommentId} className="flex gap-3 items-start text-[13px] justify-between group">
                        <div className="flex gap-3 items-start flex-1">
                          <div className="w-7 h-7 rounded-full bg-[#efefef] flex items-center justify-center font-bold text-gray-500 uppercase text-[10px] flex-shrink-0">{commentAuthor.charAt(0)}</div>
                          <div className="flex-1">
                            <span className="font-semibold mr-1.5">{commentAuthor}</span>
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

                {/* Блок Лайков и иконок */}
                <div className="p-4 border-t border-[#efefef] bg-white">
                  <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => handleLikePost(selectedPostId!)} className="bg-transparent border-none p-0 cursor-pointer hover:opacity-70">
                      <Heart size={24} className={likedPostIds[selectedPostId!] || currentPost?.postLike ? "text-red-500 fill-red-500" : "text-black"} />
                    </button>
                    <MessageCircle size={24} className="text-black cursor-pointer hover:opacity-70" />
                    <Share2 size={24} className="text-black cursor-pointer hover:opacity-70" />
                  </div>
                  <div className="font-semibold text-[14px]">{currentPost?.postLikeCount || 0} отметок «Нравится»</div>
                </div>

                {/* Добавить комментарий */}
                <div className="p-3 border-t border-[#efefef] flex items-center gap-2 bg-white">
                  <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Добавьте комментарий..." bordered={false} className="flex-1 text-[14px]" onPressEnter={() => handleAddComment(selectedPostId!)} />
                  <button onClick={() => handleAddComment(selectedPostId!)} disabled={!commentText.trim()} className="text-[#0095f6] font-semibold text-[14px] bg-transparent border-none cursor-pointer disabled:opacity-40">Опубликовать</button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Остальные модалки (Редактирование, добавление, подписчики) */}
        <Modal title="Редактировать профиль" open={isEditModalOpen} onOk={handleSaveProfile} onCancel={() => setIsEditModalOpen(false)} okText="Сохранить" cancelText="Отмена" centered>
          <div className="flex flex-col gap-4 pt-3">
            <div><span className="block text-[14px] font-semibold mb-1">О себе</span><TextArea rows={3} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Расскажите о себе..." /></div>
            <div><span className="block text-[14px] font-semibold mb-1">Пол</span>
              <Select value={gender} onChange={(value) => setGender(value)} className="w-full" options={[{ value: 0, label: 'Не указан' }, { value: 1, label: 'Мужской' }, { value: 2, label: 'Женский' }]} />
            </div>
          </div>
        </Modal>

        <Modal title="Создать публикацию" open={isPostModalOpen} onOk={handleCreatePost} onCancel={() => setIsPostModalOpen(false)} okText="Поделиться" cancelText="Отмена" centered>
          <div className="flex flex-col gap-3 pt-2">
            <Input placeholder="Заголовок" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} />
            <TextArea placeholder="Описание публикации..." rows={3} value={postContent} onChange={(e) => setPostContent(e.target.value)} />
            <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="mt-2 text-[14px]" />
          </div>
        </Modal>

        <Modal title="Подписчики" open={isFollowersModalOpen} onCancel={() => setIsFollowersModalOpen(false)} footer={null} centered>
          <div className="max-h-[400px] overflow-y-auto flex flex-col gap-3">
            {followersList.map((f: any) => (
              <div key={f.id || f.userId} className="flex items-center justify-between p-1">
                <div className="flex items-center gap-3">
                  <Avatar src={f.avatar ? `${IMAGE_BASE_URL}/${f.avatar}` : undefined} icon={<User />} />
                  <div className="flex flex-col"><span className="font-semibold text-[14px]">{f.userName || 'user'}</span><span className="text-gray-400 text-[12px]">{f.fullName}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Modal>

        <Modal title="Подписки" open={isFollowingModalOpen} onCancel={() => setIsFollowingModalOpen(false)} footer={null} centered>
          <div className="max-h-[400px] overflow-y-auto flex flex-col gap-3">
            {subscriptionsList.map((f: any) => (
              <div key={f.id || f.userId} className="flex items-center justify-between p-1">
                <div className="flex items-center gap-3">
                  <Avatar src={f.avatar ? `${IMAGE_BASE_URL}/${f.avatar}` : undefined} icon={<User />} />
                  <div className="flex flex-col"><span className="font-semibold text-[14px]">{f.userName || 'user'}</span><span className="text-gray-400 text-[12px]">{f.fullName}</span></div>
                </div>
                <button onClick={() => handleUnsubscribe(f.userId || f.id)} className="bg-gray-100 hover:bg-gray-200 text-black border-none text-[12px] font-semibold px-3 py-1.5 rounded cursor-pointer transition-colors">Отписаться</button>
              </div>
            ))}
          </div>
        </Modal>

      </div>
    </div>
  )
}