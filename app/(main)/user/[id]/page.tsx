'use client'

import { useParams } from 'next/navigation'
import { 
  useGetUserProfileByIdQuery, 
  useGetIsFollowUserProfileByIdQuery,
  useAddFollowingRelationShipMutation,
  useDeleteFollowingRelationShipMutation,
  useGetSubscribersQuery,
  useGetSubscriptionsQuery,
  useGetPostsQuery, 
  useGetReelsQuery, 
  useGetPostByIdQuery,
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useAddPostFavoriteMutation,
  useViewPostMutation
} from '../../../services/Profile'
import { Grid, Clapperboard, MoreHorizontal, UserCheck, Heart, MessageCircle, Bookmark, Share2, X, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import { Skeleton, message, Modal, Input, Avatar } from 'antd'

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGES || 'https://instagram-api.softclub.tj/images'

export default function UserProfilePage() {
  const params = useParams()
  const id = params?.id ? String(params.id) : ''
  const [messageApi, contextHolder] = message.useMessage()
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts')
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [isPostDetailsModalOpen, setIsPostDetailsModalOpen] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false)
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false)
  const [likedPostIds, setLikedPostIds] = useState<Record<number, boolean>>({})

  // --- Запросы к API ---
  const { data: profile, isLoading: isProfileLoading } = useGetUserProfileByIdQuery(id, { skip: !id })
  const { data: isFollowData, isLoading: isFollowLoading } = useGetIsFollowUserProfileByIdQuery(id, { skip: !id })
  
  const { data: postsData, isLoading: isPostsLoading } = useGetPostsQuery(
    { UserId: id, PageNumber: 1, PageSize: 10 },
    { skip: !id },
  )
  const { data: reelsData, isLoading: isReelsLoading } = useGetReelsQuery(undefined)
  
  const { data: subscribersData } = useGetSubscribersQuery(id, { skip: !id })
  const { data: subscriptionsData } = useGetSubscriptionsQuery(id, { skip: !id })
  const { data: postDetails, refetch: refetchPostDetails } = useGetPostByIdQuery(selectedPostId || 0, { skip: !selectedPostId })
  
  const [followUser] = useAddFollowingRelationShipMutation()
  const [unfollowUser] = useDeleteFollowingRelationShipMutation()
  const [likePost] = useLikePostMutation()
  const [viewPost] = useViewPostMutation()
  const [addComment] = useAddCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()
  const [addToFavorite] = useAddPostFavoriteMutation()

  if (isProfileLoading || isFollowLoading || isPostsLoading || isReelsLoading) {
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

  // Самые полные данные о пользователе приходят из метода getIsFollowUserProfileById
  const isFollowObj = isFollowData?.data || isFollowData
  const backupUserObj = profile?.data || profile

  if (!isFollowObj && !backupUserObj) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full md:pl-[244px] text-[#8e8e8e] bg-white">
        Пользователь не найден.
      </div>
    )
  }

  // --- Извлечение данных (приоритет у объекта проверки подписки) ---
  const username = isFollowObj?.userName || backupUserObj?.userName || 'username'
  const fullName = isFollowObj?.firstName ? `${isFollowObj.firstName} ${isFollowObj.lastName || ''}`.trim() : (backupUserObj?.fullName || 'Имя не указано')
  const bio = isFollowObj?.about || backupUserObj?.about || ''
  
  const rawAvatar = isFollowObj?.image || backupUserObj?.avatar || backupUserObj?.image || backupUserObj?.userImage
  const avatar = rawAvatar ? (rawAvatar.startsWith('http') ? rawAvatar : `${IMAGE_BASE_URL}/${rawAvatar}`) : '/images/default-avatar.svg'

  const isFollowing = isFollowObj?.isSubscriber ?? false
  
  // Подписчики / Подписки списки
  const followersList = Array.isArray(subscribersData) ? subscribersData : subscribersData?.data || []
  const subscriptionsList = Array.isArray(subscriptionsData) ? subscriptionsData : subscriptionsData?.data || []

  // Счётчики
  const followersCount = isFollowObj?.subscribersCount ?? backupUserObj?.subscribersCount ?? followersList.length
  const subscriptionsCount = isFollowObj?.subscriptionsCount ?? backupUserObj?.subscriptionsCount ?? subscriptionsList.length

  // --- Фильтрация контента юзера по ID ---
  const allPosts = Array.isArray(postsData) ? postsData : (postsData?.data || [])
  const userPosts = allPosts.filter((p: any) => p?.userId && String(p.userId).trim().toLowerCase() === id.trim().toLowerCase())

  const allReels = Array.isArray(reelsData) ? reelsData : (reelsData?.data || reelsData?.reels || [])
  const userReels = allReels.filter((r: any) => r?.userId && String(r.userId).trim().toLowerCase() === id.trim().toLowerCase())

  const activePostsList = activeTab === 'posts' ? userPosts : userReels
  const totalPublications = userPosts.length + userReels.length

  // --- Handlers ---
  const handleFollowToggle = async () => {
    if (!id) return
    try {
      if (isFollowing) {
        await unfollowUser(id).unwrap()
        messageApi.success(`Вы отписались от ${username}`)
      } else {
        await followUser(id).unwrap()
        messageApi.success(`Вы подписались на ${username}`)
      }
    } catch (err) {
      messageApi.error("Не удалось изменить статус подписки")
    }
  }

  const openPostModal = (postId: number) => {
    setSelectedPostId(postId)
    setIsPostDetailsModalOpen(true)
    viewPost(postId) // Засчитываем просмотр при открытии
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
        
        {/* ШАПКА ПРОФИЛЯ */}
        <header className="flex flex-row items-start gap-10 md:gap-20 pb-11 border-b border-[#efefef] mb-0">
          <div className="flex-shrink-0 md:w-[290px] flex justify-center">
            <div className="w-[80px] h-[80px] sm:w-[150px] sm:h-[150px] rounded-full overflow-hidden border border-[#dbdbdb] bg-[#fafafa]">
              <img src={avatar} alt={username} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[20px] font-normal text-[#262626] mr-2">{username}</h2>
              <div className="flex items-center gap-2">
                {isFollowing ? (
                  <button onClick={handleFollowToggle} className="bg-[#efefef] hover:bg-[#dbdbdb] text-[14px] font-semibold text-[#262626] px-4 py-1.5 rounded-lg flex items-center gap-1.5 border-none cursor-pointer transition-colors">
                    <UserCheck size={16} /> Подписки
                  </button>
                ) : (
                  <button onClick={handleFollowToggle} className="bg-[#0095f6] hover:bg-[#1877f2] text-[14px] font-semibold text-white px-5 py-1.5 rounded-lg border-none cursor-pointer transition-colors">
                    Подписаться
                  </button>
                )}
                <button className="bg-[#efefef] hover:bg-[#dbdbdb] text-[14px] font-semibold text-[#262626] px-4 py-1.5 rounded-lg border-none cursor-pointer transition-colors">
                  Сообщение
                </button>
              </div>
              <MoreHorizontal className="w-6 h-6 text-[#262626] cursor-pointer hover:opacity-60" />
            </div>

            <div className="flex items-center gap-7 text-[16px] text-[#262626]">
              <div><span className="font-semibold">{totalPublications}</span> публикаций</div>
              <div onClick={() => setIsFollowersModalOpen(true)} className="cursor-pointer hover:opacity-70"><span className="font-semibold">{followersCount}</span> подписчиков</div>
              <div onClick={() => setIsFollowingModalOpen(true)} className="cursor-pointer hover:opacity-70"><span className="font-semibold">{subscriptionsCount}</span> подписок</div>
            </div>

            <div className="text-[14px]">
              <h1 className="font-semibold text-black mb-1">{fullName}</h1>
              {bio && <p className="whitespace-pre-wrap font-normal text-[#262626]">{bio}</p>}
            </div>
          </div>
        </header>

        {/* ТАБЫ */}
        <div className="flex justify-center gap-14 border-t border-[#efefef]">
          <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === 'posts' ? 'border-black text-black font-bold' : 'border-transparent text-[#8e8e8e]'}`}><Grid className="w-3 h-3" /> Публикации</button>
          <button onClick={() => setActiveTab('reels')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === 'reels' ? 'border-black text-black font-bold' : 'border-transparent text-[#8e8e8e]'}`}><Clapperboard className="w-3 h-3" /> Reels</button>
        </div>

        {/* СЕТКА КОНТЕНТА */}
        <div className="mt-2">
          {activePostsList.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 md:gap-7">
              {activePostsList.map((post: any) => {
                const mediaFile = post.images?.[0] || post.userImage || ''
                const pMedia = mediaFile ? (mediaFile.startsWith('http') ? mediaFile : `${IMAGE_BASE_URL}/${mediaFile}`) : '/images/default-avatar.svg'
                const isVideo = activeTab === 'reels'

                return (
                  <div key={post.postId || post.id} onClick={() => openPostModal(post.postId || post.id)} className="relative aspect-square bg-black overflow-hidden group cursor-pointer border border-[#efefef]">
                    {isVideo ? (
                      <video src={pMedia} className="w-full h-full object-cover" muted playsInline loop preload="metadata" />
                    ) : (
                      <img src={pMedia} alt="post" className="w-full h-full object-cover" />
                    )}
                    
                    {isVideo && (
                      <div className="absolute top-2 right-2 text-white drop-shadow-md z-10">
                        <Clapperboard size={16} />
                      </div>
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
                {activeTab === 'reels' ? <Clapperboard size={32} /> : <Grid size={32} />}
              </div>
              <h3 className="text-[28px] font-extrabold mb-2">Публикаций пока нет</h3>
            </div>
          )}
        </div>

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
                {activeTab === 'reels' ? (
                  <video src={modalMediaUrl} className="w-full h-full object-contain" controls autoPlay loop muted />
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
                      <div key={comment.postCommentId} className="flex gap-3 items-start text-[13px] justify-between group">
                        <div className="flex gap-3 items-start flex-1">
                          <Avatar src={userAvatar} size="small" className="flex-shrink-0">
                            {commentAuthor.charAt(0).toUpperCase()}
                          </Avatar>
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
                      <button onClick={() => handleLikePost(selectedPostId!)} className="bg-transparent border-none p-0 cursor-pointer hover:opacity-75 transition-opacity">
                        <Heart size={24} className={likedPostIds[selectedPostId!] || currentPost?.postLike ? "text-red-500 fill-red-500" : "text-black"} />
                      </button>
                      <MessageCircle size={24} className="text-black cursor-pointer hover:opacity-75 transition-opacity" />
                      <Share2 size={24} className="text-black cursor-pointer hover:opacity-75 transition-opacity" />
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
        <Modal title="Подписчики" open={isFollowersModalOpen} onCancel={() => setIsFollowersModalOpen(false)} footer={null} centered width={400}>
          <div className="max-h-[400px] overflow-y-auto flex flex-col gap-3 pt-2">
            {followersList.length > 0 ? followersList.map((f: any) => {
              const info = f.userShortInfo || {}
              const fAvatar = info.userPhoto || info.avatar || info.image
              return (
                <div key={f.id || info.userId} className="flex items-center gap-3 justify-between p-1 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar src={fAvatar ? (fAvatar.startsWith('http') ? fAvatar : `${IMAGE_BASE_URL}/${fAvatar}`) : undefined} size={44} icon={<User />} className="border border-gray-100 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[14px] text-black">{info.userName || 'user'}</span>
                      <span className="text-gray-400 text-[12px]">{info.fullname || info.fullName || 'Имя не указано'}</span>
                    </div>
                  </div>
                </div>
              )
            }) : <div className="text-center text-gray-400 py-6">Нет подписчиков</div>}
          </div>
        </Modal>

        {/* МОДАЛКА ПОДПИСОК */}
        <Modal title="Подписки" open={isFollowingModalOpen} onCancel={() => setIsFollowingModalOpen(false)} footer={null} centered width={400}>
          <div className="max-h-[400px] overflow-y-auto flex flex-col gap-3 pt-2">
            {subscriptionsList.length > 0 ? subscriptionsList.map((f: any) => {
              const info = f.userShortInfo || {}
              const fAvatar = info.userPhoto || info.avatar || info.image
              return (
                <div key={f.id || info.userId} className="flex items-center gap-3 justify-between p-1 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar src={fAvatar ? (fAvatar.startsWith('http') ? fAvatar : `${IMAGE_BASE_URL}/${fAvatar}`) : undefined} size={44} icon={<User />} className="border border-gray-100 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-[14px] text-black">{info.userName || 'user'}</span>
                      <span className="text-gray-400 text-[12px]">{info.fullname || info.fullName || 'Имя не указано'}</span>
                    </div>
                  </div>
                </div>
              )
            }) : <div className="text-center text-gray-400 py-6">Нет подписок</div>}
          </div>
        </Modal>

      </div>
    </div>
  )
}