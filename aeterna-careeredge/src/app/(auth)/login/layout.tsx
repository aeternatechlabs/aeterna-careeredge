import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Login",
  description:
    "Sign in to your Aeterna CareerEdge account to access your Career Passport, AI Resume Studio, and job matches.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
