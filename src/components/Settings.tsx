import { useState, useEffect, useRef } from "react";
import { CustomCheckbox } from "./CustomCheckbox";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'quickentry' | 'reminders' | 'calendar'>('general');
  const modalRef = useRef<HTMLDivElement>(null);

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
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
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
                  <select className="px-0 py-2 border-none bg-transparent text-xs outline-none" style={{ color: 'var(--things-gray-600)' }}>
                    <option>Immediately</option>
                    <option>After 1 day</option>
                    <option>After 1 week</option>
                    <option>Never</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <label className="text-sm font-medium w-64 text-right pr-4" style={{ color: 'var(--things-gray-700)' }}>
                    Badge count:
                  </label>
                  <select className="px-0 py-2 border-none bg-transparent text-xs outline-none" style={{ color: 'var(--things-gray-600)' }}>
                    <option>Today</option>
                    <option>Inbox</option>
                    <option>All</option>
                    <option>None</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CustomCheckbox checked={true} className="mt-1" />
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
                  <CustomCheckbox checked={false} className="mt-1" />
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
                  <CustomCheckbox checked={true} className="mt-1" />
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
                  <CustomCheckbox checked={false} className="mt-1" />
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
        </div>

        {/* Footer */}
        <div className="border-t flex justify-end gap-2 px-6 py-4" style={{ borderColor: 'var(--things-gray-200)' }}>
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs transition-all duration-150"
            style={{ color: 'var(--things-gray-500)' }}
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-xs font-medium transition-all duration-150"
            style={{ backgroundColor: '#90B1F6', color: 'white' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}