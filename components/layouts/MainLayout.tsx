interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen pl-[260px] p-8 bg-[#F8F9FA]">{children}</div>
  );
}
