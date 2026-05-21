import Navbar from "@/app/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-white text-black">
      <Navbar />
      <div className="flex-1 h-screen overflow-hidden bg-white text-black">{children}</div>
    </div>
  );
}