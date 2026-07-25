import { useEffect, useState } from "react";
import API from "../config/api";

export default function AdminSecurityPage(){

const [events,setEvents] = useState([]);

useEffect(()=>{
loadEvents();
},[]);

const loadEvents = async ()=>{

const token = localStorage.getItem("adminToken");

const res = await API.get(
  "/admin/security-events",
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

const data = res.data;

setEvents(data || []);
};

return(
<div>

<h2 style={{marginBottom:20}}>
Admin Security Monitor
</h2>

<table style={styles.table}>

<thead>
<tr>
<th>Time</th>
<th>Severity</th>
<th>Event</th>
</tr>
</thead>

<tbody>

{events.map(e=>(
<tr key={e._id}>
<td>{new Date(e.createdAt).toLocaleString()}</td>
<td>{e.severity}</td>
<td>{e.message}</td>
</tr>
))}

</tbody>

</table>

</div>
);

}

const styles={
table:{
width:"100%",
borderCollapse:"collapse"
}
};