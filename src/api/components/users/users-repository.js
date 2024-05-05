const { func } = require('joi');
const { User } = require('../../../models');

/**
 * Get a list of users
 * @returns {Promise}
 */
async function getUsers() {
  return User.find({});
}

async function userPaginate(filtrate, sorting, skip, limit){
  return User.find(filtrate).sort(sorting).skip(skip).limit(limit);
}

async function calculateUser(filtrate){
  return User.countDocuments(filtrate);
}
/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function getUser(id) {
  return User.findById(id);
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Hashed password
 * @returns {Promise}
 */
async function createUser(name, email, password, firstBalance = 0) {
  return User.create({
    name,
    email,
    password,
    balance : firstBalance,
    transactions: []
  });
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {Promise}
 */
async function updateUser(id, name, email) {
  return User.updateOne(
    {
      _id: id,
    },
    {
      $set: {
        name,
        email,
      },
    }
  );
}

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function deleteUser(id) {
  return User.deleteOne({ _id: id });
}

/**
 * Get user by email to prevent duplicate email
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return User.findOne({ email });
}

/**
 * Update user password
 * @param {string} id - User ID
 * @param {string} password - New hashed password
 * @returns {Promise}
 */
async function changePassword(id, password) {
  return User.updateOne({ _id: id }, { $set: { password } });
}



// digital banking

async function Deposit(id, amount){
  return User.updateOne({_id: id}, {$inc: {balance: amount}});
}

async function Withdraw(id, amount){
  return User.updateOne(
    {_id: id, balance: {$gte: amount}}, 
    {$inc: {balance: -amount}});
}

async function Statement(id, transaction){
  return User.updateOne({_id: id}, {$push: {transactions: transaction}});
}

module.exports = {
  getUsers,
  getUser,
  userPaginate,
  calculateUser,
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  changePassword,
  Deposit,
  Withdraw,
  Statement,
};
