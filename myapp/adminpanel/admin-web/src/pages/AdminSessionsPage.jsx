import { useEffect, useState } from "react";
import API from "../config/api";
export default function AdminSessionsPage() {

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {

    const token = localStorage.getItem("adminToken");

    const res = await API.get(
  "/admin/sessions",
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

const data = res.data;
    setSessions(data.sessions || []);
  };

  return (
    <div>

      <h2 style={{marginBottom:20}}>Active Admin Sessions</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Admin ID</th>
            <th>Status</th>
            <th>Last Active</th>
          </tr>
        </thead>

        <tbody>

          {sessions.map((s)=>(
            <tr key={s.adminId}>
              <td>{s.adminId}</td>
              <td style={{color:"#16a34a"}}>Online</td>
              <td>{new Date(s.lastActive).toLocaleString()}</td>
            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

const styles = {

  table:{
    width:"100%",
    borderCollapse:"collapse"
  }

};