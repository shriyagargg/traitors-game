import React from "react";
import type { Metadata } from "next";
import { AuthPageContainer } from "@/components/auth/AuthPageContainer";

export const metadata: Metadata = {
  title: "Authentication — AI TRAITORS: The Architect",
  description: "Access your AI TRAITORS account or register as a new initiate.",
};

export default function AuthPage() {
  return <AuthPageContainer defaultMode="login" />;
}
