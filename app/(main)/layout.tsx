import Navbar from "@/app/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar/>
      <div className="ml-[73px] flex-1">{children}</div>
    </div>
  );
}
