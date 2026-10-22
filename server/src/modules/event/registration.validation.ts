import { z } from "zod";

// Individual registration
export const individualRegistrationSchema = z.object({
    body: z.object({
        phoneNumber: z
            .string()
            .trim()
           .regex(/^[0-9]{10}$/, "Phone number must contain exactly 10 digits"),

        collegeOrOrganization: z
            .string()
            .trim()
            .min(1, "College or organization is required"),
    }),

    params: z.object({
        id: z.string().min(1, "Event ID is required"),
    }),
});


// Team member
const teamMemberSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Member name is required"),

    email: z
        .string()
        .trim()
        .email("Invalid email address"),

    phoneNumber: z
        .string()
        .trim()
        .regex(
            /^[6-9][0-9]{9}$/,
            "Enter a valid 10-digit Indian mobile number"
        ),

    collegeOrOrganization: z
        .string()
        .trim()
        .min(1, "Member college or organization is required"),
});


export const teamRegistrationSchema = z.object({
    body: z.object({
        teamName: z
            .string()
            .trim()
            .min(1, "Team name is required")
            .max(100, "Team name cannot exceed 100 characters"),

        phoneNumber: z
            .string()
            .trim()
            .regex(
                /^[6-9][0-9]{9}$/,
                "Enter a valid 10-digit Indian mobile number"
            ),

        collegeOrOrganization: z
            .string()
            .trim()
            .min(1, "College or organization is required"),

        members: z
            .array(teamMemberSchema),
    }),

    params: z.object({
        id: z.string().min(1, "Event ID is required"),
}),
});