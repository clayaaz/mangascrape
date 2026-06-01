import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/", label: "Browse", icon: "⌂" },
  { to: "/history", label: "History", icon: "◷" },
  { to: "/downloads", label: "Download", icon: "⬇" },
];

export function TabLayout() {
  return (
    <div className="flex min-h-full flex-col bg-[#08080C]">
      <main className="flex-1 overflow-auto pb-28">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-violet-500/10 bg-[#08080C] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-4 my-2.5 overflow-hidden rounded-[22px] border border-violet-500/20 bg-[rgba(10,9,18,0.96)] backdrop-blur-xl">
          <div className="flex gap-2 px-3 py-2">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === "/"}
                className={({ isActive }) =>
                  `relative flex flex-1 flex-col items-center gap-0.5 rounded-[14px] px-5 py-2 transition-colors ${
                    isActive
                      ? "bg-violet-500/15"
                      : "hover:bg-white/[0.03]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`text-xl ${isActive ? "text-violet-400" : "text-[#4a4060]"}`}
                    >
                      {tab.icon}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isActive ? "text-violet-300" : "text-[#4a4060]"
                      }`}
                    >
                      {tab.label}
                    </span>
                    {isActive && (
                      <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-violet-400" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
