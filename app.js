import express from 'express'
import jwt from 'jsonwebtoken';
import cors from 'cors'; //CORS

import {getUsers, getUser, createUser, updatePassword, deleteUser, checkCredentials, GenerateAccountNumber, createBankAccount, getBankAccountUser} from './database.js'


const app = express()
app.use(cors()); //CORS
app.use(express.json())

/*
  README
  
  if you're new here, basically app.js is a server under express js.

  functions are exported from database.js -> see on line 5

  you can create more functions for manipulating the database on database.js
  
  mostly here are endpoints to connect to database
  
  express js is currently locally hosted using 8080

  to test app.js go to check-token comments
  
  or fetch using node.js

  I included a generating token every login / register under jsonwebtoken

  You can create a new file for jwt for better server understanding / optional

  middleware should always be included for fetching data from database or changing something in database

  tokens are returned when creating new account or loggin in

  ! Learn refresh token, exp, VULNERABILITY CONCERN

*/

//! Dont use this without middleware
//return all Users in ThunderClient
// '/users' is defined in the local host
// res.send is for retreving it in thunderclient
app.get("/users", async (req, res) => {
    const users = await getUsers()
    res.send(users);
}) 

//return the specific user 'username' that is typed in the http request
app.get("/users/:username", async (req, res) =>
{
    const username = req.params.username // for adding parameter in address
    const user = await getUser(username)
    res.send(user);
})

app.get("/accounts/:user_id", async (req, res) => {
  const user_id = req.params.user_id; // Get the user_id parameter from the URL
  const user = await getBankAccountUser(user_id); // Call the getUserInfo function to retrieve user information
  res.send(user); // Send the user information as the response
});

// * To post,get,patch on thunder client, run the server: npm run devStart
// * enter the api url + endpoint on thunderclient
// * DONT FORGET TO CHANGE THE REQUEST: POST / GET / PATCH / DELETE
// * http://localhost:8080/check-token
// * include the token on the header, authorization : Bearer _ [token]
// * If without Token, you can add a json if you will Post
// Example of adding to json 
/*
    {
        "name": "WAZUPO",
        "username": "HELLO",
        "password": "Sasdasdammpass",
        "isRegistered": 1,
        "age": 31
    }
*/
// TODO: change name to '/register'
// *Post data from json body into sql database users telling to create User
app.post("/users", async (req, res) => {
    const {username, password, full_name, email, phone, address} = req.body //Argument characters should match the keys in json content
    const user = await createUser(username, password, full_name, email, phone, address)
    
    //FOR CREATING TOKEN ON REGISTER
    const userAuth = {name: username}
    //After checking login, now creates a token
    const accessToken = jwt.sign(userAuth, process.env.ACCESS_TOKEN_SECRET) 

    //res.json({accessToken : accessToken}) 
    //res.status(201).send(user)

    // Returns token value
    res.json({ accessToken: accessToken, user: user });
})

// *Post to Accounts Schema to create bank account number
app.post('/create-bank-account', async (req, res) => {
  const {userId} = req.body;

  try {
    
    // Call the function to update the user's password
    const accountID = await GenerateAccountNumber();

    const createAccount = await createBankAccount(userId, accountID) 
    if (createAccount) 
    {
      res.status(200).send({ message: "Creating Account Successfull" });
    } else 
    {
      res.status(404).send({ message: "Not Successfull" });
    }
  } 
  catch (error) {
    res.status(500).send({ message: "error At something", error: error.message });
  }
 


});



//! Learn how to use database library to not use getUsers function

// TODO: Change endpoint name to /get-user-data
// * get data from database and returns the object of the user
// * this function is basically a 'SELECT * FROM Users;'

app.get('/check-token', authenticateToken, async(req, res) => {
  const authenticatedUsername = req.user.name; //authenticatedUsername is the username from the decrypt token
  const users = await getUsers()  // * Gets all username from db to verify the jwt username
  const userPreferences = users.filter(player => player.username === authenticatedUsername); //Verifies if db username == jwt username
  res.json(userPreferences); // ! If jwt username != db username - returns [empty] array
}); 










// * /login creates a jwt token to return to the client side when they fetch the endpoint
//TUser is just to add it to an object
// ! Json body should have email , password
app.post('/login', async(req, res) =>
{ 
    //Authenticate the User
    const {email, password} = req.body //Gets email and pass from json file
    const Tuser = await checkCredentials(email, password)
    const user = {name: Tuser}

    if (Tuser.error) {
      return res.status(401).json({ accessToken: 'invalid' });
    }
    else{
      //After checking login, now creates a token
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET) 

    res.json({accessToken : accessToken}) 
    }

    
})



//MiddleWare
// ! always use authenticateToken for most post / get functions
// * verifies the jwt token from users localStorage
// * Always add Bearer on front
// * Authorization : Bearer _ [token]
//Don't understand anything here, but it splits the keyword Bearer and the token (Bearer ' ')
function authenticateToken(req, res, next)
{
    const authHeader = req.headers['authorization'];
   const token = authHeader && authHeader.split(' ')[1] 

    if(token == null)
    {
        return res.sendStatus(401)
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => 
    {
        if (err) return res.sendStatus(403)
        req.user = user;
        next()
    })
}

// TODO: Add middleware here
// Endpoint to update a user's password
app.post("/users/update-password", async (req, res) => {
    const { username, newPassword } = req.body;
  
    try {
      // Call the function to update the user's password
      const updated = await updatePassword(username, newPassword);
  
      if (updated) {
        res.status(200).send({ message: "Password updated successfully." });
      } else {
        res.status(404).send({ message: "User not found or password could not be updated." });
      }
    } catch (error) {
      res.status(500).send({ message: "Error updating password.", error: error.message });
    }
  });

  // TODO: Add middleware here
  // Endpoint to delete a user
app.delete("/users/delete", async (req, res) => {
    const { username } = req.body;
  
    try {
      // Call the function to delete the user
      const deleted = await deleteUser(username);
  
      if (deleted) {
        res.status(200).send({ message: "User deleted successfully." });
      } else {
        res.status(404).send({ message: "User not found or could not be deleted." });
      }
    } catch (error) {
      res.status(500).send({ message: "Error deleting user.", error: error.message });
    }
  });
  



  

//error message 
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
  })

    // Prints if the server is successfull in 8080
  // 3306 doesnt work
  app.listen(8080, () =>{
    console.log('Server running on port 8080 FIREEEEE');
  })

