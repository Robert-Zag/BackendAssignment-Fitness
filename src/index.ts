import http from 'http'
import express from 'express'

import ProgramRouter from './routes/programs'
import ExerciseRouter from './routes/exercises'
import RegisterRouter from './routes/register'

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use('/programs', ProgramRouter())
app.use('/exercises', ExerciseRouter())
app.use('/register', RegisterRouter())

const httpServer = http.createServer(app)

// prisma requires username in the database url
console.log('Db url', 'postgresql://<USERNAME>:@localhost:5432/fitness_app')

httpServer.listen(8000).on('listening', () => console.log(`Server started at port ${8000}`))

export default httpServer
