# bankAPI
__This API repository is meant to be coupled with the bank webpage, which can be found in : [FamBank Github](https://github.com/akvnn/fambank) or [FamBank Webpage](https://fambank.onrender.com/)__
<br>
__Note that the API used for the webpage is hosted privately on Render__

bankAPI is a simple banking API that allows users to create accounts and manage their finances within a family setting.  <br>
It provides functionality for adding users to accounts, creating accounts, and performing transactions. <br>
The API is built using __Node.js, Express.js, and MongoDB__ for data storage. Additionally, it utilizes the __OpenAI API__ as a virtual assistant to provide helpful prompts and responses.

### Features
User registration and login functionality<br>
Account creation and management<br>
Transaction processing and balance updates<br>
Secure authentication using JWT (JSON Web Tokens) <br>
Integration with MongoDB for data persistence<br>
Natural language processing using the OpenAI API<br>
Scheduled events using node-cron <br>
### Prerequisites
Before running the API, make sure you install the dependencies required (given node.js is installed in your machine) using : <br>
`npm install`<br>
In addition, your openai API Key and MongoDB info are to be added in passwords.js  _(or just change the variables used)_ <br>
To start the server, simply run `node app.js` in the terminal
### API Endpoints
POST /api/signup: User registration endpoint. Creates a new user account.<br>
POST /api/login: User login endpoint. Authenticates the user and returns an access token.<br>
POST /api/createAccount: Account creation endpoint. Creates a new bank account.<br>
GET /api/getAllAccounts: Account retrieval endpoint. Returns all accounts associated with the authenticated user.<br>
GET /api/getAccountDetails/:id Account details retrieval endpoint. Returns detailed information about a specific account.<br>
POST /api/billPayment/:type/:id Pays a particular bill and deducts amount from user's balance. Includes a feature for automatic monthly payment.<br>
POST /api/addDebit/:id Deducts a particular amount from user's balance. Includes a feature for automatic monthly payment.<br>
POST /api/allowance/:id Assigns allowance (or instant transfer) to another specified user in the bank account. Includes a feature for automatic monthly transfer.<br>
GET /api/chatbot/:id OpenAI prompt execution endpoint. Sends a prompt to the OpenAI API and returns the generated response.<br>
### Security
bankAPI ensures secure communication between the client and server using JWT (JSON Web Tokens) for authentication. Make sure to include the access token in the Authorization header for protected endpoints.
### Credits
bankAPI is fully developed by myself _Akvn_ __@akvnn__ 
### License
bankAPI is under the __[MIT License](LICENSE)__. <br> Feel free to modify and customize the API according to your requirements.
