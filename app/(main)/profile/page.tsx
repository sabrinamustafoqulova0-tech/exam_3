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
  useDeleteFollowingRelationShipMutation,
  useGetMyStoriesQuery,
  useLikeStoryMutation,
  useAddStoryViewMutation,
  useAddStoriesMutation,
  useDeleteStoryMutation
} from '../../services/Profile' // Убедись, что путь к файлу profile.ts указан правильно
import { Grid, Heart, MessageCircle, Bookmark, Share2, X, Trash2, User, Settings, Plus, Camera } from 'lucide-react'
import { useState, useRef, ChangeEvent, useEffect, useMemo } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye'
import SendIcon from '@mui/icons-material/Send'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import { Skeleton, message, Modal, Input, Avatar, Select } from 'antd'

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGES || 'https://instagram-api.softclub.tj/images'

const STORY_DURATION = 5000;
const SEEN_STORAGE_KEY = "seen_my_story_ids";

const getPersistedSeenStories = (): Record<number, boolean> => {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistSeenStory = (storyId: number) => {
  try {
    const current = getPersistedSeenStories();
    current[storyId] = true;
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
};

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
  
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [savedNote, setSavedNote] = useState('')
  
  const [commentText, setCommentText] = useState('')
  const [likedPostIds, setLikedPostIds] = useState<Record<number, boolean>>({})

  // --- Stories UI state & handlers ---
  const [storiesModalOpen, setStoriesModalOpen] = useState(false)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const storyFileInputRef = useRef<HTMLInputElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [viewCounts, setViewCounts] = useState<Record<number, number>>({})
  const [seenStories, setSeenStories] = useState<Record<number, boolean>>(() => getPersistedSeenStories())

  useEffect(() => {
    setSeenStories(getPersistedSeenStories());
  }, []);

  // --- RTK Query: Получение данных ---
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfileQuery(undefined)
  const { data: myPostsData, isLoading: isPostsLoading } = useGetMyPostsQuery(undefined)
  const { data: favoritesData, isLoading: isFavoritesLoading } = useGetPostFavoritesQuery({ PageNumber: 1, PageSize: 50 }, { skip: activeTab !== 'saved' })
  const { data: subscribersData } = useGetSubscribersQuery('')
  const { data: subscriptionsData } = useGetSubscriptionsQuery('')
  const { data: postDetails, refetch: refetchPostDetails } = useGetPostByIdQuery(selectedPostId || 0, { skip: !selectedPostId })
  // --- RTK Query: Stories ---
  const { data: myStoriesData, isLoading: isStoriesLoading } = useGetMyStoriesQuery(undefined)
  
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
  // Stories mutations
  const [likeStory] = useLikeStoryMutation()
  const [addStoryView] = useAddStoryViewMutation()
  const [addStories] = useAddStoriesMutation()
  const [deleteStory] = useDeleteStoryMutation()

  // --- Stories logic & effect (Moved up to follow Rules of Hooks) ---
  const myStoriesList = Array.isArray(myStoriesData)
    ? myStoriesData
    : Array.isArray(myStoriesData?.data)
    ? myStoriesData.data
    : []

  const markStoryAsSeen = (storyId: number) => {
    setSeenStories((prev) => {
      if (prev[storyId]) return prev;
      const updated = { ...prev, [storyId]: true };
      return updated;
    });
    persistSeenStory(storyId);
  };

  const goNextStory = () => {
    if (activeStoryIndex < myStoriesList.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else {
      setStoriesModalOpen(false);
    }
  };

  const goPrevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (!storiesModalOpen || !myStoriesList[activeStoryIndex]) return;
    const currentId = myStoriesList[activeStoryIndex].id || myStoriesList[activeStoryIndex].storyId;
    if (currentId) {
      markStoryAsSeen(currentId);
      addStoryView(currentId).unwrap().then(() => {
        setViewCounts(prev => ({
          ...prev,
          [currentId]: (prev[currentId] ?? myStoriesList[activeStoryIndex].viewCount ?? 0) + 1
        }));
      }).catch(() => {});
    }
    const timer = setTimeout(() => { goNextStory(); }, STORY_DURATION);
    return () => clearTimeout(timer);
  }, [storiesModalOpen, activeStoryIndex, myStoriesList.length]);

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

  const openNoteModal = () => {
    setNoteText(savedNote || '')
    setIsNoteModalOpen(true)
  }

  const handleSaveNote = () => {
    if (!noteText.trim()) {
      messageApi.error('Введите текст заметки')
      return
    }
    setSavedNote(noteText.trim())
    setIsNoteModalOpen(false)
    messageApi.success('Заметка сохранена')
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

  const isVideoFile = (path?: string | null) => {
    return !!path && /\.(mp4|webm|ogg|mov|mkv|m4v)$/i.test(path.split('?')[0])
  }

  const currentStory = myStoriesList?.[activeStoryIndex]
  const currentStoryMediaPath = currentStory?.image || currentStory?.file || currentStory?.media || currentStory?.storyMedia || currentStory?.storyFile
  const currentStoryMediaUrl = currentStoryMediaPath ? (currentStoryMediaPath.startsWith('http') ? currentStoryMediaPath : `${IMAGE_BASE_URL}/${currentStoryMediaPath}`) : ''
  
  const currentStoryViews = currentStory 
    ? (viewCounts[currentStory.id || currentStory.storyId] ?? currentStory.viewCount ?? 0) 
    : 0;

  const openStories = (index: number) => {
    setActiveStoryIndex(index)
    setStoriesModalOpen(true)
  }

  const handleStoryFilesChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const form = new FormData()
    Array.from(files).forEach((f) => form.append('files', f))
    try {
      await addStories(form).unwrap()
      messageApi.success('Сторис добавлен')
    } catch (err) {
      messageApi.error('Ошибка загрузки')
    } finally {
      if (storyFileInputRef.current) storyFileInputRef.current.value = ''
    }
  }

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
          <div className="flex-shrink-0 md:w-[290px] flex justify-center relative">
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-10">
              <button onClick={openNoteModal} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#dbdbdb] shadow-sm text-[13px] font-semibold text-[#262626] hover:bg-[#f7f7f7]">
                <MessageCircle className="w-4 h-4" />
                {savedNote ? (savedNote.length > 22 ? `${savedNote.slice(0, 22)}...` : savedNote) : 'Новая заметка'}
              </button>
            </div>
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

        {/* СТОРИС ЛЕНТА */}
        <div className="mt-6 mb-2">
          <div className="flex items-center gap-4 overflow-x-auto py-2 px-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <button onClick={() => storyFileInputRef.current?.click()} className="w-16 h-16 rounded-full bg-white border border-[#dbdbdb] flex items-center justify-center hover:scale-105 transition-transform">
                <Plus size={18} />
              </button>
              <input ref={storyFileInputRef} type="file" accept="image/*,video/*" multiple onChange={handleStoryFilesChange} className="hidden" />
            </div>

            {myStoriesList && myStoriesList.length > 0 ? myStoriesList.map((s: any, idx: number) => {
              const isSeen = seenStories[s.id || s.storyId];
              return (
                <button 
                  key={s.id || s.storyId || idx} 
                  onClick={() => openStories(idx)} 
                  className={`w-16 h-16 rounded-full p-[2px] flex-shrink-0 transition-all ${isSeen ? 'bg-gray-200' : 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600'}`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white">
                    <img src={avatar} alt={`story-${idx}`} className="w-full h-full object-cover" />
                  </div>
                </button>
            )}) : (
              <div className="text-sm text-gray-400">У вас пока нет сторис</div>
            )}
          </div>
        </div>

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
                const mediaIsVideo = isVideoFile(mediaFile)

                return (
                  <div key={post.postId || post.id} onClick={() => openPostModal(post.postId || post.id)} className="relative aspect-square bg-black overflow-hidden group cursor-pointer border border-[#efefef]">
                    {mediaIsVideo ? (
                      <video src={pMedia} className="w-full h-full object-cover" controls playsInline muted loop />
                    ) : (
                      <img src={pMedia} alt="post" className="w-full h-full object-cover" />
                    )}
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

        {/* МОДАЛКА ПРОСМОТРА СТОРИС */}
        <Modal
          open={storiesModalOpen}
          onCancel={() => setStoriesModalOpen(false)}
          footer={null}
          centered
          width={540}
          closeIcon={<CloseIcon className="text-white" />}
          styles={{ body: { padding: 0, backgroundColor: 'black' } }}
        >
          <div className="relative w-full aspect-[9/16] bg-black flex flex-col overflow-hidden select-none">
            
            {/* Бэкграунд блюр */}
            <div className="absolute inset-0 z-0 opacity-50 blur-3xl scale-110 pointer-events-none">
              {isVideoFile(currentStoryMediaUrl) ? (
                <video src={currentStoryMediaUrl} className="w-full h-full object-cover" muted />
              ) : (
                <img src={currentStoryMediaUrl} className="w-full h-full object-cover" alt="" />
              )}
            </div>

            {/* Контент сторис */}
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              {isVideoFile(currentStoryMediaUrl) ? (
                <video 
                  src={currentStoryMediaUrl} 
                  autoPlay 
                  muted={isMuted} 
                  className="w-full h-full object-contain" 
                  playsInline 
                />
              ) : (
                <img src={currentStoryMediaUrl} alt="story" className="w-full h-full object-contain" />
              )}
            </div>

            {/* Хедер: Прогресс-бары и инфо */}
            <div className="relative z-20 w-full p-3 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex gap-1 mb-3">
                {myStoriesList.map((_: any, index: number) => (
                  <div key={index} className="h-[2px] flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300 ease-linear"
                      style={{ width: index < activeStoryIndex ? "100%" : index === activeStoryIndex ? "100%" : "0%" }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <Avatar src={avatar} size="small" className="border border-white/20" />
                  <span className="font-semibold text-[14px]">{username}</span>
                  <span className="text-[12px] text-white/60">Ваша история</span>
                </div>

                {isVideoFile(currentStoryMediaUrl) && (
                  <button onClick={() => setIsMuted(!isMuted)} className="text-white/90 p-1">
                    {isMuted ? <VolumeOffIcon sx={{ fontSize: 20 }} /> : <VolumeUpIcon sx={{ fontSize: 20 }} />}
                  </button>
                )}
              </div>
            </div>

            {/* Навигация (прозрачные зоны для клика) */}
            <div className="absolute inset-0 z-10 flex">
              <div onClick={goPrevStory} className="w-1/4 h-full cursor-pointer" />
              <div className="w-2/4 h-full" />
              <div onClick={goNextStory} className="w-1/4 h-full cursor-pointer" />
            </div>

            {/* Стрелки (Desktop) */}
            <button 
              onClick={goPrevStory} 
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 p-1.5 rounded-full text-white transition-all ${activeStoryIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <ChevronLeftIcon />
            </button>
            <button 
              onClick={goNextStory} 
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 p-1.5 rounded-full text-white transition-all"
            >
              <ChevronRightIcon />
            </button>

            {/* Футер */}
            <div className="mt-auto relative z-20 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
              {currentStoryViews > 0 && (
                <div className="flex items-center gap-1.5 text-white/90 text-[12px] font-medium mb-3">
                  <RemoveRedEyeIcon sx={{ fontSize: 16 }} />
                  <span>Просмотрено: {currentStoryViews}</span>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="flex-1 border border-white/40 rounded-full px-4 py-1.5 text-white/60 text-sm">
                  Реакции на историю
                </div>
                <button 
                  onClick={async () => {
                    if (!currentStory) return;
                    try {
                      await likeStory(currentStory.id || currentStory.storyId).unwrap();
                      messageApi.success('Обновлено');
                    } catch { messageApi.error('Ошибка'); }
                  }} 
                  className="text-white"
                >
                {currentStory?.isLiked ? (
                  <FavoriteIcon className="text-red-500" />
                ) : (
                  <FavoriteBorderIcon />
                )}
                </button>
                <SendIcon className="text-white -rotate-12" />
              </div>
            </div>
          </div>
        </Modal>

        <Modal
          title={<div className="text-center font-bold text-[16px] border-b border-gray-100 pb-3 -mx-6">Новая заметка</div>}
          open={isNoteModalOpen}
          onCancel={() => setIsNoteModalOpen(false)}
          okText="Сохранить"
          cancelText="Отмена"
          onOk={handleSaveNote}
          centered
          width={450}
        >
          <div className="flex flex-col gap-4 pt-4">
            <Input.TextArea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Введите текст заметки..."
              autoSize={{ minRows: 4, maxRows: 8 }}
              className="text-[14px]"
            />
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
                {isVideoFile(currentPost?.images?.[0]) ? (
                  <video src={modalMediaUrl} controls className="w-full h-full object-contain" playsInline />
                ) : (
                  <img src={modalMediaUrl} alt="Post content" className="w-full h-full object-contain" />
                )}
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
                      <div key={cid} className="flex gap-3 items-start text-[13px] justify-between group">
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