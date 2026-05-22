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
  useAddPostFavoriteMutation,
  useGetPostByIdQuery,
  useLikePostMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
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

  // --- API Hooks ---
  const { data: profile, isLoading: isProfileLoading } = useGetUserProfileByIdQuery(id, { skip: !id })
  const { data: isFollowData, error: followError } = useGetIsFollowUserProfileByIdQuery(id, { skip: !id })
  const { data: postsData, isLoading: isPostsLoading } = useGetPostsQuery(undefined)
  
  // Передаем id в query-параметры для получения подписчиков/подписок конкретного пользователя
  const { data: subscribersData } = useGetSubscribersQuery(id, { skip: !id })
  const { data: subscriptionsData } = useGetSubscriptionsQuery(id, { skip: !id })

  const { data: postDetails, refetch: refetchPostDetails } = useGetPostByIdQuery(selectedPostId || 0, { skip: !selectedPostId })
  
  const [followUser] = useAddFollowingRelationShipMutation()
  const [unfollowUser] = useDeleteFollowingRelationShipMutation()
  const [likePost] = useLikePostMutation()
  const [addComment] = useAddCommentMutation()
  const [deleteComment] = useDeleteCommentMutation()
  const [addToFavorite] = useAddPostFavoriteMutation()

  if (isProfileLoading || isPostsLoading) {
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

  const user = profile?.data || profile
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full md:pl-[244px] text-[#8e8e8e] bg-white font-sans">
        Пользователь не найден.
      </div>
    )
  }

  // Фильтрация постов пользователя
  const allPostsArray = Array.isArray(postsData) ? postsData : (postsData?.data || postsData?.posts || [])
  const userPosts = allPostsArray.filter((p: any) => p?.userId && String(p.userId).trim().toLowerCase() === id.trim().toLowerCase())

  const username = user.userName || user.username || 'username'
  const fullName = user.fullName || 'Имя не указано'
  const bio = user.about || user.bio || ''
  
  const rawAvatar = user.avatar || user.image || user.imagePath || user.userImage
  const avatar = rawAvatar ? (rawAvatar.startsWith('http') ? rawAvatar : `${IMAGE_BASE_URL}/${rawAvatar}`) : '/images/default-avatar.svg'

  const followersList = Array.isArray(subscribersData) ? subscribersData : subscribersData?.data || []
  const subscriptionsList = Array.isArray(subscriptionsData) ? subscriptionsData : subscriptionsData?.data || []
  const isFollowing = followError ? false : (isFollowData?.data ?? isFollowData ?? false)

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
      refetchPostDetails() // Обновляем содержимое модалки
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

  return (
    <div className="min-h-screen bg-white w-full md:pl-[244px] font-sans antialiased text-[#262626]">
      {contextHolder}
      <div className="max-w-[975px] mx-auto px-5 py-8">
        
        {/* ШАПКА ПРОФИЛЯ */}
        <header className="flex flex-col sm:flex-row items-stretch gap-8 sm:gap-24 pb-11 border-b border-[#dbdbdb] mb-0">
          <div className="flex justify-center items-center sm:w-[290px] flex-shrink-0">
            <div className="w-[150px] h-[150px] rounded-full overflow-hidden border border-[#dbdbdb] bg-[#fafafa]">
              <img src={avatar} alt={username} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-5 pt-1">
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
              <h2 className="text-[20px] font-light tracking-wide mr-2">{username}</h2>
              <div className="flex items-center gap-2">
                {isFollowing ? (
                  <button onClick={handleFollowToggle} className="bg-[#efefef] hover:bg-[#dbdbdb] text-[14px] font-semibold text-[#262626] px-5 py-1.5 rounded-lg flex items-center gap-1.5 border-none cursor-pointer transition-colors">
                    <UserCheck size={16} /> Подписки
                  </button>
                ) : (
                  <button onClick={handleFollowToggle} className="bg-[#0095f6] hover:bg-[#1877f2] text-[14px] font-semibold text-white px-6 py-1.5 rounded-lg border-none cursor-pointer transition-colors">
                    Подписаться
                  </button>
                )}
                <button className="bg-[#efefef] hover:bg-[#dbdbdb] text-[14px] font-semibold text-[#262626] px-4 py-1.5 rounded-lg border-none cursor-pointer transition-colors">
                  Сообщение
                </button>
              </div>
              <MoreHorizontal className="w-6 h-6 text-[#262626] cursor-pointer" />
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-10 text-[16px]">
              <div>Публикаций: <span className="font-semibold">{userPosts.length}</span></div>
              <div onClick={() => setIsFollowersModalOpen(true)} className="cursor-pointer hover:opacity-70">Подписчики: <span className="font-semibold">{user.subscribersCount ?? user.followersCount ?? followersList.length ?? 0}</span></div>
              <div onClick={() => setIsFollowingModalOpen(true)} className="cursor-pointer hover:opacity-70">Подписки: <span className="font-semibold">{user.subscriptionsCount ?? user.followingCount ?? subscriptionsList.length ?? 0}</span></div>
            </div>

            <div className="text-center sm:text-left text-[14px]">
              <h1 className="font-semibold">{fullName}</h1>
              {bio && <p className="whitespace-pre-wrap font-normal mt-1 text-[#262626]">{bio}</p>}
            </div>
          </div>
        </header>

        {/* ТАБЫ */}
        <div className="flex justify-center gap-14 border-t border-[#dbdbdb]">
          <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === 'posts' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'}`}><Grid className="w-3 h-3" /> Публикации</button>
          <button onClick={() => setActiveTab('reels')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === 'reels' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'}`}><Clapperboard className="w-3 h-3" /> Reels</button>
        </div>

        {/* СЕТКА ПОСТОВ */}
        <div className="mt-4">
          {activeTab === 'posts' && (
            userPosts.length > 0 ? (
              <div className="grid grid-cols-3 gap-1 sm:gap-7">
                {userPosts.map((post: any) => {
                  const postImg = post.images?.[0] || post.userImage
                    ? ((post.images?.[0] || post.userImage).startsWith('http') ? (post.images?.[0] || post.userImage) : `${IMAGE_BASE_URL}/${post.images?.[0] || post.userImage}`)
                    : '/images/default-avatar.svg'
                  return (
                    <div key={post.postId || post.id} onClick={() => openPostModal(post.postId || post.id)} className="relative aspect-square bg-[#fafafa] overflow-hidden group cursor-pointer border border-[#dbdbdb]">
                      <img src={postImg} alt="post" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white gap-6 font-semibold z-10">
                        <div className="flex items-center gap-1"><Heart fill="white" size={18} /> {post.postLikeCount || 0}</div>
                        <div className="flex items-center gap-1"><MessageCircle fill="white" size={18} /> {post.commentCount || 0}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="p-4 border-[2px] border-[#262626] rounded-full mb-5"><Grid size={32}/></div>
                <h3 className="text-[32px] font-black">Публикаций пока нет</h3>
              </div>
            )
          )}
        </div>

        {/* ДЕТАЛИ ПОСТА */}
        <Modal 
          open={isPostDetailsModalOpen} 
          onCancel={() => { setIsPostDetailsModalOpen(false); setSelectedPostId(null); }} 
          width={1000}
          footer={null}
          centered
          styles={{ body: { padding: 0 } }}
          closeIcon={<X className="text-white fixed right-4 top-4 w-6 h-6" />}
        >
          {currentPost && (
            <div className="flex flex-col md:flex-row h-[90vh] md:h-[600px] bg-white rounded-r-lg overflow-hidden">
              <div className="w-full md:w-[60%] bg-black flex items-center justify-center h-[50%] md:h-full select-none">
                <img 
                  src={currentPost?.images?.[0] ? (currentPost.images[0].startsWith('http') ? currentPost.images[0] : `${IMAGE_BASE_URL}/${currentPost.images[0]}`) : '/images/default-avatar.svg'}
                  alt="Post content"
                  className="w-full h-full object-contain max-h-full"
                />
              </div>

              <div className="w-full md:w-[40%] flex flex-col h-[50%] md:h-full border-l border-gray-100">
                <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                    <img src={avatar} alt={username} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-[14px]">{username}</span>
                    <span className="text-[12px] text-gray-400">{currentPost?.title || 'Публикация'}</span>
                  </div>
                </div>

                {/* Список комментариев */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white text-[14px]">
                  {currentPost?.content && (
                    <div className="flex gap-3 items-start border-b pb-2 border-gray-50">
                      <div className="w-8 h-8 rounded-full overflow-hidden border flex-shrink-0">
                        <img src={avatar} alt={username} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-semibold mr-2">{username}</span>
                        <span className="text-gray-800">{currentPost.content}</span>
                      </div>
                    </div>
                  )}

                  {currentPost?.comments?.map((comment: any) => {
                    const commentAuthor = comment.userName || 'User';
                    const commentTextBody = comment.comment || ''; // Берем строго из ключа 'comment'

                    return (
                      <div key={comment.postCommentId} className="flex gap-3 items-start text-[13px] justify-between group">
                        <div className="flex gap-3 items-start flex-1">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 uppercase text-[10px] flex-shrink-0">
                            {commentAuthor.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <span className="font-semibold mr-1.5">{commentAuthor}</span>
                            <span className="text-gray-700 break-words">{commentTextBody}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteComment(comment.postCommentId)}
                          className="text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="p-4 border-t border-gray-100 bg-white">
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
                  <div className="font-semibold text-[14px] text-black">
                    {currentPost?.postLikeCount || 0} отметок «Нравится»
                  </div>
                </div>

                <div className="p-3 border-t border-gray-100 flex items-center gap-2 bg-white">
                  <Input 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Добавьте комментарий..."
                    bordered={false}
                    className="flex-1 text-[14px]"
                    onPressEnter={() => handleAddComment(selectedPostId!)}
                  />
                  <button 
                    onClick={() => handleAddComment(selectedPostId!)}
                    disabled={!commentText.trim()}
                    className="text-[#0095f6] font-semibold text-[14px] bg-transparent border-none cursor-pointer disabled:opacity-40"
                  >
                    Опубликовать
                  </button>
                </div>

              </div>
            </div>
          )}
        </Modal>

        {/* МОДАЛКА ПОДПИСЧИКОВ */}
        <Modal title="Подписчики" open={isFollowersModalOpen} onCancel={() => setIsFollowersModalOpen(false)} footer={null} centered>
          <div className="max-h-[400px] overflow-y-auto flex flex-col gap-3 pt-2">
            {followersList.length > 0 ? followersList.map((f: any) => (
              <div key={f.id || f.userId} className="flex items-center gap-3 justify-between p-1">
                <div className="flex items-center gap-3">
                  <Avatar src={f.avatar ? `${IMAGE_BASE_URL}/${f.avatar}` : undefined} icon={<User />} />
                  <div className="flex flex-col"><span className="font-semibold text-[14px]">{f.userName || 'user'}</span><span className="text-gray-400 text-[12px]">{f.fullName}</span></div>
                </div>
              </div>
            )) : <div className="text-center text-gray-400 py-6">Нет подписчиков</div>}
          </div>
        </Modal>

        {/* МОДАЛКА ПОДПИСОК */}
        <Modal title="Подписки" open={isFollowingModalOpen} onCancel={() => setIsFollowingModalOpen(false)} footer={null} centered>
          <div className="max-h-[400px] overflow-y-auto flex flex-col gap-3 pt-2">
            {subscriptionsList.length > 0 ? subscriptionsList.map((f: any) => (
              <div key={f.id || f.userId} className="flex items-center gap-3 justify-between p-1">
                <div className="flex items-center gap-3">
                  <Avatar src={f.avatar ? `${IMAGE_BASE_URL}/${f.avatar}` : undefined} icon={<User />} />
                  <div className="flex flex-col"><span className="font-semibold text-[14px]">{f.userName || 'user'}</span><span className="text-gray-400 text-[12px]">{f.fullName}</span></div>
                </div>
              </div>
            )) : <div className="text-center text-gray-400 py-6">Нет подписок</div>}
          </div>
        </Modal>

      </div>
    </div>
  )
}