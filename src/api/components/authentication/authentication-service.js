const authenticationRepository = require('./authentication-repository');
const { generateToken } = require('../../../utils/session-token');
const { passwordMatched } = require('../../../utils/password');
const { attempt } = require('joi');
const { last } = require('lodash');



const failLogin = {};

function countFailLogin(email){
  const now = Date.now();
  if(!failLogin[email]){
    failLogin[email] = {attempt : 1, lastAttempt:now, };

  } else{
    failLogin[email].attempt++;
    failLogin[email].lastAttempt = now;
  }
}


const successLogin = {};

function countSuccessLogin(email){
  const now = Date.now();
  successLogin[email] = now;
}


function attemptLimit(email){
  const loginData = failLogin[email];

  if(!loginData){
    return false;
  }

  const now = Date.now();
  const pause = 60 * 30;

  if(now - loginData.lastAttempt > pause){
    delete failLogin[email];
    return false;
  }

  const maxFail = 5;
  return loginData.attempt >= maxFail;
}

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

  if (attemptLimit(email)){
    throw new Error(
      `[ ${new Date().toLocaleString()} ] User ${email} mencoba login, namun mendapat error 403 karena telah melebihi limit attempt.`
    );
  }
  const user = await authenticationRepository.getUserByEmail(email);

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
