// app/users/create/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { Sidebar } from "@/components/sidebar";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateUserPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <Sidebar />
      <div className="min-h-screen pl-[260px] p-8 bg-[#F8F9FA]">
        <PageHeader title="Create User" />
        <div className="p-8 flex justify-start">
          <div className="w-[600px] bg-white rounded-lg p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                id="username"
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                id="email"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                id="password"
                label="Temporary Password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex justify-end space-x-4">
                <Button type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
