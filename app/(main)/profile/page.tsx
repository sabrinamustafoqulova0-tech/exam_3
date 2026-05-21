'use client'
import { 
  useGetMyProfileQuery, 
  useUpdateUserProfileMutation, 
  useUpdateUserImageProfileMutation,
  useAddPostMutation 
} from '../../services/Profile'
import { useState, useRef } from 'react'
import { Modal, Input, message, Skeleton, Avatar } from 'antd'
import { Grid, Bookmark, Clapperboard, Settings, Camera, Plus, User } from 'lucide-react'

const { TextArea } = Input

export default function MyProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [messageApi, contextHolder] = message.useMessage()

  // --- API Hooks ---
  const { data: profile, isLoading, refetch } = useGetMyProfileQuery(undefined)
  const [updateProfile, { isLoading: isUpdatingInfo }] = useUpdateUserProfileMutation()
  const [updateImage, { isLoading: isUploadingImg }] = useUpdateUserImageProfileMutation()
  const [addPost, { isLoading: isAddingPost }] = useAddPostMutation()

  // --- States ---
  const [activeTab, setActiveTab] = useState('1')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false)

  // Form States
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [postCaption, setPostCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const user = profile?.data || profile
  const avatarUrl = user?.avatar || user?.imagePath || '/images/default-avatar.svg'

  const openEditModal = () => {
    setFullName(user?.fullName || '')
    setBio(user?.bio || '')
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        fullName,
        bio,
        userName: user?.userName,
      }).unwrap()
      messageApi.success('Профиль успешно обновлен!')
      setIsEditModalOpen(false)
      refetch()
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
        refetch()
      } catch (err) {
        messageApi.error('Ошибка загрузки фото')
      }
    }
  }

  const handleCreatePost = async () => {
    if (!selectedFile) {
      messageApi.warning('Пожалуйста, выберите файл')
      return
    }
    const formData = new FormData()
    formData.append('Images', selectedFile)
    formData.append('Description', postCaption)
    
    try {
      await addPost(formData).unwrap()
      messageApi.success('Публикация добавлена!')
      setIsPostModalOpen(false)
      setSelectedFile(null)
      setPostCaption('')
      refetch()
    } catch (err) {
      messageApi.error('Ошибка публикации')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white w-full md:pl-[244px] px-5 py-10">
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

  return (
    <div className="min-h-screen bg-white w-full md:pl-[244px] font-sans antialiased text-[#262626]">
      {contextHolder}
      
      <div className="max-w-[975px] mx-auto px-5 py-8">
        
        {/* ХЕДЕР ПРОФИЛЯ */}
        <header className="flex flex-col sm:flex-row items-stretch gap-8 sm:gap-24 pb-11 border-b border-[#dbdbdb] mb-0">
          
          {/* Блок Аватара */}
          <div className="flex justify-center items-center sm:w-[290px] flex-shrink-0">
            <div 
              onClick={() => fileInputRef.current?.click()} 
              className="relative group cursor-pointer w-[150px] h-[150px] rounded-full overflow-hidden border border-[#dbdbdb] bg-[#fafafa]"
            >
              <Avatar 
                src={avatarUrl} 
                icon={<User size={60} className="text-[#8e8e8e]" />} 
                className="w-full h-full object-cover flex items-center justify-center bg-[#fafafa]"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[12px] font-semibold">
                <Camera size={20} className="mb-1" />
                <span>Изменить фото</span>
              </div>
              <input type="file" ref={fileInputRef} hidden onChange={handleAvatarChange} accept="image/*" />
            </div>
          </div>

          {/* Информационный блок */}
          <div className="flex-1 flex flex-col gap-5 pt-1">
            {/* Строка 1: Никнейм и кнопки */}
            <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start">
              <h2 className="text-[20px] font-light text-[#262626] tracking-wide">{user?.userName || 'username'}</h2>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={openEditModal}
                  className="bg-[#efefef] hover:bg-[#dbdbdb] transition-colors text-[14px] font-semibold text-[#262626] px-4 py-1.5 rounded-lg border-none cursor-pointer"
                >
                  Редактировать профиль
                </button>
                
                <button 
                  onClick={() => setIsPostModalOpen(true)}
                  className="bg-[#0095f6] hover:bg-[#1877f2] transition-colors text-[14px] font-semibold text-white px-4 py-1.5 rounded-lg border-none cursor-pointer flex items-center gap-1"
                >
                  <Plus size={16} /> Создать
                </button>
              </div>

              <Settings className="w-6 h-6 text-[#262626] cursor-pointer hover:opacity-70 transition-opacity ml-1" />
            </div>

            {/* Строка 2: Статистика */}
            <div className="hidden sm:flex items-center gap-10 text-[16px] text-[#262626]">
              <div>Публикаций: <span className="font-semibold">{user?.postsCount || 0}</span></div>
              <div className="cursor-pointer">Подписчики: <span className="font-semibold">{user?.subscribersCount || 0}</span></div>
              <div className="cursor-pointer">Подписки: <span className="font-semibold">{user?.subscriptionsCount || 0}</span></div>
            </div>

            {/* Строка 3: Имя и Биография */}
            <div className="text-center sm:text-left text-[14px] text-[#262626] leading-relaxed">
              <h1 className="font-semibold">{user?.fullName || 'No Name'}</h1>
              <p className="whitespace-pre-wrap font-normal mt-1 text-[#262626]">{user?.bio || ''}</p>
            </div>
          </div>
        </header>

        {/* Мобильная статистика */}
        <div className="flex sm:hidden justify-around border-b border-[#dbdbdb] py-3 text-center text-[14px] text-[#8e8e8e]">
          <div>публикаций<div className="font-semibold text-[#262626]">{user?.postsCount || 0}</div></div>
          <div>подписчиков<div className="font-semibold text-[#262626]">{user?.subscribersCount || 0}</div></div>
          <div>подписок<div className="font-semibold text-[#262626]">{user?.subscriptionsCount || 0}</div></div>
        </div>

        {/* ТАБЫ (В точности как разделители в Insta) */}
        <div className="flex justify-center gap-14 border-t border-[#transparent] sm:border-[#dbdbdb] -mt-[1px]">
          <button 
            onClick={() => setActiveTab('1')}
            className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer transition-colors ${
              activeTab === '1' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'
            }`}
          >
            <Grid size={12} className="stroke-[2.5]" /> Публикации
          </button>
          <button 
            onClick={() => setActiveTab('2')}
            className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer transition-colors ${
              activeTab === '2' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'
            }`}
          >
            <Clapperboard size={12} className="stroke-[2.5]" /> Reels
          </button>
          <button 
            onClick={() => setActiveTab('3')}
            className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer transition-colors ${
              activeTab === '3' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'
            }`}
          >
            <Bookmark size={12} className="stroke-[2.5]" /> Сохраненное
          </button>
        </div>

        {/* СЕТКА КОНТЕНТА */}
        <div className="mt-4">
          {activeTab === '1' && (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-white">
              <div className="p-4 border-[2px] border-[#262626] rounded-full mb-5"><Grid size={32} className="text-[#262626] stroke-[1.5]"/></div>
              <h3 className="text-[32px] font-black text-[#262626] tracking-tight mb-2">Поделитесь фото</h3>
              <p className="text-[14px] text-[#262626] max-w-[350px] font-normal leading-tight">Когда вы поделитесь фото, они появятся в вашем профиле.</p>
            </div>
          )}
          {activeTab === '2' && (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-white">
              <div className="p-4 border-[2px] border-[#262626] rounded-full mb-5"><Clapperboard size={32} className="text-[#262626] stroke-[1.5]"/></div>
              <h3 className="text-[32px] font-black text-[#262626] tracking-tight mb-2">Создавайте Reels</h3>
              <p className="text-[14px] text-[#262626] max-w-[350px] font-normal leading-tight">Проявите творческий подход с помощью коротких видеороликов.</p>
            </div>
          )}
          {activeTab === '3' && (
            <div className="flex flex-col items-center justify-center text-center py-24 bg-white">
              <div className="p-4 border-[2px] border-[#262626] rounded-full mb-5"><Bookmark size={32} className="text-[#262626] stroke-[1.5]"/></div>
              <h3 className="text-[32px] font-black text-[#262626] tracking-tight mb-2">Сохраненное</h3>
              <p className="text-[14px] text-[#262626] max-w-[350px] font-normal leading-tight">Только вы можете видеть то, что сохранили.</p>
            </div>
          )}
        </div>

        {/* МОДАЛКА: РЕДАКТИРОВАНИЕ ПРОФИЛЯ */}
        <Modal
          title={<div className="text-center font-semibold text-[16px] py-1 text-[#262626]">Редактировать профиль</div>}
          open={isEditModalOpen}
          onOk={handleSaveProfile}
          onCancel={() => setIsEditModalOpen(false)}
          confirmLoading={isUpdatingInfo}
          okText="Сохранить"
          cancelText="Отмена"
          centered
          styles={{
            mask: { backgroundColor: 'rgba(0, 0, 0, 0.65)' },
            content: { borderRadius: '12px', padding: '0px', overflow: 'hidden' },
            header: { margin: '0', padding: '14px', borderBottom: '1px solid #dbdbdb' },
            body: { padding: '24px bg-white' },
            footer: { padding: '12px 16px', borderTop: '1px solid #dbdbdb', margin: '0' }
          }}
        >
          <div className="p-6 flex flex-col gap-5 bg-white">
            <div>
              <label className="text-[14px] font-semibold text-[#262626] block mb-2">Имя профиля</label>
              <Input 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="Ваше имя"
                className="rounded-md py-2 border-[#dbdbdb] bg-[#fafafa] focus:bg-white focus:border-[#a8a8a8] hover:border-[#dbdbdb] transition-colors shadow-none text-[14px]"
              />
            </div>
            <div>
              <label className="text-[14px] font-semibold text-[#262626] block mb-2">О себе</label>
              <TextArea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)} 
                placeholder="Расскажите о себе..."
                rows={4}
                maxLength={150}
                showCount={{ formatter: ({ count, maxLength }) => <span className="text-[12px] text-[#8e8e8e]">{count} / {maxLength}</span> }}
                className="rounded-md border-[#dbdbdb] bg-[#fafafa] focus:bg-white focus:border-[#a8a8a8] hover:border-[#dbdbdb] transition-colors shadow-none resize-none text-[14px]"
              />
            </div>
          </div>
        </Modal>

        {/* МОДАЛКА: СОЗДАНИЕ ПОСТА */}
        <Modal
          title={<div className="text-center font-semibold text-[16px] py-1 text-[#262626]">Создание публикации</div>}
          open={isPostModalOpen}
          onOk={handleCreatePost}
          onCancel={() => setIsPostModalOpen(false)}
          confirmLoading={isAddingPost}
          okText="Поделиться"
          cancelText="Отмена"
          centered
          styles={{
            mask: { backgroundColor: 'rgba(0, 0, 0, 0.65)' },
            content: { borderRadius: '12px', padding: '0px', overflow: 'hidden' },
            header: { margin: '0', padding: '14px', borderBottom: '1px solid #dbdbdb' },
            body: { padding: '0' },
            footer: { padding: '12px 16px', borderTop: '1px solid #dbdbdb', margin: '0' }
          }}
        >
          <div className="flex flex-col md:flex-row min-h-[400px] bg-white">
            {/* Секция выбора файлов (Левая часть) */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-[#dbdbdb] bg-[#fafafa]">
              <input 
                type="file" 
                id="modal-file-upload"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                accept="image/*,video/*"
              />
              <label 
                htmlFor="modal-file-upload"
                className="flex flex-col items-center justify-center cursor-pointer text-center group"
              >
                <svg className="w-24 h-22 text-[#262626] mb-4 stroke-[1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[18px] font-light text-[#262626] mb-4">Перетащите сюда фото или видео</span>
                <span className="bg-[#0095f6] hover:bg-[#1877f2] text-white text-[14px] font-semibold px-4 py-1.5 rounded-lg transition-colors">
                  Выбрать на компьютере
                </span>
              </label>
              {selectedFile && (
                <div className="mt-4 p-2 bg-[#efefef] rounded text-[12px] font-medium text-[#262626] border border-[#dbdbdb]">
                  ✓ Выбран файл: {selectedFile.name}
                </div>
              )}
            </div>

            {/* Секция метаданных / Описание (Правая часть) */}
            <div className="w-full md:w-[280px] p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Avatar src={avatarUrl} size={28} />
                <span className="text-[14px] font-semibold text-[#262626]">{user?.userName}</span>
              </div>
              <TextArea 
                value={postCaption} 
                onChange={(e) => setPostCaption(e.target.value)} 
                placeholder="Добавьте подпись..." 
                rows={6}
                maxLength={2200}
                className="border-none bg-white focus:bg-white p-0 shadow-none resize-none text-[14px] text-[#262626] placeholder-[#8e8e8e] focus:border-transparent focus:shadow-none"
              />
            </div>
          </div>
        </Modal>

      </div>
    </div>
  )
}