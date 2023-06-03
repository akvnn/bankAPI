let accounts = [
  {
    id: 'testid',
    mainUsersIDs: ['123', '345'],
    subUsersIDs: ['123', '345'],
    balance: 500,
  },
]
let users = [
  {
    id: '123',
    name: 'john',
    password: 'test',
    dob: '17/01/2004',
    accounts: ['testid'],
    status: 'main',
    userBalance: 100,
  },
  {
    id: '345',
    name: 'someone',
    password: 'test',
    dob: '17/01/2004',
    accounts: ['testid'],
    status: 'main',
    userBalance: 400,
  },
]
module.exports = { accounts, users }
