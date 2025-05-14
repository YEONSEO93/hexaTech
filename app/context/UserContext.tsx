// app/context/UserContext.tsx

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

type UserContextType = {
  userId: string | null;
  userRole: string | null;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType>({
  userId: null,
  userRole: null,
  isLoading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClientComponentClient<Database>();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   const fetchUser = async () => {
  //     const {
  //       data: { user },
  //     } = await supabase.auth.getUser();
  //     if (user) {
  //       setUserId(user.id);
  //       setUserRole(user.user_metadata.role);
  //     }
  //     setIsLoading(false);
  //   };

  //   fetchUser();

  //   const {
  //     data: { subscription },
  //   } = supabase.auth.onAuthStateChange(() => {
  //     fetchUser();
  //   });

  //   return () => {
  //     subscription?.unsubscribe();
  //   };
  // }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);

        const { data: userRecord } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userRecord && userRecord.role) {
          console.log("✅ Logged-in role:", userRecord.role);
          setUserRole(userRecord.role);
        } else {
          console.warn("❌ No role found for user:", user.id);
          setUserRole(null);
        }
      }

      setIsLoading(false);
    };

    fetchUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ userId, userRole, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
