import express from 'express'

import { register } from '../controllers/user.js'

const router = express.Router()

router.post('/register', async(req, res) => {
  const isAdded = await register(req.body)
  res.json({ isAdded })
})

router.get('/:id', (req, res) => {
  res.json({ message: 'Pending GET /user implementation.' })
})

router.put('/:id', (req, res) => {
  res.json({ message: 'Pending PUT /user implementation.' })
})

router.delete('/:id', (req, res) => {
  res.json({ message: 'Pending DELETE /user implementation.' })
})

export { router as userRoutes }