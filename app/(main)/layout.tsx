import Navbar from "@/app/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-black">
      <Navbar />
      <div className="flex-1 h-screen overflow-hidden bg-black text-white">{children}</div>
    </div>
  );
}