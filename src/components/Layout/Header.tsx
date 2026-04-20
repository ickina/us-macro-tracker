import { Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-center sm:justify-start">
        <div className="flex items-center gap-2 w-fit sm:w-full">
          <div className="bg-blue-500/10 p-1.5 md:p-2 rounded-lg flex-shrink-0">
            <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          </div>
          <h1 className="text-[28px] sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent whitespace-nowrap tracking-tighter">
            イチの米経済指標ダッシュボード
          </h1>
        </div>
      </div>
    </header>
  );
}
