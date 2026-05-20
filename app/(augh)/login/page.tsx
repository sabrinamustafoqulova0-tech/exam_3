"use client";
import React, { useState } from "react";
import "../../globals.css";
import { useLoginMutation } from "@/app/services/authApi";
import { SaveToken } from "@/app/utils/token";
import { useRouter } from "next/navigation";
const Login = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const [login, { isLoading, error }] = useLoginMutation();

  async function handleLogin(e: any) {
    e.preventDefault();

    try {
      const res = await login({
        userName,
        password,
      }).unwrap();

      const token = res.data;

      SaveToken(token);

      router.push("/home");
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
              <img
                className="h-10"
                src="https://static.cdninstagram.com/rsrc.php/v3/yz/r/c5Rp7Ym-Klz.png"
                alt="google play"
              />

              <img
                className="h-10 rounded-[10px]"
                src="https://static.cdninstagram.com/rsrc.php/v3/yu/r/EHY6QnZYdNX.png"
                alt="microsoft"
              />
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

            <form onSubmit={handleLogin} className="flex flex-col gap-2">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="UserName"
                className="h-[38px] border border-gray-300 bg-[#fafafa] rounded-[3px] px-3 text-xs outline-none focus:border-gray-400"
              />

              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[38px] border border-gray-300 bg-[#fafafa] rounded-[3px] px-3 text-xs outline-none focus:border-gray-400"
                />

                <span className="absolute right-3 top-[10px] text-gray-500 cursor-pointer">
                  👁
                </span>
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="bg-[#4cb5f9] hover:bg-[#2ea3f7] transition-all text-white font-semibold text-sm h-[32px] rounded-lg mt-3"
              >
                {isLoading ? "Loading..." : "Login"}
              </button>
              {error && <p>Login error</p>}
            </form>

            <div className="flex items-center my-5">
              <div className="flex-1 h-[1px] bg-gray-300"></div>

              <span className="px-4 text-xs font-semibold text-gray-400 uppercase">
                or
              </span>

              <div className="flex-1 h-[1px] bg-gray-300"></div>
            </div>

            <button className="flex items-center justify-center gap-2 w-full mb-5">
              <svg className="w-4 h-4 fill-[#385185]" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>

              <span className="text-[14px] font-semibold text-[#385185]">
                Log in with Facebook
              </span>
            </button>

            <div className="text-center">
              <a
                href="#"
                className="text-[12px] text-[#00376b] hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <div className="w-[450px] border-2 border-gray-100  mt-3 py-5 text-center rounded-3xl">
            <p className="text-sm">
              Don&apos;t have an account?{" "}
              <a
                href="/register"
                className="text-[#0095f6] font-semibold hover:underline"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
