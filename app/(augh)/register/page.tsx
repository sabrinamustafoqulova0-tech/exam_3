"use client";
import React, { useState } from "react";
import "../../globals.css";
import { useRegisterMutation } from "@/app/services/authApi";
import { useRouter } from "next/navigation";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";

const Login = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [register, { isLoading, error }] = useRegisterMutation();

  async function handleRegister(e: any) {
    e.preventDefault();

    try {
      const res = await register({
        userName,
        email,
        password,
        confirmPassword,
        fullName,
      }).unwrap();

      console.log(res);

      router.push("/login");
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="flex gap-[150px] justify-center items-center gap-8">
        <div className="hidden md:block">
          <img src="/image.png" alt="" />
          <div className="mt-5 text-center">
            <p className="text-sm mb-4">Get the app.</p>

            <div className="flex items-center gap-4">
              <a
                href="https://play.google.com/store/apps/details?id=com.instagram.android&hl=ru"
                target="_blank"
              >
                <img
                  className="h-10"
                  src="https://static.cdninstagram.com/rsrc.php/v3/yz/r/c5Rp7Ym-Klz.png"
                  alt="google play"
                />
              </a>

              <a
                href="https://apps.microsoft.com/detail/9NBLGGH5L9XT?hl=ru-ru&gl=TJ&ocid=pdpshare"
                target="_blank"
              >
                <img
                  className="h-10 rounded-[10px]"
                  src="https://static.cdninstagram.com/rsrc.php/v3/yu/r/EHY6QnZYdNX.png"
                  alt="microsoft"
                />
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-[450px] border-2 border-gray-100 bg-white px-10 py-[50px] rounded-3xl">
            <div className="mt-[-40px] w-[184px] m-auto">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTbnnLuoUQUkbjl12fbJ63azdzI0EcGRlJG-g&s"
                alt=""
              />
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="h-[38px] border border-gray-300 bg-[#fafafa] rounded-[3px] px-3 text-xs outline-none focus:border-gray-400"
              />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="h-[38px] border border-gray-300 bg-[#fafafa] rounded-[3px] px-3 text-xs outline-none focus:border-gray-400"
              />
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Username"
                className="h-[38px] border border-gray-300 bg-[#fafafa] rounded-[3px] px-3 text-xs outline-none focus:border-gray-400"
              />
              <input
                type="text"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="confirmPassword"
                className="h-[38px] border border-gray-300 bg-[#fafafa] rounded-[3px] px-3 text-xs outline-none focus:border-gray-400"
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[38px] border border-gray-300 bg-[#fafafa] rounded-[3px] px-3 text-xs outline-none focus:border-gray-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[8px] text-gray-500"
                >
                  {showPassword ? (
                    <VisibilityOffIcon fontSize="small" />
                  ) : (
                    <VisibilityIcon fontSize="small" />
                  )}
                </button>
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="bg-[#4cb5f9] hover:bg-[#2ea3f7] transition-all text-white font-semibold text-sm h-[32px] rounded-lg mt-3"
              >
                {isLoading ? "Loading..." : "Register"}
              </button>
              {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm animate-fade-in">
                  {/* Иконка предупреждения */}
                  <svg
                    className="h-5 w-5 shrink-0 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>

                  <div>
                    <h4 className="font-semibold text-red-900">
                      Authentication Error
                    </h4>
                    <p className="mt-1 text-red-700 leading-relaxed">
                      Such a user already exists, please try using a different
                      name.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>
          <div className="w-[450px] border-2 border-gray-100  mt-3 py-5 text-center rounded-3xl">
            <p className="text-sm">
              Have an account?
              <a
                href="/login"
                className="text-[#0095f6] font-semibold hover:underline"
              >
                Login in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
