export default function ColorSelector({ 
  colors, 
  selectedColor,
  onSelect
}: { 
  colors: { name: string; hexCode: string }[];
  selectedColor: { name: string; hexCode: string };
  onSelect: (color: { name: string; hexCode: string }) => void;
}) {
  return (
    <div>
      <label className="block mb-2 font-medium">Color</label>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color.name}
            onClick={() => onSelect(color)}
            className={`w-10 h-10 rounded-full border-2 ${selectedColor.name === color.name ? 'border-blue-500' : 'border-gray-400'}`}
            style={{ backgroundColor: color.hexCode }}
            title={color.name}
          />
        ))}
      </div>
      <p className="mt-2">Selected: {selectedColor.name}</p>
    </div>
  );
}