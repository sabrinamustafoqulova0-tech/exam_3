<<<<<<< HEAD
import Navbar from "@/app/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Navbar/>
      <div className="flex-1">{children}</div>
    </div>
  );
}
=======
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
>>>>>>> d7940752846932116b3599ce055539de74766e95
