"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardData, fetchDashboardData } from "@/services/dashboard";
export function useDashboardData() {
 const [data,setData]=useState<DashboardData|null>(null); const [error,setError]=useState(""); const router=useRouter();
 useEffect(()=>{let alive=true; fetchDashboardData().then(v=>{if(alive)setData(v)}).catch(e=>{if(alive){setError(e.message);router.replace("/auth/login?returnTo=/dashboard")}});return()=>{alive=false}},[router]);
 const profile=data?{name:data.user.username,email:data.user.email,avatarUrl:data.user.avatar_url||"",roleBadge:data.user.role_badge||""}:{name:"",email:"",avatarUrl:"",roleBadge:""};
 return {data,error,profile};
}
