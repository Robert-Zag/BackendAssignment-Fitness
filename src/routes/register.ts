import {
    Router,
    Request,
    Response,
    NextFunction
} from 'express'
import { prisma } from '../lib/prisma'
import { UserRole } from '@prisma/client'
import { z } from 'zod'
import { hash } from 'bcrypt'

const router: Router = Router()

const registrationSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(UserRole).optional(),
    name: z.string().optional(),
    surname: z.string().optional(),
    nickName: z.string().optional(),
    age: z.number().int().min(1).optional(),
})

export default () => {
    router.post('/', async (req: Request, res: Response, _next: NextFunction) => {
        let parsedData: z.infer<typeof registrationSchema>
        try {
            parsedData = registrationSchema.parse(req.body)
        } catch (error) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.errors
            })
        }

        const userWithEmail = await prisma.user.findUnique({ where: { email: parsedData.email } })
        if (userWithEmail) {
            return res.status(409).json({
                message: "Email already in use",
            })
        }

        const password = await hash(parsedData.password, 12)
        const user = await prisma.user.create({
            data: {
                ...parsedData,
                email: parsedData.email!,
                password
            }
        })

        return res.status(201).json({
            user,
            message: "User registered successfully"
        })
    })

    return router
}
