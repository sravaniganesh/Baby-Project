import { useEffect, useState } from "react";
import API from "../config/api";
export default function AdminPermissionsPage(){

const [roles,setRoles] = useState([]);

useEffect(()=>{
loadPermissions();
},[]);

const loadPermissions = async ()=>{

const token = localStorage.getItem("adminToken");

const res = await API.get(
  "/admin/permissions",
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

const data = res.data;
setRoles(data || []);
};

return(
<div>

<h2 style={{marginBottom:20}}>
Admin Role Permissions
</h2>

<table style={styles.table}>

<thead>
<tr>
<th>Role</th>
<th>Permissions</th>
</tr>
</thead>

<tbody>

{roles.map(r=>(
<tr key={r.role}>

<td>{r.role}</td>

<td>
{r.permissions.join(", ")}
</td>

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