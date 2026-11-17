import { changePassword } from "@/app/actions";
import { AuthCard } from "@/components/auth-card";
import { ChangePasswordForm } from "@/components/auth-forms";

export default function GantiPasswordPage() {
  return (
    <AuthCard
      title="Ganti Password"
      subtitle="Demi keamanan, buat password baru sebelum memakai aplikasi"
    >
      <ChangePasswordForm action={changePassword} />
    </AuthCard>
  );
}
