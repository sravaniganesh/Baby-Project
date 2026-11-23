
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "../screens/user/ProfileScreen";
import UserOrdersScreen from "../screens/user/UserOrdersScreen";
import UserOrderDetailScreen from "../screens/user/UserOrderDetailScreen";
import WomenOnboardingScreen from "../screens/user/WomenOnboardingScreen";
import EditUsernameScreen from "../screens/user/EditUsernameScreen";
import UserTransactionsScreen from "../screens/user/UserTransactionsScreen";
import WalletScreen from "../screens/user/WalletScreen";

// Doctor Assistant screens
import AssistantInvitationsScreen from "../screens/user/AssistantInvitationsScreen";
import AssistantWorkspaceScreen from "../screens/user/AssistantWorkspaceScreen";
import AssistantDoctorWorkspaceScreen from "../screens/user/AssistantDoctorWorkspaceScreen";
import AssistantAppointmentsScreen from "../screens/user/AssistantAppointmentsScreen";
import AssistantAvailabilityScreen from "../screens/user/AssistantAvailabilityScreen";
import DoctorHospitalEnrollmentScreen from "../screens/doctor/DoctorHospitalEnrollmentScreen";

type AssistantDoctor = {
  _id?: string;
  id?: string;
  name?: string;
  specialization?: string;
};

type AssistantPermissions = {
  viewAppointments: boolean;
  respondToAppointments: boolean;
  manageSlots: boolean;
  rescheduleAppointments: boolean;
  viewPatientContact: boolean;
  manageHospitalFees: boolean;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  UserOrders: undefined;
  UserOrderDetail: undefined;
  WomenOnboarding: undefined;
  EditUsername: undefined;
  UserTransactions: undefined;
  Wallet: undefined;

  // Doctor Assistant routes
  AssistantInvitations: undefined;
  AssistantWorkspace: undefined;

  AssistantDoctorWorkspace: {
    relationshipId: string;
    doctor: AssistantDoctor;
    permissions: AssistantPermissions;
  };

  AssistantAppointments: {
    doctorId: string;
    doctor: AssistantDoctor;
    permissions: AssistantPermissions;
    relationshipId?: string;
  };

  AssistantAvailability: {
    doctorId: string;
    doctor: AssistantDoctor;
    permissions: AssistantPermissions;
    relationshipId?: string;
  };
  DoctorHospitalEnrollment: {
  doctorId: string;
  doctor: AssistantDoctor;
  permissions: AssistantPermissions;
  relationshipId: string;
};
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileStack = () => {
  return (
    <Stack.Navigator initialRouteName="ProfileHome">
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />

      <Stack.Screen
        name="UserOrders"
        component={UserOrdersScreen}
        options={{ title: "My Orders" }}
      />

      <Stack.Screen
        name="UserOrderDetail"
        component={UserOrderDetailScreen}
        options={{ title: "Order Details" }}
      />

      <Stack.Screen
        name="WomenOnboarding"
        component={WomenOnboardingScreen}
        options={{ title: "Update Life Stage" }}
      />

      <Stack.Screen
        name="EditUsername"
        component={EditUsernameScreen}
        options={{ title: "Edit Username" }}
      />

      <Stack.Screen
        name="UserTransactions"
        component={UserTransactionsScreen}
      />

      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
      />

      {/* Doctor Assistant screens */}

      <Stack.Screen
        name="AssistantInvitations"
        component={AssistantInvitationsScreen}
        options={{ title: "Doctor Invitations" }}
      />

      <Stack.Screen
        name="AssistantWorkspace"
        component={AssistantWorkspaceScreen}
        options={{ title: "Doctor Workspaces" }}
      />

      <Stack.Screen
        name="AssistantDoctorWorkspace"
        component={AssistantDoctorWorkspaceScreen}
        options={{ title: "Doctor Workspace" }}
      />
      <Stack.Screen
  name="DoctorHospitalEnrollment"
  component={DoctorHospitalEnrollmentScreen}
  options={{ title: "Manage Hospitals" }}
/>

      <Stack.Screen
        name="AssistantAppointments"
        component={AssistantAppointmentsScreen}
        options={{ title: "Appointments" }}
      />

      <Stack.Screen
        name="AssistantAvailability"
        component={AssistantAvailabilityScreen}
        options={{ title: "Manage Availability" }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStack;
