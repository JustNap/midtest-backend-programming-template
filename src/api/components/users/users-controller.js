const usersService = require('./users-service');
const { errorResponder, errorTypes } = require('../../../core/errors');

/**
 * Handle get list of users request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUsers(request, response, next) {
  try {

    // validasi untuk respon
    const page_number = parseInt(request.query.page_number) || 1;
    const page_size = parseInt(request.query.page_size) || 5;
    const sort = request.query.sort || '';
    const search = request.query.search || '';

    const users = await usersService.getUsers(page_number, page_size, search, sort);
    
    // untuk membuat tampilan yang akan muncul di respon
    const data = {
      Page_Number: page_number,
      Page_Size: page_size,
      Count: users.total,
      Total_Page: Math.ceil(users.total / page_size),
      Has_Previous_Page: page_number > 1,
      Has_Next_Page: page_number < Math.ceil(users.total / page_size),
      Data: users.results.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email

      })),
    };


    return response.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle get user detail request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUser(request, response, next) {
  try {
    const user = await usersService.getUser(request.params.id);

    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown user');
    }

    return response.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle create user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function createUser(request, response, next) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const password = request.body.password;
    const password_confirm = request.body.password_confirm;

    // Check confirmation password
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.createUser(name, email, password);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create user'
      );
    }

    return response.status(200).json({ name, email });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle update user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function updateUser(request, response, next) {
  try {
    const id = request.params.id;
    const name = request.body.name;
    const email = request.body.email;

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.updateUser(id, name, email);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to update user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle delete user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function deleteUser(request, response, next) {
  try {
    const id = request.params.id;

    const success = await usersService.deleteUser(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle change user password request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function changePassword(request, response, next) {
  try {
    // Check password confirmation
    if (request.body.password_new !== request.body.password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Check old password
    if (
      !(await usersService.checkPassword(
        request.params.id,
        request.body.password_old
      ))
    ) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong password');
    }

    const changeSuccess = await usersService.changePassword(
      request.params.id,
      request.body.password_new
    );

    if (!changeSuccess) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to change password'
      );
    }

    return response.status(200).json({ id: request.params.id });
  } catch (error) {
    return next(error);
  }
}

// digital banking

// untuk melakukan check saldo pada id
async function Balance(request, response, next){
  try{
    const balance = await usersService.Balance(request.params.id);
    
    
    return response.status(200).json({balance});
  } catch (error){
    return next (error);
  }
}

// untuk melakukan penarikan dana, akan dilihat sesuai dengan id dan amountnya
async function Withdraw(request, response, next){
  try{
    const {id} = request.params;
    const {amount} = request.body;

    const success = await usersService.Withdraw(id, amount);
    if(!success){
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'fail to withdraw');
    }
    // agar data tersimpan di histori
    await usersService.Histori(id, {type: 'withdraw', amount})
    return response.status(200).json({message: 'Withdraw successfully'});
  }catch(error){
    return next(error);
  }
}

// untuk melakukan setoran pada amount yang berdasarkan id
async function Deposit(request, response, next){
  try{
    const {id} = request.params;
    const {amount} = request.body;

    const success = await usersService.Deposit(id, amount);
    if(!success){
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'fail to deposit');
    }
    // agar data tersimpan di histori
    await usersService.Histori(id, {type: 'deposit', amount})
    return response.status(200).json({message: 'deposit successfully'});
  }catch(error){
    return next(error);
  }
}

// untuk melihat transaksi yang sudah di lakukan sebelumnya
async function Histori(request, response, next){
  try{
    const transaction = await usersService.Histori(request.params.id);
    

    return response.status(200).json(transaction);
  }catch(error){
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  Balance,
  Withdraw,
  Deposit,
  Histori,
};
