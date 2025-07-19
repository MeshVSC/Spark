import { useState, useEffect, useRef } from "react";
import { CustomCheckbox } from "./CustomCheckbox";
import { useSettings } from "../contexts/SettingsContext";
import { DataImport } from "./DataImport";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'quickentry' | 'reminders' | 'calendar' | 'shortcuts' | 'import'>('general');
  const modalRef = useRef<HTMLDivElement>(null);
  const { settings, updateSetting } = useSettings();

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabs = [
    { 
      id: 'general' as const, 
      name: 'General', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      )
    },
    { 
      id: 'quickentry' as const, 
      name: 'Quick Entry', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      )
    },
    { 
      id: 'reminders' as const, 
      name: 'Reminders', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="m13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      )
    },
    { 
      id: 'calendar' as const, 
      name: 'Calendar', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      )
    },
    { 
      id: 'shortcuts' as const, 
      name: 'Shortcuts', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <path d="M9 9h6v6h-6z"></path>
          <path d="M9 1v6"></path>
          <path d="M15 1v6"></path>
          <path d="M9 17v6"></path>
          <path d="M15 17v6"></path>
          <path d="M1 9h6"></path>
          <path d="M1 15h6"></path>
          <path d="M17 9h6"></path>
          <path d="M17 15h6"></path>
        </svg>
      )
    },
    { 
      id: 'import' as const, 
      name: 'Import', 
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7,10 12,15 17,10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      )
    },
  ];

  return (
    <div className="things-modal">
      <div ref={modalRef} className="things-modal-content w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header with tabs */}
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-center pt-4 pb-2">
            <div className="flex bg-white rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium rounded-md transition-all ${
                    activeTab === tab.id
                      ? 'bg-gray-100 shadow-sm'
                      : 'hover:bg-gray-50'
                  }`}
                  style={{
                    color: activeTab === tab.id ? 'var(--things-gray-900)' : 'var(--things-gray-600)'
                  }}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="text-sm font-medium w-64 text-right pr-4" style={{ color: 'var(--things-gray-700)' }}>
                    Move completed items to Logbook:
                  </label>
                  <select 
                    value={settings.moveCompletedToLogbook} 
                    onChange={(e) => updateSetting('moveCompletedToLogbook', e.target.value as any)}
                    className="px-0 py-2 border-none bg-transparent text-xs outline-none" 
                    style={{ color: 'var(--things-gray-600)' }}
                  >
                    <option value="immediately">Immediately</option>
                    <option value="after1day">After 1 day</option>
                    <option value="after1week">After 1 week</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="text-sm font-medium w-64 text-right pr-4" style={{ color: 'var(--things-gray-700)' }}>
                    Badge count:
                  </label>
                  <select 
                    value={settings.badgeCount} 
                    onChange={(e) => updateSetting('badgeCount', e.target.value as any)}
                    className="px-0 py-2 border-none bg-transparent text-xs outline-none" 
                    style={{ color: 'var(--things-gray-600)' }}
                  >
                    <option value="today">Today</option>
                    <option value="inbox">Inbox</option>
                    <option value="all">All</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CustomCheckbox 
                    checked={settings.showViewCounts} 
                    onChange={(checked) => updateSetting('showViewCounts', checked)}
                    className="mt-1" 
                  />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Show task counts for views
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Display numbers next to Inbox, Today, Completed, etc.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CustomCheckbox 
                    checked={settings.showProjectCounts} 
                    onChange={(checked) => updateSetting('showProjectCounts', checked)}
                    className="mt-1" 
                  />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Show task counts for projects
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Display numbers next to project names
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CustomCheckbox 
                    checked={settings.showProjectDropdowns} 
                    onChange={(checked) => updateSetting('showProjectDropdowns', checked)}
                    className="mt-1" 
                  />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Show project dropdown arrows
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Display arrows to expand/collapse project task lists
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CustomCheckbox 
                    checked={settings.groupTodosByProject} 
                    onChange={(checked) => updateSetting('groupTodosByProject', checked)}
                    className="mt-1" 
                  />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Group to-dos in the Today list by project or area
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Organizes tasks under project and area headings
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CustomCheckbox 
                    checked={settings.smartTimeGrouping} 
                    onChange={(checked) => updateSetting('smartTimeGrouping', checked)}
                    className="mt-1" 
                  />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Smart time grouping in Today view
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Automatically group tasks by time periods (This Morning, This Afternoon, etc.)
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CustomCheckbox 
                    checked={settings.preserveWindowWidth} 
                    onChange={(checked) => updateSetting('preserveWindowWidth', checked)}
                    className="mt-1" 
                  />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Preserve window width when resizing sidebar
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Maintains consistent layout proportions
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CustomCheckbox 
                    checked={settings.showEmptyTimePeriods} 
                    onChange={(checked) => updateSetting('showEmptyTimePeriods', checked)}
                    className="mt-1" 
                  />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Show empty time periods
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Display time sections even when they contain no tasks
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quickentry' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                  Default project for Quick Entry:
                </label>
                <select className="px-0 py-2 border-none bg-transparent text-xs outline-none" style={{ color: 'var(--things-gray-600)' }}>
                  <option>Inbox</option>
                  <option>Current project</option>
                  <option>Last used project</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CustomCheckbox checked={true} className="mt-1" />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Natural language date parsing
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Recognize phrases like "tomorrow", "next week", "friday"
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CustomCheckbox checked={true} className="mt-1" />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Show date suggestions
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Display suggested dates as you type
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                  Default reminder time:
                </label>
                <select className="px-0 py-2 border-none bg-transparent text-xs outline-none" style={{ color: 'var(--things-gray-600)' }}>
                  <option>9:00 AM</option>
                  <option>12:00 PM</option>
                  <option>6:00 PM</option>
                  <option>Custom</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CustomCheckbox checked={false} className="mt-1" />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Location-based reminders
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Trigger reminders based on your location
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CustomCheckbox checked={true} className="mt-1" />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Persistent notifications
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Keep notifications visible until acknowledged
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="text-sm font-medium w-64 text-right pr-4" style={{ color: 'var(--things-gray-700)' }}>
                    First day of week:
                  </label>
                  <select className="px-0 py-2 border-none bg-transparent text-xs outline-none" style={{ color: 'var(--things-gray-600)' }}>
                    <option>Sunday</option>
                    <option>Monday</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="text-sm font-medium w-64 text-right pr-4" style={{ color: 'var(--things-gray-700)' }}>
                    Time format:
                  </label>
                  <select className="px-0 py-2 border-none bg-transparent text-xs outline-none" style={{ color: 'var(--things-gray-600)' }}>
                    <option>12 hour (AM/PM)</option>
                    <option>24 hour</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CustomCheckbox checked={true} className="mt-1" />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Show calendar events
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Display calendar events alongside tasks
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CustomCheckbox checked={false} className="mt-1" />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
                      Week numbers
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--things-gray-500)' }}>
                      Show week numbers in calendar views
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shortcuts' && (
            <div className="space-y-6">
              <div className="text-sm font-medium mb-4" style={{ color: 'var(--things-gray-700)' }}>
                Keyboard Shortcuts
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--things-gray-600)' }}>Quick Entry</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>Ctrl</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>⌘</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>N</kbd>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--things-gray-600)' }}>Search</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>Ctrl</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>⌘</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>F</kbd>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--things-gray-600)' }}>Settings</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>Ctrl</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>⌘</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>,</kbd>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--things-gray-600)' }}>Today View</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>Ctrl</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>⌘</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>1</kbd>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--things-gray-600)' }}>Inbox View</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>Ctrl</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>⌘</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>2</kbd>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--things-gray-600)' }}>Upcoming View</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>Ctrl</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>⌘</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>3</kbd>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--things-gray-600)' }}>Completed View</span>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>Ctrl</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>⌘</kbd>
                    <span className="text-xs" style={{ color: 'var(--things-gray-500)' }}>+</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs" style={{ color: 'var(--things-gray-700)' }}>4</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-6">
              <DataImport />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t flex justify-end gap-2 px-6 py-4" style={{ borderColor: 'var(--things-gray-200)' }}>
          <button
            onClick={onClose}
            className="things-button-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="things-button-primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}