import Navbar from "@/modules/home/ui/components/navbar";

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <div className="flex-1">{children}</div>
    </main>
  );
};

export default Layout;
