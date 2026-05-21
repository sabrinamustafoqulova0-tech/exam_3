'use client'
import { useParams } from 'next/navigation'
import { 
  useGetUserProfileByIdQuery, 
  useGetIsFollowUserProfileByIdQuery,
  useAddFollowingRelationShipMutation,
  useDeleteFollowingRelationShipMutation,
  useGetPostsQuery,
  useAddPostFavoriteMutation,
  useGetPostByIdQuery,
  useLikePostMutation,
  useAddCommentMutation,
} from '../../../services/Profile'
import { Grid, Clapperboard, MoreHorizontal, UserCheck, Heart, MessageCircle, Bookmark } from 'lucide-react'
import { useState } from 'react'
import { Skeleton, message, Modal, Input } from 'antd'

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGES || 'https://instagram-api.softclub.tj/images'

export default function UserProfilePage() {
  const params = useParams()
  const id = params?.id ? String(params.id) : ''
  const [messageApi, contextHolder] = message.useMessage()
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts')
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [isPostDetailsModalOpen, setIsPostDetailsModalOpen] = useState(false)
  const [commentText, setCommentText] = useState('')

  // --- API Hooks for Post Details ---
  const { data: postDetails } = useGetPostByIdQuery(selectedPostId || 0, { skip: !selectedPostId })
  const [likePost] = useLikePostMutation()
  const [addComment] = useAddCommentMutation()

  // --- API Hooks ---
  const { data: profile, isLoading: isProfileLoading } = useGetUserProfileByIdQuery(id, { skip: !id })
  const { data: isFollowData, isLoading: isFollowLoading, error: followError } = useGetIsFollowUserProfileByIdQuery(id, { skip: !id })
  const { data: postsData, isLoading: isPostsLoading } = useGetPostsQuery(undefined)
  
  const [followUser] = useAddFollowingRelationShipMutation()
  const [unfollowUser] = useDeleteFollowingRelationShipMutation()
  const [addToFavorite] = useAddPostFavoriteMutation()

  // Ждем только критически важные данные профиля и общего списка постов
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

  // Извлекаем массив публикаций без риска вызвать ошибку undefined
  const allPostsArray = Array.isArray(postsData) 
    ? postsData 
    : (postsData?.data || postsData?.posts || [])

  // Фильтруем посты автора по UUID строки
  const userPosts = allPostsArray.filter((p: any) => {
    if (!p?.userId || !id) return false
    return String(p.userId).trim().toLowerCase() === id.trim().toLowerCase()
  })

  const username = user.userName || user.username || 'username'
  const fullName = user.fullName || 'Имя не указано'
  const bio = user.about || user.bio || ''
  
  const rawAvatar = user.avatar || user.image || user.imagePath || user.userImage
  const avatar = rawAvatar 
    ? (rawAvatar.startsWith('http') ? rawAvatar : `${IMAGE_BASE_URL}/${rawAvatar}`)
    : '/images/default-avatar.svg'

  const followersCount = user.subscribersCount || user.followersCount || 0
  const subscriptionsCount = user.subscriptionsCount || user.followingCount || 0

  // Безопасное определение статуса подписки: если бэкенд вернул ошибку проверки, считаем статус как false
  const isFollowing = followError ? false : (isFollowData?.data ?? isFollowData ?? false)

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

  const handleFileSave = async (postId: number) => {
    try {
      await addToFavorite(postId).unwrap()
      messageApi.success("Сохранено в избранное")
    } catch (err) {
      messageApi.error("Ошибка сохранения")
    }
  }

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
                  <button 
                    onClick={handleFollowToggle}
                    className="bg-[#efefef] hover:bg-[#dbdbdb] text-[14px] font-semibold text-[#262626] px-5 py-1.5 rounded-lg border-none cursor-pointer flex items-center gap-1.5"
                  >
                    <UserCheck size={16} /> Подписки
                  </button>
                ) : (
                  <button 
                    onClick={handleFollowToggle}
                    className="bg-[#0095f6] hover:bg-[#1877f2] text-[14px] font-semibold text-white px-6 py-1.5 rounded-lg border-none cursor-pointer"
                  >
                    Подписаться
                  </button>
                )}
                <button className="bg-[#efefef] hover:bg-[#dbdbdb] text-[14px] font-semibold text-[#262626] px-4 py-1.5 rounded-lg border-none cursor-pointer">
                  Сообщение
                </button>
              </div>
              <MoreHorizontal className="w-6 h-6 text-[#262626] cursor-pointer" />
            </div>

            <div className="hidden sm:flex items-center gap-10 text-[16px]">
              <div>Публикаций: <span className="font-semibold">{userPosts.length}</span></div>
              <div>Подписчики: <span className="font-semibold">{followersCount}</span></div>
              <div>Подписки: <span className="font-semibold">{subscriptionsCount}</span></div>
            </div>

            <div className="text-center sm:text-left text-[14px]">
              <h1 className="font-semibold">{fullName}</h1>
              {bio && <p className="whitespace-pre-wrap font-normal mt-1 text-[#262626]">{bio}</p>}
            </div>
          </div>
        </header>

        {/* ТАБЫ И СЕТКА */}
        <div className="flex justify-center gap-14 border-t border-[#dbdbdb]">
          <button onClick={() => setActiveTab('posts')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === 'posts' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'}`}><Grid className="w-3 h-3" /> Публикации</button>
          <button onClick={() => setActiveTab('reels')} className={`flex items-center gap-1.5 py-4 text-[12px] font-semibold tracking-widest uppercase border-t-[1px] -mt-[1px] bg-transparent cursor-pointer ${activeTab === 'reels' ? 'border-black text-black' : 'border-transparent text-[#8e8e8e]'}`}><Clapperboard className="w-3 h-3" /> Reels</button>
        </div>

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

                      <button 
                        onClick={(e) => { e.stopPropagation(); handleFileSave(post.postId || post.id) }}
                        className="absolute bottom-2 right-2 bg-black/60 text-white p-1.5 rounded-full z-20 border-none opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Bookmark size={16} />
                      </button>
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
                <div className="pb-3 border-b">
                  <h3 className="font-semibold text-[16px]">{postDetails?.data?.title || 'Пост'}</h3>
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