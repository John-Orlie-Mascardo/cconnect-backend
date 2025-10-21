import express from 'express'
import { UserModel } from '../models/user.js'
import { register } from '../controllers/user.js'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = new UserModel({ email, password })
    await user.save()
    res.status(201).json({ message: 'User registered successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await UserModel.findOne({ username, password })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    res.json({ message: 'Login successful' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export const userRoutes = router