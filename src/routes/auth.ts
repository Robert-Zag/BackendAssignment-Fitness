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
import { compare } from 'bcrypt'
import jwt from 'jsonwebtoken'
import { localize } from '../lib/localization'

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

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

export default () => {
    router.post('/register', async (req: Request, res: Response, _next: NextFunction) => {
        let parsedData: z.infer<typeof registrationSchema>
        try {
            parsedData = registrationSchema.parse(req.body)
        } catch (error) {
            return res.status(400).json({
                message: localize(req.headers.language as string, "Validation error"),
                errors: error.errors
            })
        }

        const userWithEmail = await prisma.user.findUnique({ where: { email: parsedData.email } })
        if (userWithEmail) {
            return res.status(409).json({
                message: localize(req.headers.language as string, "Email already in use"),
            })
        }

        const password = await hash(parsedData.password, 12)
        const user = await prisma.user.create({
            data: {
                ...parsedData,
                email: parsedData.email!.toLowerCase(),
                password
            }
        })

        return res.status(201).json({
            user,
            message: localize(req.headers.language as string, "User registered successfully")
        })
    })

    router.post('/login', async (req: Request, res: Response, _next: NextFunction) => {
        let parsedData: z.infer<typeof loginSchema>
        try {
            parsedData = loginSchema.parse(req.body)
        } catch (error) {
            return res.status(400).json({
                message: localize(req.headers.language as string, "Validation error"),
                errors: error.errors
            })
        }

        const userWithEmail = await prisma.user.findUnique({ where: { email: parsedData.email.toLowerCase() } })
        const isPasswordValid = userWithEmail && await compare(parsedData.password, userWithEmail.password)
        if (!isPasswordValid) {
            return res.status(401).json({
                // generic error message for better security
                message: localize(req.headers.language as string, "Invalid credentials"),
            })
        }

        const token = jwt.sign({ id: userWithEmail.id }, process.env.JWT_SECRET, { expiresIn: '1h' })
        return res.json({ token, message: localize(req.headers.language as string, "Logged in successfully") });
    })

    return router
}
