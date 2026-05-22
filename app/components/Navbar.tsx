"use client";Ё

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Иконки для основного меню
import HomeIcon from "@mui/icons-material/Home";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SmartDisplayIcon from "@mui/icons-material/SmartDisplay";
import SmartDisplayOutlinedIcon from "@mui/icons-material/SmartDisplayOutlined";
import ChatIcon from "@mui/icons-material/Chat";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderOutlinedIcon from "@mui/icons-material/FavoriteBorderOutlined";
import AddBoxIcon from "@mui/icons-material/AddBox";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import CloseIcon from "@mui/icons-material/Close";
import InstagramIcon from '@mui/icons-material/Instagram';
import ExploreIcon from '@mui/icons-material/Explore';  
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined"; // Не забудь добавить этот импорт в самый верх файла7

// Иконки для меню "More"
import MenuIcon from "@mui/icons-material/Menu";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import { useGetUsersQuery } from "../services/Search";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  // ===== STATES =====
  const [openSearch, setOpenSearch] = useState(false);
  const [openMore, setOpenMore] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  // Закрытие "More" при клике вне модалки
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setOpenMore(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSearch = () => {
    setOpenSearch(!openSearch);
    setOpenMore(false);
    if (!openSearch) {
      setQuery("");
      setDebounced("");
    }
  };

  const closeSearch = () => {
    setOpenSearch(false);
    setQuery("");
    setDebounced("");
  };

  // Debounce для поиска
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data: users } = useGetUsersQuery(debounced, {
    skip: !openSearch || debounced.trim() === "",
  });

  const usersList = Array.isArray(users) ? users : [];
  const filtered = usersList.filter((u: any) =>
    u?.userName?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const saved = localStorage.getItem("search_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (user: any) => {
    const updated = [user, ...history.filter((x) => x.id !== user.id)].slice(0, 10);
    setHistory(updated);
    localStorage.setItem("search_history", JSON.stringify(updated));
  };

  const openUser = (user: any) => {
    saveToHistory(user);
    closeSearch();
    router.push(`/user/${user.id}`);
  };

  // Если открыт поиск ИЛИ меню More, сайдбар НЕ должен расширяться по ховеру
  const isLocked = openSearch || openMore;

  return (
    <div className="relative flex h-screen bg-white text-black select-none font-sans antialiased">
      
      {/* ===== ЛЕВЫЙ САЙДБАР ===== */}
      <div
        className={`
          flex flex-col justify-between p-3 border-r border-[#e4e4e7] bg-white h-screen transition-all duration-300 z-30 relative
          ${isLocked 
            ? "w-[73px]" 
            : "w-[73px] hover:w-[245px] group shadow-[0_0_10px_rgba(0,0,0,0.01)] hover:shadow-[4px_0_24px_rgba(0,0,0,0.04)]"
          }
        `}
      >
        {/* ВЕРХНЯЯ ЧАСТЬ МЕНЮ */}
        <div className="flex flex-col gap-1.5 pt-6">
          
          {/* Логотип */}
          <div className="px-3 mb-7 h-10 flex items-center relative overflow-hidden">
            {openSearch ? (
              <Link href="/home" className="text-black hover:scale-105 transition duration-200">
                <InstagramIcon sx={{ fontSize: 28 }} />
              </Link>
            ) : (
              <>
                <div className="block group-hover:opacity-0 transition-opacity duration-200 absolute left-3">
                  <Link href="/home">
                    <InstagramIcon sx={{ fontSize: 28 }} />
                  </Link>
                </div>
                <span className="font-serif text-2xl font-bold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pl-1">
                  Instagram
                </span>
              </>
            )}
          </div>

          {/* Главная */}
          <Link
            href="/home"
            className={`flex items-center gap-4 p-3 rounded-xl hover:bg-[#f4f4f5] transition duration-200 group/link ${
              pathname === "/home" ? "font-bold text-black bg-[#f4f4f5]" : "text-black"
            }`}
          >
            <div className={`min-w-[28px] flex justify-center transition-transform duration-200 ${pathname === "/home" ? "scale-105" : ""}`}>
              {pathname === "/home" ? <HomeIcon sx={{ fontSize: 28 }} /> : <HomeOutlinedIcon sx={{ fontSize: 28 }} />}
            </div>
            <span className={`text-[15px] tracking-wide whitespace-nowrap transition-opacity duration-200 ${pathname === "/home" ? "font-bold" : "font-normal"} ${openSearch ? "hidden" : "opacity-0 group-hover:opacity-100"}`}>
              Home
            </span>
          </Link>

          {/* Поиск */}
          <button
            onClick={toggleSearch}
            className={`flex items-center gap-4 p-3 rounded-xl hover:bg-[#f4f4f5] transition duration-200 text-left ${
              openSearch ? "border border-[#e4e4e7] bg-[#f4f4f5] font-bold" : ""
            }`}
          >
            <div className="min-w-[28px] flex justify-center">
              {openSearch ? <SearchIcon sx={{ fontSize: 28 }} /> : <SearchOutlinedIcon sx={{ fontSize: 28 }} />}
            </div>
            <span className={`text-[15px] tracking-wide whitespace-nowrap ${openSearch ? "hidden" : "opacity-0 group-hover:opacity-100"}`}>
              Search
            </span>
          </button>

          {/* Reels */}
          <Link
            href="/reels"
            className={`flex items-center gap-4 p-3 rounded-xl hover:bg-[#f4f4f5] transition duration-200 ${
              pathname === "/reels" ? "font-bold text-black bg-[#f4f4f5]" : "text-black"
            }`}
          >
            <div className={`min-w-[28px] flex justify-center transition-transform duration-200 ${pathname === "/reels" ? "scale-105" : ""}`}>
              {pathname === "/reels" ? <SmartDisplayIcon sx={{ fontSize: 28 }} /> : <SmartDisplayOutlinedIcon sx={{ fontSize: 28 }} />}
            </div>
            <span className={`text-[15px] tracking-wide whitespace-nowrap ${openSearch ? "hidden" : "opacity-0 group-hover:opacity-100"}`}>
              Reels
            </span>
          </Link>
         <Link
  href="/explore"
  className={`flex items-center gap-4 p-3 rounded-xl hover:bg-[#f4f4f5] transition duration-200 ${
    pathname === "/explore" ? "font-bold text-black bg-[#f4f4f5]" : "text-black"
  }`}
>
  <div className={`min-w-[28px] flex justify-center transition-transform duration-200 ${pathname === "/explore" ? "scale-105" : ""}`}>
    {pathname === "/explore" ? <ExploreIcon sx={{ fontSize: 28 }} /> : <ExploreOutlinedIcon sx={{ fontSize: 28 }} />}
  </div>
  <span className={`text-[15px] tracking-wide whitespace-nowrap ${openSearch ? "hidden" : "opacity-0 group-hover:opacity-100"}`}>
    Explore
  </span>
</Link>
          {/* Сообщения */}
          <Link
            href="/messages"
            className={`flex items-center gap-4 p-3 rounded-xl hover:bg-[#f4f4f5] transition duration-200 ${
              pathname === "/messages" ? "font-bold text-black bg-[#f4f4f5]" : "text-black"
            }`}
          >
            <div className={`min-w-[28px] flex justify-center transition-transform duration-200 ${pathname === "/messages" ? "scale-105" : ""}`}>
              {pathname === "/messages" ? <ChatIcon sx={{ fontSize: 28 }} /> : <ChatOutlinedIcon sx={{ fontSize: 28 }} />}
            </div>
            <span className={`text-[15px] tracking-wide whitespace-nowrap ${openSearch ? "hidden" : "opacity-0 group-hover:opacity-100"}`}>
             Masseges
            </span>
          </Link>

          {/* Уведомления */}
          <Link
            href="/notifications"
            className={`flex items-center gap-4 p-3 rounded-xl hover:bg-[#f4f4f5] transition duration-200 ${
              pathname === "/notifications" ? "font-bold text-black bg-[#f4f4f5]" : "text-black"
            }`}
          >
            <div className={`min-w-[28px] flex justify-center transition-transform duration-200 ${pathname === "/notifications" ? "scale-105" : ""}`}>
              {pathname === "/notifications" ? <FavoriteIcon sx={{ fontSize: 28 }} /> : <FavoriteBorderOutlinedIcon sx={{ fontSize: 28 }} />}
            </div>
            <span className={`text-[15px] tracking-wide whitespace-nowrap ${openSearch ? "hidden" : "opacity-0 group-hover:opacity-100"}`}>
              Notofication
            </span>
          </Link>

          {/* Создать */}
          <Link
            href="/create"
            className={`flex items-center gap-4 p-3 rounded-xl hover:bg-[#f4f4f5] transition duration-200 ${
              pathname === "/create" ? "font-bold text-black bg-[#f4f4f5]" : "text-black"
            }`}
          >
            <div className={`min-w-[28px] flex justify-center transition-transform duration-200 ${pathname === "/create" ? "scale-105" : ""}`}>
              {pathname === "/create" ? <AddBoxIcon sx={{ fontSize: 28 }} /> : <AddBoxOutlinedIcon sx={{ fontSize: 28 }} />}
            </div>
            <span className={`text-[15px] tracking-wide whitespace-nowrap ${openSearch ? "hidden" : "opacity-0 group-hover:opacity-100"}`}>
              Создать
            </span>
          </Link>

          {/* Профиль */}
          <Link
            href="/profile"
            className={`flex items-center gap-4 p-3 rounded-xl hover:bg-[#f4f4f5] transition duration-200 ${
              pathname === "/profile" ? "font-bold text-black bg-[#f4f4f5]" : "text-black"
            }`}
          >
            <div className="min-w-[28px] flex justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb"
                alt="Profile"
                className={`w-7 h-7 rounded-full object-cover transition-transform ${
                  pathname === "/profile" ? "ring-2 ring-black scale-105" : ""
                }`}
              />
            </div>
            <span className={`text-[15px] tracking-wide whitespace-nowrap ${openSearch ? "hidden" : "opacity-0 group-hover:opacity-100"}`}>
              Profile
            </span>
          </Link>
        </div>

        {/* НИЖНЯЯ ЧАСТЬ МЕНЮ ("MORE / ЕЩЕ") */}
        <div className="mb-2 relative">
          <button
            onClick={() => setOpenMore(!openMore)}
            className={`flex items-center gap-4 hover:bg-[#f4f4f5] p-3 rounded-xl w-full text-left transition duration-200 ${
              openMore ? "font-bold bg-[#f4f4f5]" : ""
            }`}
          >
            <div className="min-w-[28px] flex justify-center">
              {openMore ? <MenuIcon sx={{ fontSize: 28 }} /> : <MenuOutlinedIcon sx={{ fontSize: 28 }} />}
            </div>
            <span className={`text-[15px] tracking-wide whitespace-nowrap ${openSearch ? "hidden" : "opacity-0 group-hover:opacity-100"}`}>
              More
            </span>
          </button>

          {/* MORE MODAL */}
          {openMore && (
            <div
              ref={modalRef}
              className="
                absolute
                bottom-[65px]
                left-0
                w-[250px]
                bg-white
                rounded-2xl
                shadow-[0_4px_12px_rgba(0,0,0,0.15)]
                border
                border-gray-100
                py-1.5
                z-50
                transition-all
              "
            >
              <button className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#f4f4f5] transition text-left text-sm font-medium">
                <SettingsIcon fontSize="small" />
                <span>Настройки</span>
              </button>

              <button className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#f4f4f5] transition text-left text-sm font-medium">
                <BoltOutlinedIcon fontSize="small" />
                <span>Ваши действия</span>
              </button>

              <button className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#f4f4f5] transition text-left text-sm font-medium">
                <BookmarkBorderIcon fontSize="small" />
                <span>Сохранено</span>
              </button>

              <button className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#f4f4f5] transition text-left text-sm font-medium">
                <DarkModeOutlinedIcon fontSize="small" />
                <span>Переключить тему</span>
              </button>

              <button 
                onClick={() => {
                  setOpenMore(false);
                  setOpenReport(true);
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#f4f4f5] transition text-left text-sm font-medium"
              >
                <ReportProblemOutlinedIcon fontSize="small" />
                <span>Сообщить о проблеме</span>
              </button>
              
              <div className="h-[1px] bg-gray-100 my-1.5" />
              
              <button
                onClick={() => {
                  localStorage.removeItem("store_token");
                  window.location.href = "/login";
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-red-50 transition text-left text-sm font-semibold text-red-500"
              >
                <LogoutOutlinedIcon fontSize="small" />
                <span>Выйти</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== ВЫЕЗЖАЮЩАЯ МОДАЛКА ПОИСКА ===== */}
      <div
        className={`
          fixed top-0 bottom-0 w-[396px] bg-white border-r border-[#e4e4e7] p-6 pt-8 z-20
          transition-all duration-300 ease-in-out shadow-[10px_0_30px_rgba(0,0,0,0.03)]
          rounded-r-2xl
          ${openSearch ? "left-[73px] opacity-100 visible" : "left-[-400px] opacity-0 invisible"}
        `}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-wide">Поиск</h2>
          <button 
            onClick={closeSearch}
            className="p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-[#f4f4f5] transition"
          >
            <CloseIcon sx={{ fontSize: 22 }} />
          </button>
        </div>

        <div className="relative mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск"
            className="w-full p-2.5 px-4 bg-[#f4f4f5] text-black rounded-lg outline-none text-sm placeholder-gray-400 border border-transparent focus:bg-white focus:border-[#e4e4e7] transition"
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <hr className="border-[#f4f4f5] mb-4" />

        <div className="overflow-y-auto h-[calc(100vh-180px)] pr-1">
          {query === "" ? (
            <>
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-bold text-sm text-black">Недавнее</h3>
                {history.length > 0 && (
                  <button
                    onClick={() => { setHistory([]); localStorage.removeItem("search_history"); }}
                    className="text-xs text-[#0095f6] font-semibold hover:text-[#00376b] transition"
                  >
                    Очистить все
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-16 font-medium">
                  Нет недавних запросов.
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {history.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => openUser(u)}
                      className="p-2 hover:bg-[#f4f4f5] rounded-lg cursor-pointer flex items-center gap-3 transition"
                    >
                      <div className="w-11 h-11 bg-[#f4f4f5] rounded-full flex items-center justify-center font-bold text-gray-500 text-sm">
                        {u.userName?.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm text-black">{u.userName}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <h3 className="font-bold mb-3 text-sm text-gray-400 px-1">Результаты</h3>
              {filtered.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-16">
                  Ничего не найдено
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filtered.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => openUser(u)}
                      className="p-2 hover:bg-[#f4f4f5] rounded-lg cursor-pointer flex items-center gap-3 transition"
                    >
                      <div className="w-11 h-11 bg-[#f4f4f5] rounded-full flex items-center justify-center font-bold text-gray-500 text-sm">
                        {u.userName?.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm text-black">{u.userName}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ===== REPORT MODAL ===== */}
      {openReport && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[500px] bg-white rounded-2xl overflow-hidden shadow-2xl p-6 relative border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setOpenReport(false)}
              className="absolute cursor-pointer top-4 left-4 text-gray-400 hover:text-black transition text-lg"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mt-2 mb-4">
              Оставить отзыв об Instagram
            </h2>
            <textarea 
              placeholder="Что у вас случилось или что вы хотите предложить?" 
              className="w-full h-32 p-3 bg-[#f4f4f5] border border-transparent rounded-xl outline-none text-sm resize-none focus:border-gray-300 focus:bg-white transition mb-4"
            />
            <button 
              onClick={() => setOpenReport(false)}
              className="w-full py-2.5 bg-[#0095f6] hover:bg-[#1877f2] text-white rounded-xl font-semibold text-sm transition"
            >
              Отправить отзыв
            </button>
          </div>
        </div>
      )}

    </div>
  );
}