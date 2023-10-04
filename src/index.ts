import http from 'http'
import express from 'express'
import passport from 'passport';
import { initPassport } from './lib/auth';
import dotenv from 'dotenv'

import ProgramRouter from './routes/programs'
import ExerciseRouter from './routes/exercises'
import AuthRouter from './routes/auth'
import UsersRouter from './routes/users'

dotenv.config()

const app = express()

initPassport()
app.use(passport.initialize())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/programs', ProgramRouter())
app.use('/exercises', ExerciseRouter())
app.use('/auth', AuthRouter())
app.use('/users', UsersRouter())

const httpServer = http.createServer(app)

// prisma requires username in the database url
console.log('Db url', 'postgresql://<USERNAME>:@localhost:5432/fitness_app')

httpServer.listen(8000).on('listening', () => console.log(`Server started at port ${8000}`))

export default httpServer
