const express = require('express')()
let { accounts } = require('./data.js')
let { users } = require('./data.js')
//middleware

//-----------------------------
//function to generate id
function generateUniqueId() {
  // Generate a random 6-digit ID
  return Math.floor(Math.random() * 1000000)
}

//------------------------------
express.get('/', (req, res) => {
  res.end('homepage')
})

express.get('/api/signup', (req, res) => {
  const { name, dateOfBirth, mobileNumber, email } = req.body
  let id = generateUniqueId()
  while (users.some((user) => user.id === id)) {
    id = generateUniqueId()
  }
  //check if anything is duplicate
  //check if id is duplicate
  const isDuplicate = users.some(
    (user) =>
      user.name === name ||
      user.email === email ||
      user.mobileNumber === mobileNumber
  )
  if (isDuplicate) {
    res.json({ status: false, message: 'User already exists' })
    return
  }
  //check if any field is empty
  if (!name || !dateOfBirth || !mobileNumber || !email || !password) {
    res.json({ status: false, message: 'Please fill all the details' })
    return
  }
  //check if password is less than 8 characters
  if (password.length < 8) {
    res.json({
      status: false,
      message: 'Password should be atleast 8 characters',
    })
    return
  }
  //check if email is valid
  if (!email.includes('@')) {
    res.json({ status: false, message: 'Please enter a valid email' })
    return
  }

  const newUser = {
    id,
    name,
    password,
    dateOfBirth,
    mobileNumber,
    email,
    accounts: [],
    status: '',
    userBalance: 0,
  }
  sessionStorage.setItem('userId', id)
  users.push(newUser)
  res.json({ status: true, message: 'User created successfully', id })
})
express.get('/api/login', (req, res) => {
  const { email, password } = req.body
  const user = users.find(
    (user) => user.email === email && user.password === password
  )
  if (!user) {
    res.json({ status: false, message: 'Invalid credentials' })
    return
  }
  sessionStorage.setItem('userId', user.id)
  res.json({ status: true, message: 'Login successful', id: user.id })
})

const port = 3000
express.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
