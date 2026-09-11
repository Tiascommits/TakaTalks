import { adminUserCount } from "@/lib/admin/auth";
import { AdminSetupForm } from "@/components/admin/AdminSetupForm";

export const metadata = { title: "Admin setup — Takatox" };
export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  const alreadySetUp = (await adminUserCount()) > 0;

  return (
    <div className="max-w-[420px] mx-auto mt-16 px-5">
      {alreadySetUp ? (
        <p className="text-sm text-muted">
          Admin accounts already exist — go to{" "}
          <a href="/admin/rates" className="underline text-green-deep">
            /admin/rates
          </a>{" "}
          to sign in.
        </p>
      ) : (
        <AdminSetupForm />
      )}
    </div>
  );
}
