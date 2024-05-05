const usersRepository = require('./users-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');
const { func } = require('joi');

/**
 * Get list of users
 * @returns {Array}
 */

// untuk membuat pagination
async function getUsers(page_number, page_size, search, sort){
  // untuk membuat banyak data perhalaman
  const skip = (page_number - 1) * page_size;

  let filtrate = {};

  // kondisi untuk search
  if(search){
    filtrate = {email: {$regex: search, $options: 'i'}};
  }

  let sorting = {};

  // kondisi untuk melakukan sorting ascending dan descending
  if(sort){
    const [field, order] = sort.split(':');
    if (order === 'desc'){
      sorting[field] = -1;
    } else{
      sorting[field] = 1;
    }
  }

  const users = await usersRepository.userPaginate(filtrate, sorting, skip, page_size);
  const sum = await usersRepository.calculateUser(filtrate);

  return {results: users, total: sum};
}

// async function getUsers() {
//   const users = await usersRepository.getUsers();

//   const results = [];
//   for (let i = 0; i < users.length; i += 1) {
//     const user = users[i];
//     results.push({
//       id: user.id,
//       name: user.name,
//       email: user.email,
//     });
//   }

//   return results;
// }

/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, password) {
  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, hashedPassword, firstBalance);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {boolean}
 */
async function updateUser(id, name, email) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.updateUser(id, name, email);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {boolean}
 */
async function deleteUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.deleteUser(id);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Check whether the email is registered
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const user = await usersRepository.getUserByEmail(email);

  if (user) {
    return true;
  }

  return false;
}

/**
 * Check whether the password is correct
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPassword(userId, password) {
  const user = await usersRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const user = await usersRepository.getUser(userId);

  // Check if user not found
  if (!user) {
    return null;
  }

  const hashedPassword = await hashPassword(password);

  const changeSuccess = await usersRepository.changePassword(
    userId,
    hashedPassword
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}


// digital banking


async function Balance(id){
  const user = await usersRepository.getUser(id);
  return user.balance || 0;
}

// pada penarikan akan di kurangin dari jumlah balance yang sudah ada
async function Withdraw(id, amount){
  const user = await usersRepository.getUser(id);

  if (!user || user.balance < amount){
    return false;
  }


  user.balance -= amount;
  await usersRepository.Statement(id, {type: 'withdraw', amount})
  await user.save();
  
  
  return user.balance;
}

// pada setoran juga akan di hitung berdasarkan dana yang terakhir akan di tambahkan
async function Deposit(id, amount){
  const user = await usersRepository.getUser(id);

  if(!user){
    return false;
  }

  user.balance = (user.balance || 0) + amount;
  await usersRepository.Statement(id, {type: 'deposit', amount})
  await user.save();

  return user.balance;
}

async function Histori(id){
  return usersRepository.Histori(id);
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  emailIsRegistered,
  checkPassword,
  changePassword,
  Balance,
  Withdraw,
  Deposit,
  Histori,
};
