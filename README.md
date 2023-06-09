# bankAPI
__Note that this API repo is meant to be coupled with the bank webpage, which can be found in : underDevelopment__
__The live API for this project is hosted in Azure Cloud Services__

The Bank API is a simple banking API that allows users to create accounts and manage their finances within a family setting.  <br>
It provides functionality for adding users to accounts, creating accounts, and performing transactions. <br>
The API is built using __Node.js, Express.js, and MongoDB__ for data storage. Additionally, it utilizes the __OpenAI API__ as a virtual assistant to provide helpful prompts and responses.

### Features
User registration and login functionality<br>
Account creation and management<br>
Transaction processing and balance updates<br>
Secure authentication using JWT (JSON Web Tokens) <br>
Integration with MongoDB for data persistence<br>
Natural language processing using the OpenAI API<br>
node-cron for scheduled events <br>
### Prerequisites
Before running the API, make sure you install the dependencies required (given node.js is installed in your machine) using : <br>
`npm install`<br>
To start the server, simply run `node app.js` in the terminal
### API Endpoints
POST /api/signup: User registration endpoint. Creates a new user account.<br>
POST /api/login: User login endpoint. Authenticates the user and returns an access token.<br>
POST /api/createAccount: Account creation endpoint. Creates a new bank account.<br>
GET /api/getAllAccounts: Account retrieval endpoint. Returns all accounts associated with the authenticated user.<br>
GET /api/getAccountDetails/:id Account details retrieval endpoint. Returns detailed information about a specific account.<br>
POST /api/billPayment/:tyoe/:id Pays a particular bill and deducts amount from user's balance. Includes a feature for automatic monthly payment.<br>
POST /api/addDebit/:id Deducts a particular amount from user's balance. Includes a feature for automatic monthly payment.<br>
POST /api/allowance/:id Assigns allowance (or instant transfer) to another specified user in the bank account. Includes a feature for automatic monthly transfer.<br>
GET /api/chatbot/:id OpenAI prompt execution endpoint. Sends a prompt to the OpenAI API and returns the generated response.<br>
### Security
BankAPI ensures secure communication between the client and server using JWT (JSON Web Tokens) for authentication. Make sure to include the access token in the Authorization header for protected endpoints.
### Credits
bankAPI is fully developed by myself _Akvn_ __@akvnn__ 
### License
bankeAPI is under the __[MIT License](LICENSE)__. <br> Feel free to modify and customize the API according to your requirements.
__Note that this is a sample README file, and you should customize it based on your project's specific details and requirements.__
