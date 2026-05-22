"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("store_token");

    if (!token) {
      router.replace("/login");
    } else {
      router.replace("/home");
    }
  }, []);

  return null;
} 