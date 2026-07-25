export default function AdminPagination({ page, setPage }) {
return ( <div style={styles.container}>
<button onClick={() => setPage(page - 1)} disabled={page === 1}>
Previous </button>


  <span>Page {page}</span>

  <button onClick={() => setPage(page + 1)}>
    Next
  </button>
</div>


);
}

const styles = {
container: {
display: "flex",
gap: 10,
marginTop: 20,
},
};
