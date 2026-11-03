import React from "react";
import type { Metadata } from "next";
import { AuthPageContainer } from "@/components/auth/AuthPageContainer";

export const metadata: Metadata = {
  title: "Login — AI TRAITORS: The Architect",
  description: "Login to your account and re-enter the game of strategy, deception and intelligence.",
};

export default function LoginPage() {
  return <AuthPageContainer defaultMode="login" />;
}
