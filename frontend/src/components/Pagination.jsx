export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
            <button
                className="btn btn-outline btn-sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                Prev
            </button>
            {pages.map(p => (
                <button
                    key={p}
                    className={`btn btn-sm ${currentPage === p ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => onPageChange(p)}
                >
                    {p}
                </button>
            ))}
            <button
                className="btn btn-outline btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next
            </button>
        </div>
    );
}
