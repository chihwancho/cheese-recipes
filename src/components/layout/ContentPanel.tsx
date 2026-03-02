interface ContentPanelProps {
  children: React.ReactNode;
}

export default function ContentPanel({ children }: ContentPanelProps) {
  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
      {children}
    </main>
  );
}
