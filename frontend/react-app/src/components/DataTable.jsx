function DataTable({ columns, rows, emptyMessage, rowClassName }) {
  return (
    <div className="card table-card">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.align ? `cell-${column.align}` : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id ?? row.key}
                className={rowClassName ? rowClassName(row) : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.align ? `cell-${column.align}` : undefined}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
