
import API from "../config/api";

// ==========================================
// DOCTOR INVITATIONS
// ==========================================

export const getAssistantInvitations = async () => {
  const response = await API.get("/assistant/invitations");
  return response.data;
};

export const acceptAssistantInvitation = async (invitationId: string) => {
  const response = await API.post(
    `/assistant/invitations/${invitationId}/accept`
  );
  return response.data;
};

export const declineAssistantInvitation = async (invitationId: string) => {
  const response = await API.post(
    `/assistant/invitations/${invitationId}/decline`
  );
  return response.data;
};

export const getAssistantWorkspaces = async () => {
  const response = await API.get("/assistant/workspaces");
  return response.data;
};

// ==========================================
// ASSISTANT APPOINTMENTS
// ==========================================

export const getAssistantAppointments = async (
  doctorId: string,
  status?: string
) => {
  const response = await API.get(
    `/assistant/doctors/${doctorId}/appointments`,
    { params: status ? { status } : {} }
  );
  return response.data;
};

// Accept VIDEO request only
export const acceptAssistantAppointment = async (
  doctorId: string,
  appointmentId: string
) => {
  const response = await API.patch(
    `/assistant/doctors/${doctorId}/appointments/${appointmentId}/accept`
  );
  return response.data;
};

// Reject hospital or video request
export const rejectAssistantAppointment = async (
  doctorId: string,
  appointmentId: string,
  reason?: string
) => {
  const response = await API.patch(
    `/assistant/doctors/${doctorId}/appointments/${appointmentId}/reject`,
    { reason }
  );
  return response.data;
};


// Propose 1-3 manually selected times for a REQUESTED hospital appointment
export const rescheduleAssistantAppointment = async (
  doctorId: string,
  appointmentId: string,
  slotTimes: string[]
) => {
  const response = await API.patch(
    `/assistant/doctors/${doctorId}/appointments/${appointmentId}/reschedule`,
    { slotTimes }
  );
  return response.data;
};


// Change an already confirmed appointment
export const changeAssistantAppointmentSlot = async (
  doctorId: string,
  appointmentId: string,
  scheduledAt: string,
  slotTime: string
) => {
  const response = await API.patch(
    `/assistant/doctors/${doctorId}/appointments/${appointmentId}/change-slot`,
    { scheduledAt, slotTime }
  );
  return response.data;
};

// ==========================================
// ASSISTANT AVAILABILITY
// ==========================================

export const getAssistantAvailability = async (doctorId: string) => {
  const response = await API.get(
    `/assistant/doctors/${doctorId}/availability`
  );
  return response.data;
};

export const createAssistantAvailability = async (
  doctorId: string,
  availabilityData: {
    hospitalId?: string | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
  }
) => {
  const response = await API.post(
    `/assistant/doctors/${doctorId}/availability`,
    availabilityData
  );
  return response.data;
};

export const updateAssistantAvailability = async (
  doctorId: string,
  availabilityId: string,
  availabilityData: {
    hospitalId?: string | null;
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    slotDuration?: number;
    isActive?: boolean;
  }
) => {
  const response = await API.patch(
    `/assistant/doctors/${doctorId}/availability/${availabilityId}`,
    availabilityData
  );
  return response.data;
};

export const deleteAssistantAvailability = async (
  doctorId: string,
  availabilityId: string
) => {
  const response = await API.delete(
    `/assistant/doctors/${doctorId}/availability/${availabilityId}`
  );
  return response.data;
};
