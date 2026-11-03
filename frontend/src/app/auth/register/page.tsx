import React from "react";
import type { Metadata } from "next";
import { AuthPageContainer } from "@/components/auth/AuthPageContainer";

export const metadata: Metadata = {
  title: "Register Initiate — AI TRAITORS: The Architect",
  description: "Create your account and claim your seat at the council table of The Architect.",
};

export default function RegisterPage() {
  return <AuthPageContainer defaultMode="register" />;
}
