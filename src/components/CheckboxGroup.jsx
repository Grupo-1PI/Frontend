export function CheckboxGroup({ label, items = [], selectedIds = [], onChange, idKey = "id", labelKey = "descricao" }) {
  const toggleItem = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="w-full space-y-2">
      {label && <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</label>}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {items.map((item) => {
          const id = item[idKey];
          const text = item[labelKey] || item.nome;
          const checked = selectedIds.includes(id);

          return (
            <label
              key={id}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/60 cursor-pointer transition text-sm font-medium text-[#333E33]"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleItem(id)}
                className="w-4 h-4 rounded border-gray-300 text-[#333E33] focus:ring-[#333E33]"
              />
              <span>{text}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default CheckboxGroup;
