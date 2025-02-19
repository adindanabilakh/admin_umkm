"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

// Ambil BASE_URL dari .env
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ 1. Ambil CSRF Token dulu
      await axios.get(`${API_BASE_URL}/sanctum/csrf-cookie`, {
        withCredentials: true,
      });

      // ✅ 2. Ambil CSRF Token dari cookie
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="))
        ?.split("=")[1];

      if (!csrfToken) {
        throw new Error("CSRF token tidak ditemukan");
      }

      // ✅ 3. Kirim login request dengan headers yang benar
      const res = await axios.post(
        `${API_BASE_URL}/api/admin/login`,
        { email, password },
        {
          withCredentials: true,
          headers: {
            "X-XSRF-TOKEN": decodeURIComponent(csrfToken), // 🔥 Wajib ada
            Accept: "application/json", // 🔥 Wajib untuk JSON response
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Login Response:", res); // 🔍 Debug response

      if (!res.data.token) {
        throw new Error("Login gagal: Token tidak diterima.");
      }

      // ✅ 4. Simpan token ke localStorage
      localStorage.setItem("token", res.data.token);

      toast({
        title: "Login Berhasil",
        description: "Selamat datang di UMKM Admin Dashboard!",
      });

      router.push("/");
    } catch (err: any) {
      console.error("Login Error:", err);
      toast({
        title: "Login Gagal",
        description: err.message || "Terjadi kesalahan saat login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Masukkan kredensial untuk mengakses Admin Dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <CardFooter className="flex justify-between mt-4">
                <Button type="button" variant="outline">
                  Lupa Password?
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Login"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
