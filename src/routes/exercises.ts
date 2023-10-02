import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'

const router: Router = Router()

export default () => {
	router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
		const exercises = await prisma.exercise.findMany({ include: { programs: true } })

		return res.json({
			data: exercises,
			message: 'List of exercises'
		})
	})

	return router
}

