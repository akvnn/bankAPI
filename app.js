const express = require('express')
const jwt = require('jsonwebtoken')
const { Configuration, OpenAIApi } = require('openai')
const server = express()
const cron = require('node-cron')
const { OPENAI_API_KEY, mongoDBPassword } = require('./passwords.js')
let mongoDBConnection = false
const { MongoClient, ServerApiVersion } = require('mongodb')
const uri =
  'mongodb+srv://oakvnnn:' +
  mongoDBPassword +
  '@fambankapi.xckznhp.mongodb.net/?retryWrites=true&w=majority'

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
//mongodb run function to handle the connection
//establish the database connection when your application
//starts or when your server initializes, and keep the
//connection open as long as your application is running.
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect()
    console.log('Connected to MongoDB')
    mongoDBConnection = true

    // Send a ping to confirm a successful connection
    //await client.db('admin').command({ ping: 1 })
    // console.log(
    //   'Pinged your deployment. You successfully connected to MongoDB!'
    // )
  } catch (err) {
    console.log('Failed to connect to MongoDB' + err)
    mongoDBConnection = false
  }
}
//call the function from a global scope
run().catch(console.dir)
async function close() {
  try {
    await client.close()
    console.log('Connection closed')
  } catch (err) {
    console.log('Failed to close MongoDB connection' + err)
  }
}
//--------------------------------------------------
//database functions
//--------------------------------------------------

const db = client.db('fambankapi')
//each account/user is a document which is an object stored in the designated collection
const usersCollection = db.collection('users')
const accountsCollection = db.collection('accounts')
async function insertUser(user) {
  const result = await usersCollection.insertOne(user)
  return result.acknowledged
}
async function insertAccount(account) {
  const result = await accountsCollection.insertOne(account)
  return result.acknowledged
}
//returns a promise, null if not found
async function findUserByID(id) {
  const result = await usersCollection.findOne({ id })
  return result
}
//returns a promise
async function findAccountByID(id) {
  const result = await accountsCollection.findOne({ id })
  return result
}
async function isUserDuplicate(id) {
  const existingUser = await usersCollection.findOne({ id })
  return !!existingUser // Returns true if the user exists, false if not
}
async function isAccountDuplicate(id) {
  const existingAccount = await accountsCollection.findOne({ id })
  return !!existingAccount // Returns true if the account exists, false if not
}
async function isUniqueEmailMobile(email, mobileNumber) {
  const existingUser = await usersCollection.findOne({ email })
  const existingUserTwo = await usersCollection.findOne({ mobileNumber })
  return !existingUser && !existingUserTwo // Returns true if user does not exist //!null && !null = true
}
async function findUserByEmailPassword(email, password) {
  const result = await usersCollection.findOne({ email, password })
  return result
}
async function updateUserByID(id, updatedData) {
  const result = await usersCollection.updateOne(
    { id: id }, // Filter to match the user by ID
    { $set: updatedData } // Update the user with the new data
  )
  return result.modifiedCount // Number of documents modified
}
async function insertAccountToUser(id, item) {
  const result = await usersCollection.updateOne(
    { id: id }, // Filter to match the user by ID
    { $push: { accounts: item } } // Push the item to the "accounts" array field
  )
  return result.modifiedCount // Number of documents modified
}
async function insertUserToAccount(id, newUserId, mainUser) {
  if (mainUser == true) {
    const result = await accountsCollection.updateOne(
      { id: id }, // Filter to match the account by ID
      { $push: { mainUsersIDs: newUserId } }
    ) // Push the item to the "users" array field
  } else {
    const result = await accountsCollection.updateOne(
      { id: id }, // Filter to match the account by ID
      { $push: { subUsersIDs: newUserId } }
    ) // Push the item to the "users" array field
  }
  return result.modifiedCount // Number of documents modified
}
async function insertTransaction(id, transaction) {
  const result = await accountsCollection.updateOne(
    { id: id }, // Filter to match the account by ID
    { $push: { transactions: transaction } }
  )
  return result.modifiedCount // Number of documents modified
}
async function updateBalance(id, userId, amount) {
  const result = await accountsCollection.updateOne(
    { id: id },
    { $inc: { balance: -1 * amount } }
  )
  const resultTwo = await usersCollection.updateOne(
    { id: userId },
    { $inc: { balance: -1 * amount } }
  )
  return result.modifiedCount + resultTwo.modifiedCount // Number of documents modified
}
async function findUserByEmail(email) {
  const result = await usersCollection.findOne({ email })
  return result
}
//--------------------------------------------------
//TESTING DB
//--------------------------------------------------

// findUserByID('123')
//   .then((user) =>
//     console.log(user)
//   })
//   .catch((error) => {
//     console.error('error' + error)
//   })
//better approach: async/await
// try {
//   const user = await findUserByID('123')
//   console.log(user)
// } catch (error) {
//   console.error('Error:', error)
// }

//middlewares
server.use(express.json())
//--
//Middleware for mongodb

//--

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    res
      .status(401)
      .json({ status: false, message: 'Access denied. Token missing.' })
    return
  }

  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    res
      .status(401)
      .json({ status: false, message: 'Access denied. Invalid token.' })
    return
  }

  try {
    const decoded = jwt.verify(token, 'yourSecretKey')
    req.userId = decoded.id
    next()
  } catch (error) {
    res
      .status(401)
      .json({ status: false, message: 'Access denied. Invalid token.' })
  }
}
//Middleware for openai
const callprompt = async (req, res, next) => {
  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  })
  try {
    //get user and account
    const account = await findAccountByID(req.params.id)
    const user = await findUserByID(req.userId)
    if (!account || !user) {
      res.status(404).send('Account or User not found')
      return
    }
  } catch (error) {
    res.status(404).send('Account or User not found' + error)
    return
  }
  //openai
  try {
    const openai = new OpenAIApi(configuration)
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt:
        'suppose you are acting as a virtual assistant for a bank. do this' +
        // here are information about the user and the targeted account, what is the safe amount to spend:' +
        // account +
        // user,
        req.query.text,
      temperature: 0,
      max_tokens: 1000,
    })
    if (response.data.choices && response.data.choices.length > 0) {
      res.status(200).send(response.data.choices[0].text)
    } else {
      res.status(404).send('error getting response..')
    }
  } catch (error) {
    console.error('Error:', error)
    res.status(404).send('Error occurred: ' + error.message)
  }
}
//--------------------------------------------------
//--------------------------------------------------
//function to generate id
generateUniqueId = () => {
  // Generate a random 6-digit ID
  return Math.floor(Math.random() * 1000000)
}
generateUniqueCreditCardNumber = () => {
  // Generate a random 6-digit ID
  return Math.floor(Math.random() * 10000000000000000)
}
//------------------------------
server.get('/', (req, res) => {
  res.end('homepage')
})
//signup
//{
//     "name" : "ahmed",
// "password" : "password123",
// "dateOfBirth" : "17/01/2023",
// "mobileNumber" : "0508242474",
//   "email": "a@aol.com",
// }
server.post('/api/signup', async (req, res) => {
  const { name, password, dateOfBirth, mobileNumber, email } = req.body
  let id = generateUniqueId()
  //check if id is duplicate
  const isDuplicate = await isUserDuplicate(id)
  while (isDuplicate) {
    id = generateUniqueId()
  }
  //check if anything is duplicate
  //check if id is duplicate
  const isUniqueEmailMobileRet = await isUniqueEmailMobile(email, mobileNumber) //true if unique
  if (!isUniqueEmailMobileRet) {
    res.status(400).json({
      status: false,
      message: 'Email or Mobile Number already exists',
    })
    return
  }
  //DO THIS IN FRONTEND
  //---------------------------------
  //check if any field is empty
  if (!name || !dateOfBirth || !mobileNumber || !email || !password) {
    res
      .status(400)
      .json({ status: false, message: 'Please fill all the details' })
    return
  }
  //check if password is less than 8 characters
  if (password.length < 8) {
    res.status(400).json({
      status: false,
      message: 'Password should be atleast 8 characters',
    })
    return
  }
  //check if email is valid
  if (!email.includes('@')) {
    res
      .status(400)
      .json({ status: false, message: 'Please enter a valid email' })
    return
  }
  //---------------------------------
  const newUser = {
    id,
    name,
    password,
    dateOfBirth,
    mobileNumber,
    email,
    accounts: [],
  }
  const newUserInserted = await insertUser(newUser)
  if (!newUserInserted) {
    res.status(400).json({
      status: false,
      message: 'Error occurred while creating user',
    })
    return
  }
  //generate token
  const token = jwt.sign({ id: newUser.id }, 'yourSecretKey')
  res
    .status(200)
    .json({ status: true, message: 'User created successfully', id, token })
})
//login
// {
// "email": "ak@aol.com",
// "password" : "password123"

// }
//--------------------------
server.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    res
      .status(404)
      .json({ status: false, message: 'Please fill all the details' })
    return
  }

  const user = await findUserByEmailPassword(email, password)
  if (!user) {
    res.status(400).json({ status: false, message: 'Invalid credentials' })
    return
  }
  const token = jwt.sign({ id: user.id }, 'yourSecretKey')
  res
    .status(200)
    .json({ status: true, message: 'Login successful', id: user.id, token })
})
//create account
server.post('/api/createAccount', verifyToken, async (req, res) => {
  const userId = req.userId
  const balance = req.body.balance
  const accId = generateUniqueId()
  //check if id is duplicate
  const isDuplicate = await isAccountDuplicate(accId)
  while (isDuplicate) {
    accId = generateUniqueId()
  }
  const account = {
    id: accId,
    mainUsersIDs: [userId],
    subUsersIDs: [],
    balance,
    transactions: [],
    creditCard: {
      number: generateUniqueCreditCardNumber(),
      //set expiry date two years from today
      expiryDate: new Date()
        .setFullYear(new Date().getFullYear() + 2)
        .toString(), //check if this works
      cvv: Math.floor(Math.random() * 1000),
    },
  }
  //add account to account collection
  const accountInserted = await insertAccount(account)
  if (!accountInserted) {
    res.status(400).json({
      status: false,
      message: 'Error occurred while creating account',
    })
    return
  }
  //add account to user collection
  //note that this approach does not provide strong exception guarantee
  const addAccCount = await insertAccountToUser(userId, {
    accId: accId,
    status: 'main',
    balance: balance,
  })
  if (addAccCount === 0) {
    res.status(400).json({
      status: false,
      message: 'Error occurred while creating account',
    })
    return
  }
  res.status(200).json({
    status: true,
    message: 'Account created successfully',
    id: accId,
    // userId,
  })
})
//get all accounts (minimal details) (select account frontend view)
server.get('/api/getAllAccounts', verifyToken, async (req, res) => {
  const userId = req.userId
  const user = await findUserByID(userId)
  if (!user) {
    //would never happen since token is verified
    res.status(404).json({ status: false, message: 'User not found' })
    return
  }
  const userAccounts = user.accounts
  res.status(200).json({
    status: true,
    message: 'Accounts fetched successfully',
    accounts: userAccounts,
  })
})
//get 'one' account full details
server.get('/api/getAccountDetails/:id', verifyToken, async (req, res) => {
  const userId = req.userId
  const accId = req.params.id
  const account = await findAccountByID(accId)
  if (!account) {
    res.status(404).json({ status: false, message: 'Account not found' })
    return
  }
  if (
    !account.mainUsersIDs.includes(userId) &&
    !account.subUsersIDs.includes(userId)
  ) {
    res.status(401).json({ status: false, message: 'Access denied' })
    return
  }
  res.status(200).json({
    status: true,
    message: 'Account details fetched successfully',
    account,
  })
})
// add user to account
server.post('/api/addUser/:id', verifyToken, async (req, res) => {
  const accId = req.params.id
  const userId = req.userId
  const addedID = req.body.newID
  const newStatus = req.body.newStatus
  const newBalance = req.body.newBalance
  // const newUser =
  const account = await findAccountByID(accId)
  if (!account || !account.mainUsersIDs.includes(userId)) {
    res.status(401).json({ status: false, message: 'Access denied' })
    return
  }
  //check if newUser is same as main user
  if (addedID === userId) {
    res.status(400).json({
      status: false,
      message: 'You are already the main user of this account',
    })
    return
  }
  //check if newUser is already a user of this account
  if (
    account.mainUsersIDs.includes(addedID) ||
    account.subUsersIDs.includes(addedID)
  ) {
    res.status(400).json({
      status: false,
      message: 'User is already a user of this account',
    })
    return
  }

  if (newBalance > account.balance) {
    res.status(404).json({ status: false, message: 'Insufficient balance' })
    return
  }
  //add to user with addedID
  if (newStatus === 'main') {
    //add User to Account
    const addUserCount = await insertUserToAccount(accId, addedID, true)
    if (addUserCount === 0) {
      res.status(400).json({
        status: false,
        message: 'Error occurred while adding user to account',
      })
      return
    }
  } else if (newStatus === 'sub') {
    const addUserCountSub = await insertUserToAccount(accId, addedID, false)
    if (addUserCountSub === 0) {
      res.status(400).json({
        status: false,
        message: 'Error occurred while adding user to account',
      })
      return
    }
  } else {
    res.status(400).json({ status: false, message: 'Invalid Status' })
    return
  }
  const addAccCount = await insertAccountToUser(addedID, {
    accId: accId,
    status: newStatus,
    balance: newBalance,
  })
  res.status(200).json({
    status: true,
    message: 'User added successfully',
  })
})
server.post('/api/billPayment/:type/:id', verifyToken, async (req, res) => {
  const userId = req.userId
  const type = req.params.type
  const accId = req.params.id
  const amount = Number(req.body.amount)
  const monthlyRepeat = req.body.monthlyRepeat

  //not necessary given that we are using jwt
  // if (!account) {
  //   res.status(404).json({ status: false, message: 'Account not found' })
  //   return
  // }
  // if (!user) {
  //   res.status(404).json({ status: false, message: 'User not found' })
  //   return
  // }
  const account = await findAccountByID(accId)
  const user = await findUserByID(userId)
  if (!account || !account.mainUsersIDs.includes(userId)) {
    res.status(401).json({ status: false, message: 'Access denied' })
    return
  }
  if (!user) {
    res.status(401).json({ status: false, message: 'User not found' })
    return
  }
  const userAccount = user.accounts.find((acc) => acc.accId === accId)
  if (!userAccount) {
    res.status(401).json({ status: false, message: 'User not found' })
    return
  }
  if (amount > account.balance || amount < 0 || userAccount.balance < amount) {
    res.status(404).json({ status: false, message: 'Insufficient balance' })
    return
  }
  //add transaction
  const transaction = {
    type: type,
    desc: new Date().toLocaleDateString('en-GB'),
    amount: amount,
    userId: userId,
  }
  const insertTransactionCount = await insertTransaction(accId, transaction)
  if (insertTransactionCount === 0) {
    res.status(400).json({
      status: false,
      message: 'Error occurred while adding transaction',
    })
    return
  }
  //update balance from account and user
  const updateBalanceCount = await updateBalance(accId, userId, amount)
  if (updateBalanceCount === 0) {
    res.status(400).json({
      status: false,
      message: 'Error occurred while updating balance',
    })
    return
  }
  if (monthlyRepeat == 'false') {
    res.status(200).json({
      status: true,
      message: 'Bill paid successfully (one time)',
    })
    return
  }
  //execute function every month
  const today = new Date()
  const endDate = new Date(today.setDate(today.getDate() + 30))
  const endDateDay = endDate.getDate()
  const endDateMonth = endDate.getMonth() + 1
  const endDateYear = endDate.getFullYear()
  const cronExpression = `0 0 1 ${endDateDay} ${endDateMonth} *`
  cron.schedule(cronExpression, async () => {
    const account = await findAccountByID(accId)
    const user = await findUserByID(userId)
    const userAccount = user.accounts.find((acc) => acc.accId === accId)
    if (!account || !user || !userAccount) {
      res.status(404).json({ status: false, message: 'Account not found' })
      cron.stop()
      return
    }

    if (amount > account.balance || userAccount.balance < amount) {
      res.status(404).json({ status: false, message: 'Insufficient balance' })
      cron.stop()
      return
    }
    const insertTransactionCount = await insertTransaction(accId, transaction)
    if (insertTransactionCount === 0) {
      res.status(400).json({
        status: false,
        message: 'Error occurred while adding transaction',
      })
      return
    }
    //update balance from account and user
    const updateBalanceCount = await updateBalance(accId, userId, amount)
    if (updateBalanceCount === 0) {
      res.status(400).json({
        status: false,
        message: 'Error occurred while updating balance',
      })
      return
    }
  })
  //not necessary
  res.status(200).json({
    status: true,
    message: 'Bill paid successfully',
  })
})
server.post('/api/addDebit/:id', verifyToken, async (req, res) => {
  const userId = req.userId
  const accId = req.params.id
  const amount = Number(req.body.amount)
  const title = req.body.title
  const endDateDay = req.body.day
  const endDateMonth = req.body.month
  const endDateYear = req.body.year
  const endDate = new Date(endDateYear, endDateMonth, endDateDay)

  const account = await findAccountByID(accId)
  const user = await findUserByID(userId)
  const userAccount = user.accounts.find((acc) => acc.accId === accId)
  //not necessary given that we are using jwt
  if (!account || !user) {
    res
      .status(404)
      .json({ status: false, message: 'Account or User not found' })
    return
  }
  if (!account.mainUsersIDs.includes(userId)) {
    res.status(401).json({ status: false, message: 'Access denied' })
    return
  }
  if (amount > account.balance || amount < 0 || userAccount.balance < amount) {
    res.status(404).json({ status: false, message: 'Invalid amount' })
    return
  }
  const transaction = {
    type: title,
    desc: new Date().toLocaleDateString('en-GB'),
    amount: amount,
    userId: userId,
  }
  const insertTransactionCount = await insertTransaction(accId, transaction)
  if (insertTransactionCount === 0) {
    res.status(400).json({
      status: false,
      message: 'Error occurred while adding transaction',
    })
    return
  }
  //update balance from account and user
  const updateBalanceCount = await updateBalance(accId, userId, amount)
  if (updateBalanceCount === 0) {
    res.status(400).json({
      status: false,
      message: 'Error occurred while updating balance',
    })
    return
  }
  //if enddate is less than 30 days from today
  if (endDate < new Date().setDate(new Date().getDate() + 30)) {
    res.status(200).json({
      status: true,
      message: 'Debit added successfully (one time)',
    })
    return
  }
  //else.. execute function every month until the end date
  //execute function every month
  const today = new Date()
  const endDateX = new Date(today.setDate(today.getDate() + 30))
  const endDateDayX = endDateX.getDate()
  const endDateMonthX = endDateX.getMonth() + 1
  const endDateYearX = endDateX.getFullYear()
  const cronExpression = `0 0 1 ${endDateDayX} ${endDateMonthX} *`
  cron.schedule(cronExpression, async () => {
    //stop if end date is reached or has been passed
    if (endDate < new Date() || endDate == new Date()) {
      res.status(400).json({
        status: false,
        message: 'End date passed',
      })
      cron.stop()
      return
    }
    const account = await findAccountByID(accId)
    const user = await findUserByID(userId)
    const userAccount = user.accounts.find((acc) => acc.accId === accId)
    //not necessary given that we are using jwt
    if (!account || !user) {
      res
        .status(404)
        .json({ status: false, message: 'Account or User not found' })
      return
    }
    if (!account.mainUsersIDs.includes(userId)) {
      res.status(401).json({ status: false, message: 'Access denied' })
      return
    }
    if (
      amount > account.balance ||
      amount < 0 ||
      userAccount.balance < amount
    ) {
      res.status(404).json({ status: false, message: 'Invalid amount' })
      return
    }
    const transaction = {
      type: title,
      desc: new Date().toLocaleDateString('en-GB'),
      amount: amount,
      userId: userId,
    }
    const insertTransactionCount = await insertTransaction(accId, transaction)
    if (insertTransactionCount === 0) {
      res.status(400).json({
        status: false,
        message: 'Error occurred while adding transaction',
      })
      return
    }
    //update balance from account and user
    const updateBalanceCount = await updateBalance(accId, userId, amount)
    if (updateBalanceCount === 0) {
      res.status(400).json({
        status: false,
        message: 'Error occurred while updating balance',
      })
      return
    }
  })
  //not necessary
  res.status(200).json({
    status: true,
    message: 'Debit added successfully',
  })
})
server.post('/api/allowance/:id', verifyToken, async (req, res) => {
  const userId = req.userId
  const accId = req.params.id
  const amount = Number(req.body.amount)
  const transferToEmail = req.body.transferToEmail
  const instantTransfer = req.body.instantTransfer
  const account = await findAccountByID(accId)
  const user = await findUserByID(userId)
  //not necessary given that we are using jwt
  if (!account || !user) {
    res
      .status(404)
      .json({ status: false, message: 'Account or User not found' })
    return
  }
  if (!account.mainUsersIDs.includes(userId)) {
    res.status(401).json({ status: false, message: 'Access denied' })
    return
  }
  const userAccount = user.accounts.find((acc) => acc.accId === accId)
  if (!userAccount) {
    res.status(404).json({ status: false, message: 'Account not found' })
    return
  }
  if (amount > account.balance || amount < 0 || userAccount.balance < amount) {
    res.status(404).json({ status: false, message: 'Invalid amount' })
    return
  }
  const transferToUser = await findUserByEmail(transferToEmail)
  if (!transferToUser) {
    res
      .status(404)
      .json({ status: false, message: 'Transfer to user ID invalid' })
    return
  }
  if (
    !account.mainUsersIDs.includes(transferToUser.id) &&
    !account.subUsersIDs.includes(transferToUser.id)
  ) {
    res.status(404).json({ status: false, message: 'User not found' })
    return
  }
  const transaction = {
    type: 'transfer from ' + user.name,
    desc: new Date().toLocaleDateString('en-GB'),
    amount: amount,
    userId: userId,
  }
  const insertTransactionCount = await insertTransaction(accId, transaction)
  if (insertTransactionCount === 0) {
    res.status(400).json({
      status: false,
      message: 'Error occurred while adding transaction',
    })
    return
  }
  //update balance from account and user
  const updateBalanceCount = await updateBalance(accId, userId, amount)
  if (updateBalanceCount === 0) {
    res.status(400).json({
      status: false,
      message: 'Error occurred while updating balance',
    })
    return
  }
  //update balance from recepient user (no function used here)
  const result = await usersCollection.updateOne(
    { id: userId, 'accounts.accId': accId },
    { $inc: { 'accounts.$.balance': amount } }
  )
  if (result.modifiedCount === 0) {
    res.status(400).json({
      status: false,
      message: 'Error occurred while updating balance',
    })
    return
  }
  if (instantTransfer == 'true') {
    res.status(200).json({
      status: true,
      message: 'Allowance added successfully',
    })
    return
  }
  //else.. execute function every month
  const today = new Date()
  const endDate = new Date(today.setDate(today.getDate() + 30))
  const endDateDay = endDate.getDate()
  const endDateMonth = endDate.getMonth() + 1
  const endDateYear = endDate.getFullYear()
  const cronExpression = `0 0 1 ${endDateDay} ${endDateMonth} *`
  cron.schedule(cronExpression, async () => {
    //stop if balance is insufficient
    const account = await findAccountByID(accId)
    const user = await findUserByID(userId)
    const userAccount = user.accounts.find((acc) => acc.accId === accId)
    if (!account || !user || !userAccount) {
      res
        .status(404)
        .json({ status: false, message: 'Account or User not found' })
      cron.stop()
      return
    }
    if (amount > account.balance || userAccount.balance < amount) {
      res.status(404).json({ status: false, message: 'Insufficient balance' })
      cron.stop()
      return
    }
    const transaction = {
      type: 'transfer from ' + user.name,
      desc: new Date().toLocaleDateString('en-GB'),
      amount: amount,
      userId: userId,
    }
    const insertTransactionCount = await insertTransaction(accId, transaction)
    if (insertTransactionCount === 0) {
      res.status(400).json({
        status: false,
        message: 'Error occurred while adding transaction',
      })
      return
    }
    //update balance from account and user
    const updateBalanceCount = await updateBalance(accId, userId, amount)
    if (updateBalanceCount === 0) {
      res.status(400).json({
        status: false,
        message: 'Error occurred while updating balance',
      })
      return
    }
    //update balance from recepient user (no function used here)
    const result = await usersCollection.updateOne(
      { id: userId, 'accounts.accId': accId },
      { $inc: { 'accounts.$.balance': amount } }
    )
    if (result.modifiedCount === 0) {
      res.status(400).json({
        status: false,
        message: 'Error occurred while updating balance',
      })
      return
    }
  })
  //not needed
  res.status(200).json({
    status: true,
    message: 'Allowance added successfully',
  })
})
//chat bot when logged in..
//example : http://localhost:3000/api/chatbot/1224323?text=sayhi
server.get('/api/chatbot/:id', verifyToken, callprompt, (req, res) => {})
//--------------------404 ROUTES--------------------
server.get('*', (req, res) => {
  res.status(404).json({ status: false, message: 'Invalid route' })
})
server.post('*', (req, res) => {
  res.status(404).json({ status: false, message: 'Invalid route' })
})
server.put('*', (req, res) => {
  res.status(404).json({ status: false, message: 'Invalid route' })
})
server.delete('*', (req, res) => {
  res.status(404).json({ status: false, message: 'Invalid route' })
})
//--------------------END OF ROUTES--------------------
//development server
const port = 3000
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
// to do :
//integration with frontend
//2fa
