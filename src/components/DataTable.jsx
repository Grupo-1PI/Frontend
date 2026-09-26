import { Edit2, Trash2, Search, Filter } from "lucide-react";

export function DataTable({
  columns,
  data = [],
  loading = false,
  searchTerm = "",
  onSearchChange,
  searchPlaceholder = "Pesquisar...",
  onFilterClick,
  onEdit,
  onDelete,
  paginationInfo = "Mostrando registros ativos",
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}) {
  return (
    <div className="w-full space-y-4">
      {/* Search & Filter Bar */}
      {(onSearchChange || onFilterClick) && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-xs border border-[#E5E0D8]">
          {onSearchChange && (
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2.5 text-sm text-[#333E33] outline-none focus:border-[#333E33] transition"
              />
            </div>
          )}
          {onFilterClick && (
            <button
              type="button"
              onClick={onFilterClick}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-[#333E33] hover:bg-gray-50 transition"
            >
              <Filter size={16} /> Filtros
            </button>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#333E33] text-white text-xs font-bold uppercase tracking-wider">
                {columns.map((col, idx) => (
                  <th key={col.key || idx} className="px-6 py-4">
                    {col.header}
                  </th>
                ))}
                {(onEdit || onDelete) && <th className="px-6 py-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-[#333E33]">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-gray-400">
                    Carregando registros...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-gray-400">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                data.map((item, rowIdx) => (
                  <tr key={item.id || rowIdx} className="hover:bg-gray-50/60 transition">
                    {columns.map((col, colIdx) => (
                      <td key={col.key || colIdx} className="px-6 py-4">
                        {col.render ? col.render(item[col.key], item) : item[col.key]}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-6 py-4 text-right space-x-2">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="p-2 text-gray-500 hover:text-[#333E33] hover:bg-gray-100 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="p-2 text-gray-400 hover:text-status-cancelado hover:bg-red-50 rounded-lg transition"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
          <div>{paginationInfo}</div>
          {totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1 font-semibold">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 transition"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    currentPage === page
                      ? "bg-[#333E33] text-white border-[#333E33]"
                      : "bg-white border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 transition"
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataTable;
