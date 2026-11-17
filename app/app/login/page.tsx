import { loginPegawai } from "@/app/actions";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <AuthCard title="Presensi Pegawai" subtitle="Masuk dengan NIP Anda">
      <LoginForm action={loginPegawai} identifierLabel="NIP" />
    </AuthCard>
  );
}
