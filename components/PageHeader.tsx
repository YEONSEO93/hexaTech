interface PageHeaderProps {
  title: string;
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="px-8 py-4">
      <h1 className="text-3xl font-semibold">{title}</h1>
    </div>
  );
}
