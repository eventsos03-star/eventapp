import {z} from "zod"

export const askSchema = z.object({
    question: z.string().trim().min(3,"question must be at least 3 charecters").max(500,"question is too long")
})