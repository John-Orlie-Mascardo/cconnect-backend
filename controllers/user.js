import { UserModel } from '../models/user.js'

export function register(body) {
  let newUser = new UserModel({
    email: body.email,
    password: body.password
  })

  return newUser.save().then((user, error) => {
    return !(error)
  })
}