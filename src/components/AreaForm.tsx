import { useState, useEffect, useRef } from "react";
import { createArea, getAreas, updateArea } from "../lib/queries/areas";

interface AreaFormProps {
  editingAreaId?: string | null;
  onClose: () => void;
}

const folderIcons = [
  { 
    name: 'folder', 
    label: 'General',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-2l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
      </svg>
    )
  },
  { 
    name: 'work', 
    label: 'Work',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,6V4H10V6H4V18H20V6M12,7A3,3 0 0,1 15,10A3,3 0 0,1 12,13A3,3 0 0,1 9,10A3,3 0 0,1 12,7Z" />
      </svg>
    )
  },
  { 
    name: 'home', 
    label: 'Personal',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
      </svg>
    )
  },
  { 
    name: 'health', 
    label: 'Health',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M15.5,12L14,10.5L10.5,14L8.5,12L7,13.5L10.5,17L15.5,12Z" />
      </svg>
    )
  },
  { 
    name: 'money', 
    label: 'Finance',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6.5A2,2 0 0,1 14,8.5V9.5A2,2 0 0,1 12,11.5A2,2 0 0,1 10,9.5V8.5A2,2 0 0,1 12,6.5M8.5,12H15.5V13.5H8.5V12M8.5,15H15.5V16.5H8.5V15Z" />
      </svg>
    )
  },
  { 
    name: 'education', 
    label: 'Learning',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z" />
      </svg>
    )
  },
  { 
    name: 'shopping', 
    label: 'Shopping',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17,18C17.56,18 18,18.44 18,19C18,19.56 17.56,20 17,20C16.44,20 16,19.56 16,19C16,18.44 16.44,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15C5,16.1 5.9,17 7,17H19V15H7.42C7.28,15 7.17,14.89 7.17,14.75L7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5H5.21L4.27,3H1M7,18C7.56,18 8,18.44 8,19C8,19.56 7.56,20 7,20C6.44,20 6,19.56 6,19C6,18.44 6.44,18 7,18Z" />
      </svg>
    )
  },
  { 
    name: 'travel', 
    label: 'Travel',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21,16V14L13,9V3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z" />
      </svg>
    )
  },
  { 
    name: 'goals', 
    label: 'Goals',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,10.5A1.5,1.5 0 0,1 13.5,12A1.5,1.5 0 0,1 12,13.5A1.5,1.5 0 0,1 10.5,12A1.5,1.5 0 0,1 12,10.5Z" />
      </svg>
    )
  },
  { 
    name: 'settings', 
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
      </svg>
    )
  },
  { 
    name: 'heart', 
    label: 'Family',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
      </svg>
    )
  },
  { 
    name: 'creative', 
    label: 'Creative',
    icon: (
      <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M13,11H14V13H13V11M12,7A5,5 0 0,0 7,12H9A3,3 0 0,1 12,9A3,3 0 0,1 15,12H17A5,5 0 0,0 12,7Z" />
      </svg>
    )
  }
];

export function AreaForm({ editingAreaId, onClose }: AreaFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(folderIcons[0]);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load existing area data if editing
  useEffect(() => {
    if (editingAreaId) {
      setLoading(true);
      getAreas().then(areas => {
        const area = areas.find(a => a.id === editingAreaId);
        if (area) {
          setName(area.name);
          setDescription(area.description || "");
          // Find matching icon or default to first one
          const matchingIcon = folderIcons.find(icon => icon.name === area.color) || folderIcons[0];
          setSelectedIcon(matchingIcon);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [editingAreaId]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      if (editingAreaId) {
        // Update existing area
        await updateArea(editingAreaId, {
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedIcon.name,
        });
      } else {
        // Create new area
        await createArea({
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedIcon.name,
        });
      }
      onClose();
    } catch (error) {
      console.error(editingAreaId ? "Failed to update area:" : "Failed to create area:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="things-modal">
      <div ref={modalRef} className="things-modal-content max-w-lg">
        <form id="folderForm" onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-1 py-2 text-xl font-medium border-none outline-none placeholder-gray-400 bg-transparent"
            placeholder={editingAreaId ? "Folder Name" : "New Folder"}
            autoFocus
          />

          {/* Description */}
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-1 py-2 text-sm border-none outline-none placeholder-gray-400 bg-transparent resize-none"
              placeholder="What is this folder about?"
              rows={1}
            />
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-4">
            {/* Icon */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {folderIcons.map((iconOption) => (
                  <button
                    key={iconOption.name}
                    type="button"
                    onClick={() => setSelectedIcon(iconOption)}
                    className={`w-10 h-10 rounded-lg border-2 transition-all duration-150 flex items-center justify-center text-lg hover:bg-gray-50 ${
                      selectedIcon.name === iconOption.name ? "border-blue-400 bg-blue-50" : "border-gray-200"
                    }`}
                    title={iconOption.label}
                  >
                    {iconOption.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Actions */}
        <div className="border-t border-gray-200">
          <div className="px-6 py-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 text-gray-500 hover:text-gray-700 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="folderForm"
              disabled={!name.trim() || loading}
              className="px-3 py-1 rounded text-xs disabled:opacity-50"
              style={{ background: "#90B1F6", color: "white" }}
            >
              {loading ? "Saving..." : (editingAreaId ? "Save Changes" : "Create Folder")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}