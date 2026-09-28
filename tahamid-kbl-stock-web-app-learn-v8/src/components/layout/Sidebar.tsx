import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import {
  LayoutDashboard,
  PackagePlus,
  Truck,
  Warehouse,
  TrendingDown,
  Scale,
  CalendarDays,
  Sliders,
  Users,
  History,
  ShieldCheck,
  FileSpreadsheet,
  Sprout,
  X,
  Trash2,
  ChevronRight,
  Code2,
  Phone,
  ExternalLink,
  BarChart3,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

interface NavGroup {
  id: string;
  title: string;
  groupIcon: React.ComponentType<{ className?: string }>;
  accentColor: 'sky' | 'emerald';
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    hasPermission,
    companySettings,
    setIsImportModalOpen,
    recycledItems,
    setIsRecycleModalOpen,
  } = useApp();

  const navGroups: NavGroup[] = [
    {
      id: 'overview-reports',
      title: 'OVERVIEW & REPORTS',
      groupIcon: BarChart3,
      accentColor: 'sky',
      items: [
        {
          id: 'dashboard',
          label: 'DASHBOARD',
          icon: LayoutDashboard,
        },
        {
          id: 'report-cold-storage-in',
          label: 'STOCK IN',
          icon: Warehouse,
          permission: 'view_reports',
        },
        {
          id: 'report-delivery',
          label: 'STOCK OUT',
          icon: TrendingDown,
          permission: 'view_reports',
        },
        {
          id: 'report-closing-stock',
          label: 'STOCK REGISTER',
          icon: Scale,
          permission: 'view_reports',
        },
        {
          id: 'report-daywise-stock',
          label: 'DAY-WISE STOCK REPORT',
          icon: CalendarDays,
          permission: 'view_reports',
        },
        {
          id: 'report-daywise-delivery',
          label: 'DAY-WISE DELIVERY REPORT',
          icon: TrendingDown,
          permission: 'view_reports',
        },
      ],
    },
    {
      id: 'admin-operations',
      title: 'ADMIN & OPERATIONS',
      groupIcon: Sliders,
      accentColor: 'emerald',
      items: [
        {
          id: 'stock-entry-records',
          label: 'STOCK IN ALL RECORD',
          icon: PackagePlus,
          permission: 'view_stock',
        },
        {
          id: 'delivery-entry-records',
          label: 'DELIVERY ALL RECORD',
          icon: Truck,
          permission: 'view_delivery',
        },
        {
          id: 'cold-storage',
          label: 'COLD STORAGES',
          icon: Warehouse,
          permission: 'view_cold_storage',
        },
        {
          id: 'master-data',
          label: 'MASTER DATA',
          icon: Sliders,
          permission: 'view_settings',
        },
        {
          id: 'users-roles',
          label: 'USERS & ROLES',
          icon: Users,
          permission: 'view_users',
        },
        {
          id: 'audit-logs',
          label: 'AUDIT LOGS',
          icon: History,
          permission: 'view_audit_logs',
        },
        {
          id: 'settings',
          label: 'SETTINGS',
          icon: ShieldCheck,
          permission: 'manage_settings',
        },
      ],
    },
  ];

  const groupThemes = {
    sky: {
      header: 'bg-gradient-to-r from-[#17253a] via-[#1d2d44] to-[#162234] hover:from-[#1d2f4a] hover:to-[#1b2b40] border-sky-500/40 hover:border-sky-400/80 text-sky-100 hover:text-white shadow-xs',
      iconBadge: 'bg-sky-500/20 border-sky-400/35 text-sky-300 group-hover:bg-sky-500/30',
      headerIcon: 'text-sky-300',
      dot: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]',
      borderGuide: 'border-sky-500/35',
      itemIdle: 'bg-[#18202c]/75 hover:bg-[#222c3c] text-slate-300 hover:text-white border-slate-700/50 hover:border-sky-500/60 font-semibold',
      itemActive: 'bg-gradient-to-r from-sky-900/80 via-sky-800/85 to-[#1c2534] text-white font-bold border-sky-400/80 shadow-xs ring-1 ring-sky-400/25',
      iconIdle: 'text-sky-400/70 group-hover:text-sky-300',
      iconActive: 'text-sky-300 drop-shadow-xs',
      badge: 'bg-sky-950/80 text-sky-300 border-sky-600/50',
      activeBadge: 'bg-sky-900 text-white border-sky-400/60',
      chevron: 'text-sky-300',
    },
    emerald: {
      header: 'bg-gradient-to-r from-[#132c25] via-[#18362e] to-[#122721] hover:from-[#17372e] hover:to-[#173129] border-emerald-500/40 hover:border-emerald-400/80 text-emerald-100 hover:text-white shadow-xs',
      iconBadge: 'bg-emerald-500/20 border-emerald-400/35 text-emerald-300 group-hover:bg-emerald-500/30',
      headerIcon: 'text-emerald-300',
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
      borderGuide: 'border-emerald-500/35',
      itemIdle: 'bg-[#18202c]/75 hover:bg-[#1b2b23] text-slate-300 hover:text-white border-slate-700/50 hover:border-emerald-500/60 font-semibold',
      itemActive: 'bg-gradient-to-r from-emerald-900/80 via-emerald-800/85 to-[#192620] text-white font-bold border-emerald-400/80 shadow-xs ring-1 ring-emerald-400/25',
      iconIdle: 'text-emerald-400/70 group-hover:text-emerald-300',
      iconActive: 'text-emerald-300 drop-shadow-xs',
      badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50',
      activeBadge: 'bg-emerald-900 text-white border-emerald-400/60',
      chevron: 'text-emerald-300',
    },
  };

  const isAdminTab = [
    'stock-entry-records',
    'stock-register',
    'stock-entry',
    'delivery-entry-records',
    'delivery-register',
    'cold-storage',
    'master-data',
    'users-roles',
    'audit-logs',
    'settings',
  ].includes(activeTab);

  const [isOverviewExpanded, setIsOverviewExpanded] = React.useState<boolean>(true);
  const [isAdminExpanded, setIsAdminExpanded] = React.useState<boolean>(isAdminTab);

  // When clicking an item, navigate to that page AND collapse both menus back as requested
  const handleSelect = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsOverviewExpanded(false);
    setIsAdminExpanded(false);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Ash-toned Sidebar with w-56 compact width */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-56 bg-[#222834] text-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-700/70 shadow-2xl lg:shadow-none no-print`}
      >
        {/* Company Branding - Left aligned with matching px-3 padding */}
        <div className="flex items-center justify-between h-15 px-3 border-b border-slate-700/70 bg-[#1a202c]/95 shrink-0">
          <button
            onClick={() => handleSelect('dashboard')}
            className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity group cursor-pointer focus:outline-none min-w-0 flex-1"
            title="Go to Dashboard"
          >
            {companySettings.logoUrl ? (
              <img
                src={companySettings.logoUrl}
                alt={companySettings.companyName}
                className="w-7 h-7 rounded-lg object-contain bg-white/10 p-0.5 border border-white/20 shadow-md group-hover:scale-105 transition-transform shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform border border-white/20 shrink-0">
                <Sprout className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-[11px] font-black tracking-tight text-white leading-tight truncate group-hover:text-sky-300 transition-colors uppercase">
                {companySettings.companyName || companySettings.logoText || 'KISHAN BOTANIX LTD.'}
              </h1>
              <p className="text-[8.5px] text-sky-400 font-bold tracking-wider uppercase truncate mt-0.5">
                {companySettings.companyTagline || companySettings.tagline || 'INVENTORY MANAGEMENT APP'}
              </p>
            </div>
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 lg:hidden cursor-pointer shrink-0 ml-1"
            title="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation scrollable area - with pt-5 breathing space so it starts nicely below company header */}
        <div className="flex-1 overflow-y-auto px-3 pt-5 pb-3 space-y-3">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.permission || hasPermission(item.permission as any)
            );

            if (visibleItems.length === 0) return null;

            const theme = groupThemes[group.accentColor];
            const isOverviewGroup = group.id === 'overview-reports';
            const isAdminGroup = group.id === 'admin-operations';
            const isExpanded = isOverviewGroup ? isOverviewExpanded : isAdminGroup ? isAdminExpanded : true;
            const GroupIcon = group.groupIcon;

            const toggleExpand = () => {
              if (isOverviewGroup) {
                setIsOverviewExpanded((prev) => !prev);
              } else if (isAdminGroup) {
                setIsAdminExpanded((prev) => !prev);
              }
            };

            return (
              <div key={group.title} className="space-y-1">
                {/* Main Menu Button 1 & 2: Executive styling, taller height, distinct Outfit geometric font, no truncation */}
                <button
                  type="button"
                  onClick={toggleExpand}
                  className={`w-full flex items-center justify-between px-2 py-2 min-h-[42px] rounded-xl border select-none transition-all duration-200 cursor-pointer ${theme.header} group active:scale-[0.99]`}
                  title={`Toggle ${group.title} menu`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center shrink-0 border shadow-2xs transition-all group-hover:scale-105 ${theme.iconBadge}`}>
                      <GroupIcon className={`w-3.5 h-3.5 ${theme.headerIcon}`} />
                    </div>
                    <span className="font-nav-main text-[9.5px] font-extrabold tracking-tight uppercase whitespace-nowrap text-slate-100 group-hover:text-white drop-shadow-xs">
                      {group.title}
                    </span>
                  </div>

                  {/* Right side: sleek indicator pill with heavy > symbol */}
                  <div className="flex items-center shrink-0 ml-1">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isExpanded
                        ? 'bg-white/15 border-white/25 text-white'
                        : 'bg-black/20 border-white/10 text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform duration-200 stroke-[3] ${
                          isExpanded ? 'rotate-90 text-white' : ''
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Sub-tree Container for Child Menu Buttons (compact height, smaller font, lighter weight) */}
                {isExpanded && (
                  <div className="ml-2.5 pl-2.5 border-l border-slate-700/60 space-y-1 pt-1.5 pb-1 transition-all duration-200">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        activeTab === item.id ||
                        (item.id === 'dashboard' && activeTab === 'dashboard') ||
                        (item.id === 'stock-entry-records' &&
                          (activeTab === 'stock-entry-records' ||
                            activeTab === 'stock-register' ||
                            activeTab === 'stock-entry')) ||
                        (item.id === 'delivery-entry-records' &&
                          (activeTab === 'delivery-entry-records' || activeTab === 'delivery-register')) ||
                        (item.id === 'report-cold-storage-in' &&
                          (activeTab === 'report-cold-storage-in' || activeTab === 'reports-stock')) ||
                        (item.id === 'report-delivery' &&
                          (activeTab === 'report-delivery' || activeTab === 'reports-delivery')) ||
                        (item.id === 'report-closing-stock' &&
                          (activeTab === 'report-closing-stock' ||
                            activeTab === 'reports-closing' ||
                            activeTab === 'reports-in-out' ||
                            activeTab === 'reports-dimensions' ||
                            activeTab === 'report-combined' ||
                            activeTab === 'reports-storage' ||
                            activeTab === 'reports-sr' ||
                            activeTab === 'report-sr-status' ||
                            activeTab === 'reports-challan' ||
                            activeTab === 'report-challan-status')) ||
                        (item.id === 'report-daywise-stock' && activeTab === 'report-daywise-stock') ||
                        (item.id === 'report-daywise-delivery' && activeTab === 'report-daywise-delivery');

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.id)}
                          className={`w-full group flex items-center justify-between px-2.5 py-1.5 min-h-[30px] rounded-md transition-all cursor-pointer ${
                            isActive
                              ? theme.itemActive
                              : `${theme.itemIdle}`
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon
                              className={`w-3 h-3 shrink-0 transition-transform ${
                                isActive ? theme.iconActive : theme.iconIdle
                              }`}
                            />
                            <span className="truncate uppercase text-[8.5px] tracking-normal text-left">
                              {item.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {item.badge && (
                              <span
                                className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full transition-colors ${
                                  isActive ? theme.activeBadge : theme.badge
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            {isActive && (
                              <ChevronRight className={`w-2.5 h-2.5 stroke-[2.5] ${theme.chevron}`} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Main Menu Button 3 & 4: RECYCLE BIN & IMPORT EXCEL - Executive styling matching buttons 1 & 2 */}
          <div className="pt-2.5 space-y-1.5 border-t border-slate-700/60">
            {/* RECYCLE BIN Main Menu Button */}
            <button
              onClick={() => {
                setIsRecycleModalOpen(true);
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center justify-between px-2 py-2 min-h-[42px] rounded-xl text-rose-100 hover:text-white bg-gradient-to-r from-[#2c161d] via-[#351a23] to-[#241318] hover:from-[#3a1d27] hover:to-[#2c171e] border border-rose-600/40 hover:border-rose-400/80 transition-all duration-200 shadow-xs shadow-rose-950/30 cursor-pointer group active:scale-[0.99]"
              title="Open Recycle Bin"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6.5 h-6.5 rounded-lg bg-rose-500/20 border border-rose-400/35 text-rose-300 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-rose-500/30 transition-all">
                  <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                </div>
                <span className="font-nav-main text-[9.5px] font-extrabold tracking-tight uppercase whitespace-nowrap text-rose-100 group-hover:text-white drop-shadow-xs">
                  RECYCLE BIN
                </span>
              </div>
              {recycledItems.length > 0 && (
                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/50 shrink-0 ml-1 shadow-2xs">
                  {recycledItems.length}
                </span>
              )}
            </button>

            {/* IMPORT EXCEL Main Menu Button */}
            <button
              onClick={() => {
                setIsImportModalOpen(true);
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center justify-between px-2 py-2 min-h-[42px] rounded-xl text-emerald-100 hover:text-white bg-gradient-to-r from-[#122c22] via-[#17352a] to-[#11261d] hover:from-[#16382b] hover:to-[#152e23] border border-emerald-600/40 hover:border-emerald-400/80 transition-all duration-200 shadow-xs shadow-emerald-950/30 cursor-pointer group active:scale-[0.99]"
              title="Import Data from Excel"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6.5 h-6.5 rounded-lg bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-emerald-500/30 transition-all">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <span className="font-nav-main text-[9.5px] font-extrabold tracking-tight uppercase whitespace-nowrap text-emerald-100 group-hover:text-white drop-shadow-xs">
                  IMPORT EXCEL
                </span>
              </div>
              <span className="text-[7.5px] font-black font-mono uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shrink-0 ml-1 shadow-2xs">
                XLSX
              </span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Attractive Developer Branding Button with Link to Facebook */}
        <div className="p-2 border-t border-slate-700/70 bg-[#1a202c]/95 shrink-0">
          <a
            href="https://www.facebook.com/Tahamid.Faruk"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full relative group overflow-hidden rounded-lg p-[1.5px] focus:outline-none block transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-slate-900/50"
            title="Open Developer Profile (Tahamid Faruk)"
          >
            {/* Animated multi-color gradient border */}
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 via-purple-500 to-pink-500 rounded-lg group-hover:from-cyan-400 group-hover:via-indigo-400 group-hover:to-pink-500 transition-all duration-500" />
            <span className="relative flex items-center gap-1.5 px-2 py-1.5 rounded-[7px] bg-[#1a202c] group-hover:bg-[#151a23] transition-colors">
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-sky-500 via-indigo-500 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-sm group-hover:rotate-6 transition-transform">
                <Code2 className="w-3 h-3 text-white drop-shadow-xs" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-[9px] font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-200 to-pink-300 truncate uppercase">
                  DEVELOPED BY @ TAHAMID
                </div>
                <div className="text-[8px] font-bold text-slate-300 flex items-center gap-0.5 truncate mt-0.5">
                  <Phone className="w-2 h-2 text-emerald-400 shrink-0" />
                  <span className="tracking-tight text-emerald-300">019 77 87 87 18</span>
                </div>
              </div>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-sky-300 shrink-0 transition-colors" />
            </span>
          </a>
        </div>
      </aside>
    </>
  );
};
