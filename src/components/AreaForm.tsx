import { useState, useEffect, useRef } from "react";
import { createArea } from "../lib/queries/areas";

interface AreaFormProps {
  onClose: () => void;
}

const folderColors = [
  "#87CEEB", "#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", 
  "#BAE1FF", "#C4A4FF", "#E4B3FF", "#FFB3E6", "#D3D3D3"
];

export function AreaForm({ onClose }: AreaFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(folderColors[0]);
  const modalRef = useRef<HTMLDivElement>(null);

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
      await createArea({
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create area:", error);
      // Optionally, display an error message to the user
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
            placeholder="New Folder"
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
            {/* Color */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Color
              </label>
              <div className="flex gap-2">
                {folderColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${
                      selectedColor === color ? "border-gray-400 scale-110" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                  />
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
              disabled={!name.trim()}
              className="px-3 py-1 rounded text-xs disabled:opacity-50"
              style={{ background: "#90B1F6", color: "white" }}
            >
              Create Folder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}