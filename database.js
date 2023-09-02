import mysql from 'mysql2'
import dotenv from 'dotenv';

dotenv.config()



// * database credentials are located on .env
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    database: process.env.MYSQL_DATABASE,
    password: process.env.MYSQL_PASSWORD
}).promise()

/*
  ! always use export and async when creating a function
  * You can check the response of database here:
  * on terminal - node database.js
  *const user = await getUsers()
  *console.log(user); 


  TODO - Create functions for other table; getBalance
*/
export async function getUsers()
{
    const [rows] = await pool.query("SELECT * FROM Users");
    return rows
}

export async function checkCredentials(email, password) {
  const connection = await pool.getConnection(); // Get a connection from the pool

  try {
    const [rows] = await connection.query(`
      SELECT * 
      FROM Users
      WHERE email = ? AND password = ?
    `, [email, password]);

    const user = rows[0];

    if (!user) {
      return { error: 'Invalid email or password' };  
    }

    // If the email and password are correct, return the username
    return user.username;
  } finally {
    connection.release(); // Release the connection back to the pool
  }
}



export async function getUser(username)
{
   const [rows] = await pool.query(`
   SELECT * 
   FROM Users
   WHERE username = ?
   `, [username]);

   return rows[0]
}

export async function getBankAccountUser(user_id) {
  const [rows] = await pool.query(`
  SELECT * 
  FROM Accounts
  WHERE user_id = ?
  `, [user_id]);

  return rows[0];
}


export async function createUser(username, password, fullName, email, phone, address)
{
    const [rows] = await pool.query(`
    INSERT INTO Users (username, password, full_name, email, phone, address)
    VALUES (?,?,?,?,?,?)
    `, [username, password, fullName, email, phone, address])

    return getUser(username)
}

export async function updateUser(username, newUsername)
{
    const [rows] = await pool.query(`
    UPDATE Users
    SET username = ?
    WHERE username = ?;
    `, [username, newUsername])

    return getUser(username)
}

export async function updatePassword(username, newPassword) {

    const connection = await pool.getConnection();
    try {
      // Begin a transaction
      await connection.beginTransaction();
  
      // Update the user's password
      const updateQuery = `
        UPDATE Users
        SET PASSWORD = ?
        WHERE USERNAME = ?;
      `;
      await connection.query(updateQuery, [newPassword, username]);
  
      // Commit the transaction
      await connection.commit();
  
      return getUser(username)
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error; // Rethrow the error to be handled by the caller
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  }

export async function deleteUser(username) {
    const connection = await pool.getConnection();
    try {
      // Begin a transaction
      await connection.beginTransaction();
  
      // Delete the user
      const deleteQuery = `
        DELETE FROM Users
        WHERE USERNAME = ?;
      `;
      await connection.query(deleteQuery, [username]);
  
      // Commit the transaction
      await connection.commit();
  
      // Return true to indicate that the user was deleted successfully
      return getUsers();
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error; // Rethrow the error to be handled by the caller
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  }

  export async function createBankAccount(userId, accountId) {
    const connection = await pool.getConnection();
    try {
      // Begin a transaction
      await connection.beginTransaction();
  
      // Verify user existence
      const verifyUserQuery = `
        SELECT user_id FROM Users WHERE user_id = ?;
      `;
      const [userRows] = await connection.query(verifyUserQuery, [userId]);
  
      if (userRows.length === 0) {
        throw new Error('User does not exist.');
      }
  
      // Create the bank account
      const createAccountQuery = `
        INSERT INTO Accounts (account_id, user_id, balance)
        VALUES (?, ?, 0);
      `;
      await connection.query(createAccountQuery, [accountId, userId]);
  
      // Commit the transaction
      await connection.commit();
  
      // Return true to indicate that the bank account was created successfully
      return true;
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error; // Rethrow the error to be handled by the caller
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  }
  

  export async function GenerateAccountNumber() {
    const connection = await pool.getConnection();
    try {
      // Begin a transaction
      await connection.beginTransaction();
  
      let newAccountNumber;
      let exists = true;
  
      while (exists) {
        // Generate a new account number
        newAccountNumber = Math.floor(Math.random() * 900000) + 100000;
  
        // Check if the account number exists
        const checkQuery = `
          SELECT COUNT(*) AS count
          FROM Accounts
          WHERE account_id = ?;
        `;
        const [result] = await connection.query(checkQuery, [newAccountNumber]);
        exists = result[0].count > 0;
      }
  
      // Commit the transaction
      await connection.commit();
  
      // Return the generated account number
      return newAccountNumber;
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error; // Rethrow the error to be handled by the caller
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  }

  export async function insertBalance(accountId, amountToAdd) {
    const connection = await pool.getConnection();
    try {
      // Begin a transaction
      await connection.beginTransaction();
  
      // Get the current balance of the account
      const getBalanceQuery = `
        SELECT balance FROM Accounts WHERE account_id = ?;
      `;
      const [balanceRows] = await connection.query(getBalanceQuery, [accountId]);
  
      if (balanceRows.length === 0) {
        throw new Error('Account not found.');
      }
  
      const currentBalance = parseFloat(balanceRows[0].balance); // Convert to float
  
      // Calculate the new balance by adding the amount to the current balance
      const newBalance = currentBalance + parseFloat(amountToAdd); // Convert amountToAdd to float
  
      // Update the balance for the existing account
      const updateBalanceQuery = `
        UPDATE Accounts SET balance = ? WHERE account_id = ?;
      `;
      await connection.query(updateBalanceQuery, [newBalance, accountId]);
  
      // Commit the transaction
      await connection.commit();
  
      // Return the new balance after adding the amount
      return newBalance;
    } catch (error) {
      // Rollback the transaction in case of an error
      await connection.rollback();
      throw error; // Rethrow the error to be handled by the caller
    } finally {
      // Release the connection back to the pool
      connection.release();
    }
  }

  
 //const user = await insertBalance(507737, 5222123);
//console.log(user);