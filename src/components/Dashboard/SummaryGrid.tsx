export function SummaryGrid({ children, featured = false }: { children: React.ReactNode; featured?: boolean }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-2 sm:p-4 ${featured ? '' : 'xl:grid-cols-4'}`}>
      {children}
    </div>
  );
}
