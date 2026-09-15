import {z} from "zod"

export const askSchema = z.object({
    body: z.object({
        question: z.string().trim().max(500, 'question is too long'),
    }),
})