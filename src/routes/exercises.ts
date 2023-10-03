import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { isAdmin, isAuthenticated } from '../middleware/auth'

const router: Router = Router()

export default () => {
	router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
		const exercises = await prisma.exercise.findMany({ include: { programs: true } })

		return res.json({
			data: exercises,
			message: 'List of exercises'
		})
	})

	router.post('/', isAuthenticated, isAdmin, async (_req: Request, res: Response, _next: NextFunction) => {



		return res.json({
			message: 'Exercise created'
		})
	})

	return router
}

