import { loginAdmin } from "@/app/actions";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/auth-forms";

export default function AdminLoginPage() {
  return (
    <AuthCard title="Admin Presensi" subtitle="Masuk dengan username admin">
      <LoginForm action={loginAdmin} identifierLabel="Username" />
    </AuthCard>
  );
}
