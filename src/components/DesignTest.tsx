export function DesignTest() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-8 text-center">
        Design Comparison: Current vs Things 3 Style
      </h1>

      <div className="flex gap-8 max-w-6xl mx-auto">
        {/* Current Design */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-4">Current Design</h2>
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-96">
            <form className="relative">
              <input
                type="text"
                className="w-full px-0 py-2 text-base border-none outline-none placeholder-gray-400"
                placeholder="New To-Do"
                value="Buy groceries"
                readOnly
              />
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1 rounded transition-colors text-blue-600"
                    title="Set due date"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
                    style={{ color: 'var(--things-gray-600)' }}
                  >
                    Tomorrow
                  </button>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="px-2 py-1 text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded text-xs">
                    Add
                  </button>
                </div>
              </div>
            </form>
          </div>
          {/* Current TaskForm */}
          <div className="mt-8 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-96">
            <div className="space-y-4">
              <input
                type="text"
                className="w-full px-1 py-2 text-xl font-medium border-none outline-none placeholder-gray-400 bg-transparent"
                placeholder="New To-Do"
                value="Finish project proposal"
                readOnly
              />
              <textarea
                className="w-full px-1 py-2 text-sm border-none outline-none placeholder-gray-400 bg-transparent resize-none"
                placeholder="Notes"
                rows={3}
                value="Include budget analysis and timeline"
                readOnly
              />
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                    <div className="flex items-center gap-2 py-2">
                      <button className="p-1 rounded transition-colors text-blue-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                      </button>
                      <span className="text-xs font-medium" style={{ color: 'var(--things-gray-600)' }}>
                        Jan 15
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Scheduled</label>
                    <div className="flex items-center gap-2 py-2">
                      <button className="p-1 rounded transition-colors text-gray-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                      </button>
                      <div className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--things-gray-400)' }}>
                          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <input
                          type="text"
                          className="w-16 px-1 py-0 text-xs border-none outline-none bg-transparent"
                          style={{ color: 'var(--things-gray-600)' }}
                          value="tomorrow"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
                    <select
                      className="w-full px-0 py-2 border-none bg-transparent text-base outline-none"
                      style={{ color: 'var(--things-gray-900)' }}
                    >
                      <option>Work Projects</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
                    <input
                      type="text"
                      className="w-full px-0 py-2 border-none bg-transparent text-base outline-none"
                      value="urgent, client"
                      style={{ color: 'var(--things-gray-900)' }}
                      readOnly
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button className="px-2 py-1 text-gray-500 hover:text-gray-700 text-xs">Cancel</button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs">Create Task</button>
              </div>
            </div>
          </div>
        </div>

        {/* Things 3 Inspired Design */}
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-4">Things 3 Inspired</h2>
          <div className="bg-white rounded-xl shadow-lg p-6 w-96" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)' }}>
            <form className="relative">
              <input
                type="text"
                className="w-full px-0 py-3 text-lg border-none outline-none placeholder-gray-300 font-normal"
                placeholder="New To-Do"
                value="Buy groceries"
                style={{ fontSize: '17px', lineHeight: '1.4' }}
                readOnly
              />
              <div className="flex justify-between items-center mt-6">
                <div className="flex items-center">
                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-600 transition-colors"
                    title="When"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </button>
                  <span className="ml-3 text-blue-500 font-medium" style={{ fontSize: '15px' }}>
                    Tomorrow
                  </span>
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  style={{ fontSize: '15px' }}
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 bg-white rounded-xl p-8 w-96" style={{ boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)' }}>
            <div className="space-y-8">
              <input
                type="text"
                className="w-full px-0 py-3 text-2xl font-normal border-none outline-none placeholder-gray-300"
                placeholder="New To-Do"
                value="Finish project proposal"
                style={{ fontSize: '22px', lineHeight: '1.3', fontWeight: '400' }}
                readOnly
              />
              <textarea
                className="w-full px-0 py-2 text-base border-none outline-none placeholder-gray-300 resize-none"
                placeholder="Notes"
                rows={2}
                value="Include budget analysis and timeline"
                style={{ fontSize: '16px', lineHeight: '1.5', color: '#666' }}
                readOnly
              />
              <div className="space-y-6 pt-6" style={{ borderTop: '1px solid #f0f0f0' }}>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <div className="text-gray-400 text-sm mb-3" style={{ fontSize: '13px', fontWeight: '500' }}>
                      When
                    </div>
                    <div className="flex items-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="1.5" className="mr-3">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="text-blue-500 font-medium" style={{ fontSize: '15px' }}>
                        Jan 15
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-3" style={{ fontSize: '13px', fontWeight: '500' }}>
                      Deadline
                    </div>
                    <div className="flex items-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" className="mr-3">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="text-gray-300" style={{ fontSize: '15px' }}>
                        Add deadline
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-3" style={{ fontSize: '13px', fontWeight: '500' }}>
                    List
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: '#007AFF' }}></div>
                    <span style={{ fontSize: '15px', color: '#333' }}>Work Projects</span>
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-3" style={{ fontSize: '13px', fontWeight: '500' }}>
                    Tags
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">urgent</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">client</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-6" style={{ borderTop: '1px solid #f0f0f0' }}>
                <button className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors" style={{ fontSize: '15px' }}>
                  Add To-Do
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
