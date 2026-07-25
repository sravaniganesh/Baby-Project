import { Navigate } from "react-router-dom";

export default function AdminProtectedRoute({
children,
allowedRoles = []
}) {

const token = localStorage.getItem("adminToken");
const role = localStorage.getItem("adminRole");

// If admin not logged in
if (!token) {
return <Navigate to="/admin/login" replace />;
}

// If role is not allowed
if (
allowedRoles.length > 0 &&
!allowedRoles.includes(role)
) {
return <Navigate to="/" replace />;
}

return children;
}
