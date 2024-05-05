const authenticationRepository = require('./authentication-repository');
const { generateToken } = require('../../../utils/session-token');
const { passwordMatched } = require('../../../utils/password');
const { attempt } = require('joi');
const { last } = require('lodash');


// untuk menampung data yang gagal login
const failLogin = {};

// kondisi dimana kalau gagal login, akan di tampung lalu di hitung berapa kali gagal, dan juga menampilkan informasi jam 
function countFailLogin(email){
  const now = Date.now();
  if(!failLogin[email]){
    failLogin[email] = {attempt : 1, lastAttempt:now, };

  } else{
    failLogin[email].attempt++;
    failLogin[email].lastAttempt = now;
  }
}

// untuk menampung yang loginnya berhasil 
const successLogin = {};

//  menampilkan jam secara real time 
function countSuccessLogin(email){
  const now = Date.now();
  successLogin[email] = now;
}

// untuk perhitungan limit, sesuai dengan soal dimana limit yang di minta adalah 5 kali kesalahan
function attemptLimit(email){
  const loginData = failLogin[email];

  if(!loginData){
    return false;
  }

  const now = Date.now();
  // perhitungan lama resetnya 30 menit 
  const pause = 60 * 30;

  if(now - loginData.lastAttempt > pause){
    delete failLogin[email];
    return false;
  }

  // untuk gagal login max 5 kali
  const maxFail = 5;
  return loginData.attempt >= maxFail;
}

// untuk menampilkan user yang susah logout 
function logoutUser(email){
  const now = Date.now();
  const LastLog = successLogin[email];

  if (LastLog){
    console.log(
      `[ ${now} ] User ${email} berhasil logout`
    );
    delete successLogin[email];
  } else{
    console.log(`
    [ ${now} ] User ${email} gagal logout. User tidak ditemukan.`
  )
  }
}
/**
 * Check username and password for login.
 * @param {string} email - Email
 * @param {string} password - Password
 * @returns {object} An object containing, among others, the JWT token if the email and password are matched. Otherwise returns null.
 */
async function checkLoginCredentials(email, password) {
  // pesan kalau sudah gagal pada percobaan ke 6
  if (attemptLimit(email)){
    throw new Error(
      `[ ${new Date().toLocaleString()} ] User ${email} mencoba login, namun mendapat error 403 karena telah melebihi limit attempt.`
    );
  }
  const user = await authenticationRepository.getUserByEmail(email);
  // pesan untuk menampilkan gagal login dan hitungan sudah berapa kali gagal, dimulai dari 1
  if(!user){
    countFailLogin(email);
    throw new Error(
      `[ ${new Date().toLocaleString()} ] User ${email} gagal login. Attempt = ${failLogin[email].attempt}.`
    );
  }

  // We define default user password here as '<RANDOM_PASSWORD_FILTER>'
  // to handle the case when the user login is invalid. We still want to
  // check the password anyway, so that it prevents the attacker in
  // guessing login credentials by looking at the processing time.
  const userPassword = user ? user.password : '<RANDOM_PASSWORD_FILLER>';
  const passwordChecked = await passwordMatched(password, userPassword);

  // Because we always check the password (see above comment), we define the
  // login attempt as successful when the `user` is found (by email) and
  // the password matches.
  if (user && passwordChecked) {
    delete failLogin[email];
    return {
      email: user.email,
      name: user.name,
      user_id: user.id,
      token: generateToken(user.email, user.id),
    };
  } else{
    countFailLogin(email);
    throw new Error(
      `[ ${new Date().toLocaleString()} ] User ${email} gagal login. Attempt = ${failLogin[email].attempt}.`
    );
  }

}

module.exports = {
  checkLoginCredentials,
  logoutUser,
};
