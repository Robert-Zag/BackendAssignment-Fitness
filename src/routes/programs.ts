import {
	Router,
	Request,
	Response,
	NextFunction
} from 'express'
import { prisma } from '../lib/prisma'

const router: Router = Router()

export default () => {
	router.get('/', async (_req: Request, res: Response, _next: NextFunction) => {
		const programs = await prisma.program.findMany()
		return res.json({
			data: programs,
			message: 'List of programs'
		})
	})

	return router
}
