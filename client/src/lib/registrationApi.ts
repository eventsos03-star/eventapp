import { eventApi } from "./eventApi";

export interface IndividualRegistrationPayload {
    phoneNumber: string;
    collegeOrOrganization?: string;
}

export interface TeamMemberPayload {
    name: string;
    email: string;
    phoneNumber?: string;
    collegeOrOrganization?: string;
}

export interface TeamRegistrationPayload {
    teamName: string;
    phoneNumber: string;
    collegeOrOrganization?: string;
    members: TeamMemberPayload[];
}


export const registrationService={
    individual:(
        eventId:string,
        payload:IndividualRegistrationPayload
    )=>
        eventApi.post(`events/registration/${eventId}/individual`,payload)
        .then((res)=>res.data),

        team:(eventId:string,payload:TeamRegistrationPayload
        )=>
        eventApi.post(`events/registration/${eventId}/team`,payload)
        .then((res)=>res.data),
        
        
        myRegistrations: () =>
        eventApi
            .get("events/registration")
            .then((res) => res.data),
        
}