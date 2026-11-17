import { changePassword } from "@/app/actions";
import { AuthCard } from "@/components/auth-card";
import { ChangePasswordForm } from "@/components/auth-forms";

export default function AdminGantiPasswordPage() {
  return (
    <AuthCard
      title="Ganti Password Admin"
      subtitle="Buat password baru sebelum mengakses dashboard"
    >
      <ChangePasswordForm action={changePassword} />
    </AuthCard>
  );
}
