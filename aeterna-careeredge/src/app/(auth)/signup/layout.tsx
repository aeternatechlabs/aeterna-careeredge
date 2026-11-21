import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Student Account",
  description:
    "Join Aeterna CareerEdge. Build your verified Career Passport, optimize resumes, and accelerate your employability.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
