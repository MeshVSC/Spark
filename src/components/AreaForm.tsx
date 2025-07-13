import { useState } from "react";
import { createArea } from "../lib/queries/areas";

interface AreaFormProps {
  onClose: () => void;
}

const areaColors = [
  "#007AFF", "#FF3B30", "#FF9500", "#FFCC00", "#34C759", 
  "#00C7BE", "#5856D6", "#AF52DE", "#FF2D92", "#8E8E93"
];

export function AreaForm({ onClose }: AreaFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(areaColors[0]);

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
      <div className="things-modal-content max-w-lg">
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            New Area
          </h3>

          {/* Name */}
          <div className="mb-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="things-input text-lg font-medium"
              placeholder="Area name"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="things-input min-h-20 resize-none"
              placeholder="What does this area cover?"
            />
          </div>

          {/* Color */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex gap-2">
              {areaColors.map((color) => (
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

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="things-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="things-button-primary disabled:opacity-50"
            >
              Create Area
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}