import Navbar from "@/app/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Обертка для фиксации при скролле */}
        <Navbar />
      
      <div className="flex-1">{children}</div>
    </div>
  );
}