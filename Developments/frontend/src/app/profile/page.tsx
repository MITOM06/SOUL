import ProfileForm from "../../components/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <div>
      {/* Tiêu đề */}
      <h1 className="text-xl font-bold mb-4">Personal Information</h1>

      {/* Form thông tin cá nhân */}
      <ProfileForm />
    </div>
  );
}
