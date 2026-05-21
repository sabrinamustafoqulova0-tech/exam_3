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
} from '../../services/Profile'
import { useState, useRef } from 'react'
import { Modal, Input, message, Skeleton, Avatar } from 'antd'
import { Grid, Bookmark, Clapperboard, Settings, Camera, Plus, User, Heart, MessageCircle } from 'lucide-react'

const { TextArea } = Input
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGES || 'https://instagram-api.softclub.tj/images'

export default function MyProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [messageApi, contextHolder] = message.useMessage()

  // --- API Hooks ---
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfileQuery(undefined)
  const { data: myPosts, isLoading: isPostsLoading } = useGetMyPostsQuery(undefined)
  const [updateProfile, { isLoading: isUpdatingInfo }] = useUpdateUserProfileMutation()
  const [updateImage, { isLoading: isUploadingImg }] = useUpdateUserImageProfileMutation()
  const [addPost, { isLoading: isAddingPost }] = useAddPostMutation()

  // --- States ---
  const [activeTab, setActiveTab] = useState('1')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [isPostDetailsModalOpen, setIsPostDetailsModalOpen] = useState(false)
  const [commentText, setCommentText] = useState('')

  // Form States
  const [about, setAbout] = useState('')
  const [gender, setGender] = useState<number>(0)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // --- API Calls for Post Details ---
  const { data: postDetails } = useGetPostByIdQuery(selectedPostId || 0, { skip: !selectedPostId })
  const [deletePost] = useDeletePostMutation()
  const [likePost] = useLikePostMutation()
  const [addComment] = useAddCommentMutation()

  const user = profile?.data || profile
  const postsList = myPosts || []

  const rawAvatar = user?.avatar || user?.image || user?.imagePath
  const avatarUrl = rawAvatar 
    ? (rawAvatar.startsWith('http') ? rawAvatar : `${IMAGE_BASE_URL}/${rawAvatar}`)
    : '/images/default-avatar.svg'

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
      messageApi.success('Пост удален')
      setIsPostDetailsModalOpen(false)
      setSelectedPostId(null)
    } catch (err) {
      messageApi.error('Ошибка удаления поста')
    }
  }

  const handleLikePost = async (postId: number) => {
    try {
      await likePost(postId).unwrap()
      messageApi.success('Лайк добавлен')
    } catch (err) {
      messageApi.error('Ошибка добавления лайка')
    }
  }

  const handleAddComment = async (postId: number) => {
    if (!commentText.trim()) {
      messageApi.warning('Напишите комментарий')
      return
    }
    try {
      await addComment({ postId, commentText: commentText }).unwrap()
      messageApi.success('Комментарий добавлен')
      setCommentText('')
    } catch (err) {
      messageApi.error('Ошибка добавления комментария')
    }
  }

  const openPostModal = (postId: number) => {
    setSelectedPostId(postId)
    setIsPostDetailsModalOpen(true)
  }

  if (isProfileLoading || isPostsLoading) {
    return (
      <div className="min-h-screen bg-white w-full md:pl-[244px] px-5 py-10">
        <div className="max-w-[935px] mx-auto">
          <Skeleton.Avatar active size={150} shape="circle" />
          <Skeleton active className="mt-5" paragraph={{ rows: 4 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white w-full md:pl-[244px] font-sans antialiased text-[#262626]">
      {contextHolder}
      
      <div className="max-w-[975px] mx-auto px-5 py-8">
        
        {/* ХЕДЕР */}
        <header className="flex flex-col sm:flex-row items-stretch gap-8 sm:gap-24 pb-11 border-b border-[#dbdbdb] mb-0">
          <div className="flex justify-center items-center sm:w-[290px] flex-shrink-0">
            <div onClick={() => !isUploadingImg && fileInputRef.current?.click()} className="relative group cursor-pointer w-[150px] h-[150px] rounded-full overflow-hidden border border-[#dbdbdb] bg-[#fafafa]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.userName || 'avatar'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/default-avatar.svg'
                  }}
                />
              ) : (
                <Avatar icon={<User size={60} className="text-[#8e8e8e]" />} className="w-full h-full flex items-center justify-center bg-[#fafafa]" />
              )}
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[12px] font-semibold">
                <Camera size={20} className="mb-1" />
                <span>Изменить фото</span>
              </div>
              <input type="file" ref={fileInputRef} hidden onChange={handleAvatarChange} accept="image/*" />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-5 pt-1">
            <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start">
              <h2 className="text-[20px] font-light text-[#262626] tracking-wide">{user?.userName || 'username'}</h2>
              <div className="flex items-center gap-2">
                <button onClick={openEditModal} className="bg-[#efefef] hover:bg-[#dbdbdb] transition-colors text-[14px] font-semibold px-4 py-1.5 rounded-lg border-none cursor-pointer">Редактировать профиль</button>
                <button onClick={() => setIsPostModalOpen(true)} className="bg-[#0095f6] hover:bg-[#1877f2] transition-colors text-[14px] font-semibold text-white px-4 py-1.5 rounded-lg border-none cursor-pointer flex items-center gap-1"><Plus size={16} /> Создать</button>
              </div>
              <Settings className="w-6 h-6 text-[#262626] cursor-pointer hover:opacity-70" />
            </div>

            <div className="hidden sm:flex items-center gap-10 text-[16px]">
              <div>Публикаций: <span className="font-semibold">{postsList.length}</span></div>
              <div>Подписчики: <span className="font-semibold">{user?.subscribersCount || 0}</span></div>
              <div>Подписки: <span className="font-semibold">{user?.subscriptionsCount || 0}</span></div>
            </div>

            <div className="text-center sm:text-left text-[14px]">
              <h1 className="font-semibold">{user?.fullName || 'Имя не указано'}</h1>
              <p className="whitespace-pre-wrap font-normal mt-1 text-[#262626]">{user?.about || ''}</p>
            </div>
          </div>
        </header>

        {/* ТАБЫ */}
        <div className="flex justify-center gap-14 border-t border-[#dbdbdb]">
          <button onClick={() => setActiveTab('1')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === '1' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'}`}><Grid size={12} /> Публикации</button>
          <button onClick={() => setActiveTab('2')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === '2' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'}`}><Clapperboard size={12} /> Reels</button>
          <button onClick={() => setActiveTab('3')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === '3' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'}`}><Bookmark size={12} /> Сохраненное</button>
        </div>

        {/* СЕТКА С РЕАЛЬНЫМИ ФОТОГРАФИЯМИ С СЕРВЕРА */}
        <div className="mt-4">
          {activeTab === '1' && (
            postsList.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 sm:gap-7">
                {postsList.map((post: any) => {
                  const postImg = post.images?.[0]
                    ? (post.images[0].startsWith('http') ? post.images[0] : `${IMAGE_BASE_URL}/${post.images[0]}`)
                    : '/images/default-avatar.svg'
                  return (
                    <div key={post.postId} onClick={() => openPostModal(post.postId)} className="relative aspect-square bg-[#fafafa] overflow-hidden group cursor-pointer border border-[#dbdbdb]">
                      <img src={postImg} alt={post.title} className="w-full h-full object-cover" />
                      {/* Ховер-эффект в стиле Instagram */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white gap-6 font-semibold">
                        <div className="flex items-center gap-1"><Heart fill="white" size={20} /> {post.postLikeCount || 0}</div>
                        <div className="flex items-center gap-1"><MessageCircle fill="white" size={20} /> {post.commentCount || 0}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="p-4 border-[2px] border-[#262626] rounded-full mb-5"><Grid size={32} /></div>
                <h3 className="text-[32px] font-black">Поделитесь фото</h3>
              </div>
            )
          )}
          {activeTab === '2' && <div className="text-center py-24 text-gray-400">Нет видео Reels</div>}
          {activeTab === '3' && <div className="text-center py-24 text-gray-400">Только вы можете видеть сохраненное</div>}
        </div>

        {/* МОДАЛКИ (Остаются без изменений) */}
        <Modal title={<div className="text-center font-semibold text-[16px] py-1">Редактировать профиль</div>} open={isEditModalOpen} onOk={handleSaveProfile} onCancel={() => setIsEditModalOpen(false)} confirmLoading={isUpdatingInfo} okText="Сохранить" cancelText="Отмена" centered styles={{ body: { padding: '0' } }}>
          <div className="p-6 flex flex-col gap-5 bg-white">
            <div>
              <label className="text-[14px] font-semibold block mb-2">О себе</label>
              <TextArea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Расскажите о себе..." rows={4} maxLength={150} showCount className="rounded-md" />
            </div>
            <div>
              <label className="text-[14px] font-semibold block mb-2">Пол</label>
              <select value={gender} onChange={(e) => setGender(Number(e.target.value))} className="w-full rounded-md py-2 px-3 border border-[#dbdbdb] bg-[#fafafa]">
                <option value={0}>Не указан</option>
                <option value={1}>Мужской</option>
                <option value={2}>Женский</option>
              </select>
            </div>
          </div>
        </Modal>

        <Modal title={<div className="text-center font-semibold text-[16px] py-1">Создание публикации</div>} open={isPostModalOpen} onOk={handleCreatePost} onCancel={() => setIsPostModalOpen(false)} confirmLoading={isAddingPost} okText="Поделиться" cancelText="Отмена" centered styles={{ body: { padding: '0' } }}>
          <div className="flex flex-col md:flex-row min-h-[400px] bg-white">
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fafafa]">
              <input type="file" id="modal-file-upload" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" accept="image/*" />
              <label htmlFor="modal-file-upload" className="flex flex-col items-center justify-center cursor-pointer text-center">
                <span className="bg-[#0095f6] text-white px-4 py-1.5 rounded-lg font-semibold">Выбрать файл</span>
              </label>
              {selectedFile && <div className="mt-4 p-2 text-xs text-gray-500">✓ {selectedFile.name}</div>}
            </div>
            <div className="w-full md:w-[280px] p-4 flex flex-col gap-4">
              <Input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Заголовок..." />
              <TextArea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder="Подпись..." rows={6} className="resize-none" />
            </div>
          </div>
        </Modal>

        {/* МОДАЛ ДЛЯ ПРОСМОТРА ДЕТАЛЕЙ ПОСТА */}
        <Modal 
          title={<div className="text-center font-semibold text-[16px] py-1">Пост</div>} 
          open={isPostDetailsModalOpen} 
          onCancel={() => {
            setIsPostDetailsModalOpen(false)
            setSelectedPostId(null)
            setCommentText('')
          }} 
          width={800}
          footer={null}
          centered
        >
          {postDetails && (
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4">
              {/* Изображение поста */}
              <div className="flex-1">
                <img 
                  src={postDetails?.data?.images?.[0] ? (postDetails.data.images[0].startsWith('http') ? postDetails.data.images[0] : `${IMAGE_BASE_URL}/${postDetails.data.images[0]}`) : '/images/default-avatar.svg'}
                  alt="Post"
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>

              {/* Информация о посте */}
              <div className="flex-1 flex flex-col gap-3 max-h-[500px] overflow-y-auto">
                <div className="flex justify-between items-center pb-3 border-b">
                  <h3 className="font-semibold text-[16px]">{postDetails?.data?.title || 'Пост'}</h3>
                  <button 
                    onClick={() => handleDeletePost(selectedPostId!)}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold"
                  >
                    Удалить
                  </button>
                </div>

                <p className="text-[14px] text-[#262626]">{postDetails?.data?.content || ''}</p>

                {/* Лайки */}
                <div className="flex items-center gap-4 py-2 border-b">
                  <button 
                    onClick={() => handleLikePost(selectedPostId!)}
                    className="flex items-center gap-1 text-[14px] hover:text-red-500 transition"
                  >
                    <Heart size={18} /> Лайк ({postDetails?.data?.postLikeCount || 0})
                  </button>
                </div>

                {/* Комментарии */}
                <div className="flex-1">
                  <h4 className="font-semibold text-[14px] mb-2">Комментарии ({postDetails?.data?.comments?.length || 0})</h4>
                  <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto mb-3">
                    {postDetails?.data?.comments && postDetails.data.comments.length > 0 ? (
                      postDetails.data.comments.map((comment: any) => (
                        <div key={comment.id} className="text-[13px] p-2 bg-[#fafafa] rounded">
                          <span className="font-semibold">{comment.userName || 'User'}:</span> {comment.text || comment.commentText}
                        </div>
                      ))
                    ) : (
                      <p className="text-[13px] text-[#8e8e8e]">Нет комментариев</p>
                    )}
                  </div>

                  {/* Добавление комментария */}
                  <div className="flex gap-2">
                    <Input 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Добавить комментарий..."
                      onPressEnter={() => handleAddComment(selectedPostId!)}
                    />
                    <button 
                      onClick={() => handleAddComment(selectedPostId!)}
                      className="bg-[#0095f6] text-white px-3 py-1 rounded font-semibold text-[12px] hover:bg-[#1877f2]"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </div>
  )
}